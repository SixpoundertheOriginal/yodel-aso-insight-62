
// Session state table helpers
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
export type CreationStep = 'start'|'create_user'|'verify_profile'|'assign_role'|'audit'|'finish'|'error';
export type CreationState = 'initiated'|'user_created'|'profile_verified'|'role_assigned'|'audit_logged'|'completed'|'failed';

export async function getSessionByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.from('admin_creation_sessions').select('*').eq('email', email).maybeSingle();
  if (error) return null;
  return data ?? null;
}

export async function createOrUpdateSession(supabase: any, email: string, ip_address: string, user_id: string | null, state: CreationState, step: CreationStep, error_details: string | null) {
  const session = await getSessionByEmail(supabase, email);
  if (!session) {
    await supabase.from('admin_creation_sessions').insert({
      email,
      ip_address,
      state,
      step,
      user_id,
      error_details,
    });
  } else {
    await supabase.from('admin_creation_sessions').update({
      state, step, user_id, error_details, updated_at: new Date().toISOString(),
    }).eq('email', email);
  }
}
