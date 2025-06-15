
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ValidationContext {
  user: any;
  supabase: any;
  organizationId?: string | null;
  ipAddress?: string;
}

export interface PermissionValidationResult {
  isValid: boolean;
  user?: any;
  organizationId?: string | null;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Enterprise Permission Validation Middleware
 * Provides zero-trust validation for all backend operations
 */
export class PermissionValidator {
  private supabase: any;
  
  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey);
  }

  /**
   * Validates user authentication and permission for a specific action
   */
  async validatePermission(
    authHeader: string | null,
    requiredPermission: string,
    targetOrganizationId?: string | null
  ): Promise<PermissionValidationResult> {
    // Step 1: Validate authentication
    if (!authHeader) {
      return {
        isValid: false,
        errorCode: 'AUTH_MISSING',
        errorMessage: 'Authentication required'
      };
    }

    // Step 2: Get user from auth header
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return {
        isValid: false,
        errorCode: 'AUTH_INVALID',
        errorMessage: 'Invalid authentication token'
      };
    }

    // Step 3: Check permission using service role client
    const { data: hasPermission, error: permissionError } = await this.supabase.rpc(
      'check_user_permission',
      {
        permission_to_check: requiredPermission,
        target_organization_id: targetOrganizationId
      }
    );

    if (permissionError) {
      console.error('[PERMISSION_MIDDLEWARE] Permission check error:', permissionError);
      return {
        isValid: false,
        errorCode: 'PERMISSION_ERROR',
        errorMessage: 'Permission validation failed'
      };
    }

    if (!hasPermission) {
      return {
        isValid: false,
        errorCode: 'PERMISSION_DENIED',
        errorMessage: `Access denied: missing permission '${requiredPermission}'`
      };
    }

    return {
      isValid: true,
      user,
      organizationId: targetOrganizationId
    };
  }

  /**
   * Validates platform-level admin access
   */
  async validatePlatformAdmin(authHeader: string | null): Promise<PermissionValidationResult> {
    return this.validatePermission(authHeader, 'admin.platform.access');
  }

  /**
   * Validates organization-level admin access
   */
  async validateOrganizationAdmin(
    authHeader: string | null, 
    organizationId: string
  ): Promise<PermissionValidationResult> {
    return this.validatePermission(authHeader, 'MANAGE_ORGANIZATION_USERS', organizationId);
  }

  /**
   * Creates standardized error response
   */
  createErrorResponse(
    result: PermissionValidationResult, 
    corsHeaders: Record<string, string>
  ): Response {
    const statusMap = {
      'AUTH_MISSING': 401,
      'AUTH_INVALID': 401,
      'PERMISSION_DENIED': 403,
      'PERMISSION_ERROR': 500
    };

    const status = statusMap[result.errorCode as keyof typeof statusMap] || 500;

    return new Response(
      JSON.stringify({
        error: result.errorMessage,
        code: result.errorCode
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Rate limiting helper for enterprise security
 */
export class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  static isRateLimited(
    identifier: string, 
    maxAttempts: number = 10, 
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (record.count >= maxAttempts) {
      return true;
    }

    record.count++;
    return false;
  }

  static createRateLimitResponse(corsHeaders: Record<string, string>): Response {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED'
      }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
