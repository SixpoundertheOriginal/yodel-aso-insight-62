
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { PermissionValidator, RateLimiter } from '../_shared/permissionMiddleware.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_CREATION_ENABLED = Deno.env.get('ADMIN_CREATION_ENABLED');
const ENVIRONMENT = Deno.env.get('ENVIRONMENT');
const DEFAULT_ADMIN_EMAIL = Deno.env.get('DEFAULT_ADMIN_EMAIL');
const MAX_ADMIN_ATTEMPTS = parseInt(Deno.env.get('MAX_ADMIN_ATTEMPTS') || '3');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
type CreationStep = 'start'|'create_user'|'verify_profile'|'assign_role'|'audit'|'finish'|'error';
type CreationState =
  'initiated'|'user_created'|'profile_verified'|'role_assigned'|'audit_logged'|'completed'|'failed';

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}
function validateEnvironment(): { valid: boolean; message?: string } {
  if (ADMIN_CREATION_ENABLED !== 'true') {
    return { valid: false, message: 'Admin creation is disabled in this environment' };
  }
  if (!ENVIRONMENT || !['development', 'staging'].includes(ENVIRONMENT.toLowerCase())) {
    return { valid: false, message: 'Admin creation only allowed in development or staging environments' };
  }
  return { valid: true };
}

async function getSessionByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('admin_creation_sessions')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    console.error('[SESSION] Lookup error:', error);
    return null;
  }
  return data ?? null;
}

async function createOrUpdateSession(email: string, ip_address: string, user_id?: string | null, state?: CreationState, step?: CreationStep, err?: string) {
  // Insert or update the session
  let result;
  if (!(await getSessionByEmail(email))) {
    // Insert
    result = await supabaseAdmin.from('admin_creation_sessions')
      .insert({
        email,
        ip_address,
        state: state ?? 'initiated',
        step: step ?? 'start',
        user_id: user_id || null,
        error_details: err ?? null,
      });
  } else {
    // Update
    result = await supabaseAdmin.from('admin_creation_sessions')
      .update({
        state: state ?? undefined,
        step: step ?? undefined,
        user_id: user_id ?? undefined,
        updated_at: new Date().toISOString(),
        error_details: err ?? undefined
      })
      .eq('email', email);
  }
  if (result.error) console.warn('[SESSION] Upsert failed:', result.error);
  return result.data;
}

async function deleteSession(email: string) {
  const { error } = await supabaseAdmin.from('admin_creation_sessions').delete().eq('email', email);
  if (error) { console.warn('[SESSION] Delete error:', error); }
}

async function getExistingSuperAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'SUPER_ADMIN')
      .is('organization_id', null);
    if (error) throw error;
    return { exists: (data?.length ?? 0) > 0, count: data?.length ?? 0 };
  } catch (err) {
    console.error('DB error getExistingSuperAdmin:', err);
    throw err;
  }
}

async function withAdminCreationLock<T>(fn: () => Promise<T>): Promise<T> {
  // Use advisory lock helpers (must always unlock)
  await supabaseAdmin.rpc('lock_platform_admin_creation');
  try {
    return await fn();
  } finally {
    await supabaseAdmin.rpc('unlock_platform_admin_creation');
  }
}

// Main orchestrator using session state machine
async function orchestrateAdminCreation(
  email: string,
  password: string,
  clientIp: string,
  requestUserId?: string
): Promise<AdminCreationResponse> {
  let createdUserId: string | null = null;
  await createOrUpdateSession(email, clientIp, null, 'initiated', 'start');
  try {
    // Step A: Create user
    await createOrUpdateSession(email, clientIp, null, 'initiated', 'create_user');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: 'Platform', last_name: 'Administrator' }
    });
    if (authError) throw new Error(`Failed to create user account: ${authError.message}`);
    if (!authData.user) throw new Error('User creation succeeded but no user data returned');
    createdUserId = authData.user.id;
    await createOrUpdateSession(email, clientIp, createdUserId, 'user_created', 'verify_profile');

    // Step B: Wait for profile creation trigger
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', createdUserId)
      .maybeSingle();
    if (profileError) throw new Error('Profile creation verification failed');
    if (!profileData) throw new Error('Profile was not created by database trigger');
    await createOrUpdateSession(email, clientIp, createdUserId, 'profile_verified', 'assign_role');

    // Step C: Assign SUPER_ADMIN role
    const { error: roleError } = await supabaseAdmin.rpc('assign_super_admin_role', { target_user_id: createdUserId });
    if (roleError) throw new Error(`Failed to assign SUPER_ADMIN role: ${roleError.message}`);
    await createOrUpdateSession(email, clientIp, createdUserId, 'role_assigned', 'audit');

    // Step D: Write audit log
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: createdUserId,
        action: 'PLATFORM_ADMIN_CREATED',
        resource_type: 'USER_ROLE',
        resource_id: createdUserId,
        details: {
          email,
          role: 'SUPER_ADMIN', environment: ENVIRONMENT, created_by: requestUserId || 'SYSTEM'
        },
        ip_address: clientIp
      });
    if (auditError) console.warn('[AUDIT] Logging failed:', auditError);
    await createOrUpdateSession(email, clientIp, createdUserId, 'audit_logged', 'finish');

    // Step E: Mark session completed
    await createOrUpdateSession(email, clientIp, createdUserId, 'completed', 'finish');

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
  } catch (error: any) {
    await createOrUpdateSession(email, clientIp, createdUserId, 'failed', 'error', error?.message ?? String(error));
    // Rollback auth user if created
    if (createdUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      } catch (rollbackError) {
        console.error('[ROLLBACK] Delete user failed:', rollbackError);
      }
    }
    throw error;
  } finally {
    // Optionally, clean up old sessions after success
    // Not deleting on failure/logging purposes
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    if (RateLimiter.isRateLimited(`admin-creation:${clientIp}`, 3, 3600000)) {
      return RateLimiter.createRateLimitResponse(corsHeaders);
    }
    const validator = new PermissionValidator(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const authHeader = req.headers.get('Authorization');
    const validation = await validator.validatePlatformAdmin(authHeader);
    if (!validation.isValid) {
      return validator.createErrorResponse(validation, corsHeaders);
    }
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, message: 'Operation not permitted in this environment' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Advisory lock for the entire admin creation operation (ensures serial execution)
    return await withAdminCreationLock(async () => {
      // Check one super admin rule
      const adminCheck = await getExistingSuperAdmin();
      if (adminCheck.exists) {
        return new Response(
          JSON.stringify({ success: false, message: 'Platform administrator already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Parse request data
      const body: AdminCreationRequest = req.method === 'POST' ? await req.json() : {};
      const email = body.email || DEFAULT_ADMIN_EMAIL;
      const password = body.temporaryPassword || generateSecurePassword();
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, message: 'Admin email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Orchestrate creation with session state machine
      try {
        const result = await orchestrateAdminCreation(email, password, clientIp, validation.user?.id);
        const duration = Date.now() - startTime;
        console.log(`[ADMIN_CREATION] Success in ${duration}ms for email=${email}`);
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[ADMIN_CREATION] Failed in ${duration}ms:`, error);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Admin creation failed. Please check server logs for details.',
            error: error?.message || String(error)
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ADMIN_CREATION] Operation failed after ${duration}ms:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Admin creation failed. Please check server logs for details.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
