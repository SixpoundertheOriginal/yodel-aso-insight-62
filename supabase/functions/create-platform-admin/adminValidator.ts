
// Input/environment/auth/permission validation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

export function validateEnvVars() {
  const ADMIN_CREATION_ENABLED = Deno.env.get('ADMIN_CREATION_ENABLED');
  const ENVIRONMENT = Deno.env.get('ENVIRONMENT');
  if (ADMIN_CREATION_ENABLED !== 'true') {
    return { valid: false, message: 'Admin creation is disabled in this environment' }
  }
  if (!ENVIRONMENT || !['development', 'staging'].includes(ENVIRONMENT.toLowerCase())) {
    return { valid: false, message: 'Admin creation allowed only in dev or staging environments' }
  }
  return { valid: true }
}

export async function validateRequestPermissions(supabaseUrl: string, serviceRole: string, authHeader: string | null) {
  const supabase = createClient(supabaseUrl!, serviceRole!);
  if (!authHeader) {
    return { isValid: false, message: 'Authorization required', user: null }
  }
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace(/^Bearer /, ''));
  if (error || !user) {
    return { isValid: false, message: 'User authentication failed', user: null }
  }
  // The DB-level RLS/CheckUserPermission will still enforce checks, but here we do a fast path
  return { isValid: true, user }
}
