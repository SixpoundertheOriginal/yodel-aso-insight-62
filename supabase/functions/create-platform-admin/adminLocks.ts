
// Advisory lock helpers for singleton admin creation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
export async function withAdminCreationLock(supabase: any, fn: () => Promise<any>): Promise<any> {
  await supabase.rpc('lock_platform_admin_creation');
  try {
    return await fn();
  } finally {
    await supabase.rpc('unlock_platform_admin_creation');
  }
}
