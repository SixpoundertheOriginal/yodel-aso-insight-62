
import { supabase } from '@/integrations/supabase/client';
import { generateSecurePassword, sanitizeErrorMessage, isDevelopmentEnvironment } from '@/utils/security';

export interface AdminCreationRequest {
  email?: string;
  temporaryPassword?: string;
}

export interface AdminCreationResponse {
  success: boolean;
  message: string;
  adminId?: string;
  temporaryPassword?: string;
  nextSteps?: string[];
}

export interface AdminStatusResponse {
  exists: boolean;
  canCreate: boolean;
  environment: string;
  message: string;
}

/**
 * Check if platform admin can be created
 * @returns Admin creation status
 */
export const checkAdminCreationStatus = async (): Promise<AdminStatusResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-platform-admin', {
      method: 'GET'
    });

    if (error) {
      console.error('Error checking admin status:', error);
      return {
        exists: true,
        canCreate: false,
        environment: 'unknown',
        message: 'Unable to verify admin status'
      };
    }

    return {
      exists: false,
      canCreate: true,
      environment: isDevelopmentEnvironment() ? 'development' : 'production',
      message: 'Platform admin can be created'
    };
  } catch (error) {
    console.error('Admin status check failed:', error);
    return {
      exists: true,
      canCreate: false,
      environment: 'unknown',
      message: sanitizeErrorMessage(error, isDevelopmentEnvironment())
    };
  }
};

/**
 * Create platform administrator
 * @param request - Admin creation request
 * @returns Creation result with credentials
 */
export const createPlatformAdmin = async (request: AdminCreationRequest = {}): Promise<AdminCreationResponse> => {
  try {
    console.log('[ADMIN_SERVICE] Initiating platform admin creation...');
    
    const { data, error } = await supabase.functions.invoke('create-platform-admin', {
      method: 'POST',
      body: {
        email: request.email,
        temporaryPassword: request.temporaryPassword || generateSecurePassword()
      }
    });

    if (error) {
      console.error('[ADMIN_SERVICE] Admin creation failed:', error);
      throw new Error(error.message || 'Failed to create platform administrator');
    }

    console.log('[ADMIN_SERVICE] Platform admin created successfully');
    return data as AdminCreationResponse;
  } catch (error) {
    console.error('[ADMIN_SERVICE] Admin creation error:', error);
    throw new Error(sanitizeErrorMessage(error, isDevelopmentEnvironment()));
  }
};

/**
 * Validate admin creation prerequisites
 * @returns Validation result
 */
export const validateAdminCreationPrerequisites = (): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check if we're in development environment
  if (!isDevelopmentEnvironment()) {
    issues.push('Admin creation is only available in development environment');
  }

  // Check if necessary environment variables might be configured
  // Note: We can't directly access edge function env vars from client
  // This is just basic client-side validation
  
  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Get admin setup documentation
 * @returns Setup instructions
 */
export const getAdminSetupInstructions = (): string[] => {
  return [
    '1. Ensure you are in a development or staging environment',
    '2. Verify that ADMIN_CREATION_ENABLED is set to "true" in Supabase secrets',
    '3. Confirm no existing platform administrator exists',
    '4. Click "Create Platform Admin" to generate the administrator account',
    '5. Save the temporary password securely',
    '6. Sign in immediately and change the password',
    '7. Configure additional organization administrators as needed'
  ];
};
