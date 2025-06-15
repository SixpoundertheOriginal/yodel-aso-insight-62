
// User creation, rollback, and profile verification
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import type { CreationStep, CreationState } from './adminSession.ts';

export async function orchestrateAdminCreation({
  supabase,
  email,
  password,
  ip,
  requestUserId,
  sessionTracker
}: {
  supabase: any, email: string, password: string, ip: string, requestUserId?: string,
  sessionTracker: (email: string, ip: string, userId: string|null, state: CreationState, step: CreationStep, err: string|null) => Promise<void>,
}) {
  let createdUserId: string | null = null;
  await sessionTracker(email, ip, null, 'initiated', 'start', null);

  try {
    await sessionTracker(email, ip, null, 'initiated', 'create_user', null);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: 'Platform', last_name: 'Administrator' }
    });
    if (authError) throw new Error(`Failed to create user: ${authError.message}`);
    if (!authData.user) throw new Error('User not returned from createUser');
    createdUserId = authData.user.id;
    await sessionTracker(email, ip, createdUserId, 'user_created', 'verify_profile', null);

    await new Promise(r => setTimeout(r, 1000));
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').eq('id', createdUserId).maybeSingle();
    if (profileError) throw new Error('Profile verification failed');
    if (!profileData) throw new Error('Profile not created');
    await sessionTracker(email, ip, createdUserId, 'profile_verified', 'assign_role', null);

    const { error: roleError } = await supabase.rpc('assign_super_admin_role', { target_user_id: createdUserId });
    if (roleError) throw new Error(`SUPER_ADMIN role assignment failed: ${roleError.message}`);
    await sessionTracker(email, ip, createdUserId, 'role_assigned', 'audit', null);

    return { success: true, createdUserId };
  } catch (error: any) {
    await sessionTracker(email, ip, createdUserId, 'failed', 'error', error?.message ?? String(error));
    // Rollback user if created
    if (createdUserId) {
      try { await supabase.auth.admin.deleteUser(createdUserId); }
      catch {}
    }
    throw error;
  }
}
