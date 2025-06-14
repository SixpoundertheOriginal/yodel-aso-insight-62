
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enterprise security configuration
const ADMIN_CREATION_ENABLED = Deno.env.get('ADMIN_CREATION_ENABLED');
const ENVIRONMENT = Deno.env.get('ENVIRONMENT');
const DEFAULT_ADMIN_EMAIL = Deno.env.get('DEFAULT_ADMIN_EMAIL');
const MAX_ADMIN_ATTEMPTS = parseInt(Deno.env.get('MAX_ADMIN_ATTEMPTS') || '3');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface AdminCreationRequest {
  email?: string;
  temporaryPassword?: string;
}

interface AdminCreationResponse {
  success: boolean;
  message: string;
  adminId?: string;
  temporaryPassword?: string;
  nextSteps?: string[];
}

// Generate cryptographically secure temporary password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

// Check if environment allows admin creation
function validateEnvironment(): { valid: boolean; message?: string } {
  if (ADMIN_CREATION_ENABLED !== 'true') {
    return { valid: false, message: 'Admin creation is disabled in this environment' };
  }
  
  if (!ENVIRONMENT || !['development', 'staging'].includes(ENVIRONMENT.toLowerCase())) {
    return { valid: false, message: 'Admin creation only allowed in development or staging environments' };
  }
  
  return { valid: true };
}

// Check if SUPER_ADMIN already exists
async function checkExistingSuperAdmin(): Promise<{ exists: boolean; count: number }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'SUPER_ADMIN')
      .is('organization_id', null);

    if (error) {
      console.error('Error checking existing super admin:', error);
      throw new Error('Failed to verify existing admin status');
    }

    return { exists: (data?.length || 0) > 0, count: data?.length || 0 };
  } catch (error) {
    console.error('Database error checking super admin:', error);
    throw error;
  }
}

// Create auth user and assign SUPER_ADMIN role atomically
async function createPlatformAdmin(email: string, password: string, clientIp: string): Promise<AdminCreationResponse> {
  console.log(`[ADMIN_CREATION] Starting atomic admin creation for ${email}`);
  
  let createdUserId: string | null = null;
  
  try {
    // Step 1: Create auth user with service role
    console.log('[ADMIN_CREATION] Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Platform',
        last_name: 'Administrator'
      }
    });

    if (authError) {
      console.error('[ADMIN_CREATION] Auth user creation failed:', authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation succeeded but no user data returned');
    }

    createdUserId = authData.user.id;
    console.log(`[ADMIN_CREATION] Auth user created successfully: ${createdUserId}`);

    // Step 2: Wait for profile creation trigger (give it a moment)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify profile was created by the trigger
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', createdUserId)
      .maybeSingle();

    if (profileError) {
      console.error('[ADMIN_CREATION] Profile verification failed:', profileError);
      throw new Error('Profile creation verification failed');
    }

    if (!profileData) {
      throw new Error('Profile was not created by database trigger');
    }

    console.log('[ADMIN_CREATION] Profile creation verified');

    // Step 3: Assign SUPER_ADMIN role using database function
    console.log('[ADMIN_CREATION] Assigning SUPER_ADMIN role...');
    const { error: roleError } = await supabaseAdmin.rpc('assign_super_admin_role', {
      target_user_id: createdUserId
    });

    if (roleError) {
      console.error('[ADMIN_CREATION] Role assignment failed:', roleError);
      throw new Error(`Failed to assign SUPER_ADMIN role: ${roleError.message}`);
    }

    console.log('[ADMIN_CREATION] SUPER_ADMIN role assigned successfully');

    // Step 4: Audit logging
    console.log('[ADMIN_CREATION] Creating audit log...');
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: createdUserId,
        action: 'PLATFORM_ADMIN_CREATED',
        resource_type: 'USER_ROLE',
        resource_id: createdUserId,
        details: {
          email: email,
          role: 'SUPER_ADMIN',
          environment: ENVIRONMENT,
          created_by: 'SYSTEM'
        },
        ip_address: clientIp
      });

    if (auditError) {
      console.warn('[ADMIN_CREATION] Audit logging failed (non-critical):', auditError);
    }

    console.log(`[ADMIN_CREATION] Platform admin creation completed successfully for ${email}`);

    return {
      success: true,
      message: 'Platform administrator created successfully',
      adminId: createdUserId,
      temporaryPassword: password,
      nextSteps: [
        'Sign in with the provided credentials',
        'Change your password immediately',
        'Configure additional organization administrators',
        'Review security settings and permissions'
      ]
    };

  } catch (error) {
    console.error(`[ADMIN_CREATION] Admin creation failed:`, error);
    
    // Rollback: Delete auth user if it was created
    if (createdUserId) {
      console.log(`[ADMIN_CREATION] Rolling back - deleting auth user ${createdUserId}`);
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        console.log('[ADMIN_CREATION] Rollback successful - auth user deleted');
      } catch (rollbackError) {
        console.error('[ADMIN_CREATION] Rollback failed - manual cleanup required:', rollbackError);
      }
    }

    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  console.log(`[ADMIN_CREATION] Request received from IP: ${clientIp}`);

  try {
    // Multi-layer security validation
    console.log('[ADMIN_CREATION] Validating environment security...');
    
    // Layer 1: Environment protection
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.warn(`[ADMIN_CREATION] Environment validation failed: ${envValidation.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Operation not permitted in this environment' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Layer 2: Single admin enforcement
    console.log('[ADMIN_CREATION] Checking for existing SUPER_ADMIN...');
    const adminCheck = await checkExistingSuperAdmin();
    if (adminCheck.exists) {
      console.warn(`[ADMIN_CREATION] SUPER_ADMIN already exists (count: ${adminCheck.count})`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Platform administrator already exists' 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body: AdminCreationRequest = req.method === 'POST' ? await req.json() : {};
    const email = body.email || DEFAULT_ADMIN_EMAIL;
    const password = body.temporaryPassword || generateSecurePassword();

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Admin email is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create platform admin
    const result = await createPlatformAdmin(email, password, clientIp);
    
    const duration = Date.now() - startTime;
    console.log(`[ADMIN_CREATION] Total execution time: ${duration}ms`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ADMIN_CREATION] Operation failed after ${duration}ms:`, error);

    // Security-conscious error response (no internal details)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Admin creation failed. Please check server logs for details.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
