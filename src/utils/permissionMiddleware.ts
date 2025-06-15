
// Browser-compatible permission middleware for client-side validation
// Note: Edge Functions use the Deno version in supabase/functions/_shared/

import { supabase } from '@/integrations/supabase/client';

export interface PermissionValidationResult {
  isValid: boolean;
  user?: any;
  organizationId?: string | null;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Client-side Permission Validator for browser environment
 * This mirrors the Edge Function validation but works in the browser
 */
export class ClientPermissionValidator {
  /**
   * Validates user permission for a specific action
   */
  async validatePermission(
    requiredPermission: string,
    targetOrganizationId?: string | null
  ): Promise<PermissionValidationResult> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          isValid: false,
          errorCode: 'AUTH_INVALID',
          errorMessage: 'Authentication required'
        };
      }

      const { data: hasPermission, error: permissionError } = await supabase.rpc(
        'check_user_permission',
        {
          permission_to_check: requiredPermission,
          target_organization_id: targetOrganizationId
        }
      );

      if (permissionError) {
        console.error('[CLIENT_PERMISSION] Permission check error:', permissionError);
        return {
          isValid: false,
          errorCode: 'PERMISSION_ERROR',
          errorMessage: 'Permission validation failed'
        };
      }

      return {
        isValid: !!hasPermission,
        user,
        organizationId: targetOrganizationId
      };

    } catch (error) {
      console.error('[CLIENT_PERMISSION] Validation error:', error);
      return {
        isValid: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Permission validation failed'
      };
    }
  }

  /**
   * Validates platform-level admin access
   */
  async validatePlatformAdmin(): Promise<PermissionValidationResult> {
    return this.validatePermission('admin.platform.access');
  }
}

// Export singleton instance for client use
export const clientPermissionValidator = new ClientPermissionValidator();
