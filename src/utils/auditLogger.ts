
import { supabase } from '@/integrations/supabase/client';

export async function logAdminAction(action: string, details: any = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action: `admin.${action}`,
      resource_type: 'admin_action',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
