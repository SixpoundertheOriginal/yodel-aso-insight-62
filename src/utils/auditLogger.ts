
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

// Define a more specific payload to ensure type safety and required fields.
export interface AuditEventPayload extends Omit<AuditLogInsert, 'id' | 'created_at' | 'ip_address' | 'user_id' | 'details'> {
  organization_id: string; 
  action: string;
  user_id?: string; 
  details?: Record<string, any>;
}

/**
 * Logs a security-relevant event to the audit_logs table.
 * This is the new, centralized function for all audit logging.
 * It enforces that an organization_id is always provided.
 *
 * @param payload - The structured audit event data.
 */
export async function logAuditEvent(payload: AuditEventPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const finalUserId = payload.user_id || user?.id;
    
    if (!finalUserId) {
      console.warn('Audit log event skipped: No user ID could be determined.', { action: payload.action });
      return;
    }
    
    if (!payload.organization_id) {
        console.error('Audit log event failed: organization_id is missing.', { action: payload.action });
        return;
    }

    const { error } = await supabase.from('audit_logs').insert({
      ...payload,
      user_id: finalUserId,
      details: {
        ...payload.details,
        logged_at: new Date().toISOString(),
        client_context: {
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        }
      }
    });

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
}

