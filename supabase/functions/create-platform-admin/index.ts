
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { getCorsHeaders, validateEnvVars, validateRequestPermissions } from './adminValidator.ts';
import { getSessionByEmail, createOrUpdateSession, CreationState, CreationStep } from './adminSession.ts';
import { withAdminCreationLock } from './adminLocks.ts';
import { orchestrateAdminCreation } from './adminCreator.ts';
import { logAuditEvent } from './adminAuditor.ts';

const corsHeaders = getCorsHeaders();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ENVIRONMENT = Deno.env.get('ENVIRONMENT');
const DEFAULT_ADMIN_EMAIL = Deno.env.get('DEFAULT_ADMIN_EMAIL');

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // 1. Permissions & environment validation
  const authHeader = req.headers.get('Authorization');
  const valEnv = validateEnvVars();
  if (!valEnv.valid) {
    return new Response(
      JSON.stringify({ success: false, message: valEnv.message }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const valAuth = await validateRequestPermissions(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, authHeader);
  if (!valAuth.isValid) {
    return new Response(
      JSON.stringify({ success: false, message: valAuth.message }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const userId = valAuth.user?.id;

  // 2. Lock: serializes all coordinator requests
  const response = await withAdminCreationLock(supabaseAdmin, async () => {
    // 3. Enforce one super admin per platform
    const { data: roles, error } = await supabaseAdmin.from('user_roles').select('id').eq('role', 'SUPER_ADMIN').is('organization_id', null);
    if ((roles?.length ?? 0) > 0) {
      return new Response(JSON.stringify({ success: false, message: 'Platform administrator already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // 4. Parse request
    const body = req.method === 'POST' ? await req.json() : {};
    const email = body.email || DEFAULT_ADMIN_EMAIL;
    const password = body.temporaryPassword || generateSecurePassword();
    if (!email) {
      return new Response(JSON.stringify({ success: false, message: 'Admin email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // 5. Orchestrate creation, session-tracked
    try {
      const sessionTracker = (email: string, ip: string, userId: string|null, state: CreationState, step: CreationStep, err: string|null) =>
        createOrUpdateSession(supabaseAdmin, email, ip, userId, state, step, err);
      const { success, createdUserId } = await orchestrateAdminCreation({
        supabase: supabaseAdmin,
        email,
        password,
        ip: clientIp,
        requestUserId: userId,
        sessionTracker
      });
      if (!success || !createdUserId) throw new Error('Admin creation failed');

      // 6. Audit log write
      await logAuditEvent(supabaseAdmin, {
        user_id: createdUserId,
        email,
        role: 'SUPER_ADMIN',
        environment: ENVIRONMENT,
        created_by: userId || 'SYSTEM',
        ip_address: clientIp
      });

      // 7. Finalize session
      await createOrUpdateSession(supabaseAdmin, email, clientIp, createdUserId, 'completed', 'finish', null);

      const duration = Date.now() - startTime;
      return new Response(JSON.stringify({
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
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return new Response(JSON.stringify({
        success: false,
        message: 'Admin creation failed. Please check server logs for details.',
        error: error?.message || String(error)
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
  return response;
});

