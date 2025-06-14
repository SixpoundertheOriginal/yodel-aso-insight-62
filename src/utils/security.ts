
/**
 * Security utilities for enterprise platform administration
 */

/**
 * Generate a cryptographically secure password
 * @param length - Password length (default: 16)
 * @returns Secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
};

/**
 * Validate environment for sensitive operations
 * @param allowedEnvironments - List of allowed environment names
 * @returns Validation result
 */
export const validateEnvironment = (allowedEnvironments: string[] = ['development', 'staging']): boolean => {
  const currentEnv = import.meta.env.MODE || 'production';
  return allowedEnvironments.includes(currentEnv.toLowerCase());
};

/**
 * Check if current environment is development
 * @returns True if in development mode
 */
export const isDevelopmentEnvironment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

/**
 * Sanitize error messages for client consumption
 * @param error - Original error
 * @param includeDetails - Whether to include detailed error info (dev only)
 * @returns Sanitized error message
 */
export const sanitizeErrorMessage = (error: unknown, includeDetails: boolean = false): string => {
  if (!includeDetails) {
    return 'An error occurred. Please contact your administrator.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
};
