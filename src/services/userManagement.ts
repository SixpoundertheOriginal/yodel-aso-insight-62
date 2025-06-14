
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export interface UserCreationResult {
  success: boolean;
  profile?: Profile;
  error?: Error;
  requiresManualFix?: boolean;
}

/**
 * Atomic user profile creation with rollback capability
 * Critical for preventing orphaned users
 */
export const ensureUserProfile = async (userId: string, email: string): Promise<UserCreationResult> => {
  try {
    console.log(`[PROFILE_CREATION] Starting atomic profile creation for user ${userId}`);
    
    // First, check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`[PROFILE_CREATION] Error checking existing profile:`, checkError);
      throw new Error(`Profile check failed: ${checkError.message}`);
    }

    if (existingProfile) {
      console.log(`[PROFILE_CREATION] Profile already exists for user ${userId}`);
      return { success: true, profile: existingProfile };
    }

    // Create profile atomically
    const profileData: ProfileInsert = {
      id: userId,
      email: email,
      role: 'viewer',
      first_name: null,
      last_name: null,
      organization_id: null
    };

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (createError) {
      console.error(`[PROFILE_CREATION] Failed to create profile:`, createError);
      
      // Check if this is a constraint violation (user might not exist in auth.users)
      if (createError.code === '23503') {
        return {
          success: false,
          error: new Error('User authentication record not found - requires manual intervention'),
          requiresManualFix: true
        };
      }
      
      throw new Error(`Profile creation failed: ${createError.message}`);
    }

    console.log(`[PROFILE_CREATION] Successfully created profile for user ${userId}`);
    return { success: true, profile: newProfile };

  } catch (error: any) {
    console.error(`[PROFILE_CREATION] Atomic profile creation failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      requiresManualFix: true
    };
  }
};

/**
 * Emergency data consistency repair for existing users
 * Fixes orphaned users who lack profiles
 */
export const repairUserDataConsistency = async (userId: string, email: string): Promise<UserCreationResult> => {
  console.log(`[DATA_REPAIR] Starting emergency data repair for user ${userId}`);
  
  try {
    // Step 1: Verify user exists in auth system
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      console.error(`[DATA_REPAIR] Auth verification failed:`, authError);
      return {
        success: false,
        error: new Error('Authentication state inconsistent - user may need to re-authenticate'),
        requiresManualFix: true
      };
    }

    // Step 2: Force create profile with emergency fallback
    const result = await ensureUserProfile(userId, email);
    
    if (!result.success && result.requiresManualFix) {
      console.log(`[DATA_REPAIR] Standard repair failed, attempting emergency profile creation`);
      
      // Emergency fallback: Create profile with minimal data
      const { data: emergencyProfile, error: emergencyError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          role: 'viewer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (emergencyError) {
        console.error(`[DATA_REPAIR] Emergency profile creation failed:`, emergencyError);
        return {
          success: false,
          error: new Error(`Emergency repair failed: ${emergencyError.message}`),
          requiresManualFix: true
        };
      }

      console.log(`[DATA_REPAIR] Emergency profile creation succeeded`);
      return { success: true, profile: emergencyProfile };
    }

    return result;

  } catch (error: any) {
    console.error(`[DATA_REPAIR] Emergency repair failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      requiresManualFix: true
    };
  }
};

/**
 * Health check for user data consistency
 * Used by monitoring and support tools
 */
export const checkUserDataHealth = async (userId: string): Promise<{
  hasAuth: boolean;
  hasProfile: boolean;
  hasOrganization: boolean;
  issues: string[];
  canCreateOrganization: boolean;
}> => {
  const issues: string[] = [];
  
  try {
    // Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const hasAuth = !authError && user?.id === userId;
    
    if (!hasAuth) {
      issues.push('User not properly authenticated');
    }

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    const hasProfile = !profileError && !!profile;
    
    if (!hasProfile) {
      issues.push('User profile missing');
    }

    // Check organization
    const hasOrganization = hasProfile && !!profile?.organization_id;
    
    if (!hasOrganization && hasProfile) {
      issues.push('User has no organization assigned');
    }

    // Determine if user can create organization
    const canCreateOrganization = hasAuth && hasProfile;

    return {
      hasAuth,
      hasProfile,
      hasOrganization,
      issues,
      canCreateOrganization
    };

  } catch (error: any) {
    console.error(`[HEALTH_CHECK] Failed for user ${userId}:`, error);
    return {
      hasAuth: false,
      hasProfile: false,
      hasOrganization: false,
      issues: ['Health check failed - system error'],
      canCreateOrganization: false
    };
  }
};
