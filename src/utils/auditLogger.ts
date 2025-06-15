import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

// Define a more specific payload to ensure type safety and required fields.
export interface AuditEventPayload extends Omit<AuditLogInsert, 'id' | 'created_at' | 'ip_address' | 'user_id' | 'details'> {
  organization_id?: string | null; // Changed: Made optional for platform-level actions
  action: string;
  user_id?: string; 
  details?: Record<string, any>;
}

/**
 * Logs a security-relevant event to the audit_logs table.
 * This is the new, centralized function for all audit logging.
 * It is designed to handle both tenant-specific and platform-level events.
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
    
    // Enhanced validation: platform-level actions require proper permission validation
    if (!payload.organization_id) {
      // For platform-level actions, verify the user has appropriate permissions
      const { data: hasPermission } = await supabase.rpc('check_user_permission', {
        permission_to_check: 'PLATFORM_CREATE_AUDIT_LOGS'
      });
      
      if (!hasPermission) {
        console.warn(
          'Platform-level audit action attempted without proper permissions',
          { action: payload.action, userId: finalUserId }
        );
        return;
      }
    }

    const { error } = await supabase.from('audit_logs').insert({
      ...payload,
      user_id: finalUserId,
      organization_id: payload.organization_id || null,
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
      if (error.message.includes('new row violates row-level security policy')) {
        console.error(
          `Audit Log RLS Policy Violation: The action '${payload.action}' could not be logged. User may lack required permissions.`,
          { error: error.message, userId: finalUserId, organizationId: payload.organization_id }
        );
      } else {
        console.error('Failed to write audit log:', error);
      }
    }

  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
}

/**
 * A specific helper for logging platform-level admin actions where there is no organization context.
 * This is a wrapper around logAuditEvent and is re-introduced to fix build errors.
 *
 * @param action The specific action being logged (e.g., 'view_admin_setup_granted').
 * @param details Additional details about the event.
 */
export async function logAdminAction(action: string, details?: Record<string, any>) {
  await logAuditEvent({
    action,
    resource_type: 'platform', // FIX: Provide a resource_type for platform actions.
    details,
    // organization_id is intentionally omitted for platform-level events.
  });
}
