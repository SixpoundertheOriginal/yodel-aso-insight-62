
import { supabase } from '@/integrations/supabase/client';
import { ensureUserProfile, repairUserDataConsistency, checkUserDataHealth } from './userManagement';
import type { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type App = Database['public']['Tables']['apps']['Row'];

interface CreateDemoResult {
  success: boolean;
  organization?: Organization;
  error?: Error;
  userRepaired?: boolean;
}

export const createDemoOrganization = async (userId: string, userEmail: string): Promise<CreateDemoResult> => {
  console.log(`[DEMO_ORG] Starting demo organization creation for user ${userId}`);
  
  try {
    // PHASE 0: Crisis Containment - Ensure user profile exists
    console.log(`[DEMO_ORG] Phase 0: Ensuring user profile exists`);
    
    let profileResult = await ensureUserProfile(userId, userEmail);
    let userRepaired = false;
    
    // If profile creation failed, attempt emergency repair
    if (!profileResult.success) {
      console.log(`[DEMO_ORG] Profile creation failed, attempting emergency repair`);
      profileResult = await repairUserDataConsistency(userId, userEmail);
      userRepaired = true;
      
      if (!profileResult.success) {
        console.error(`[DEMO_ORG] Emergency repair failed, cannot proceed`);
        return {
          success: false,
          error: new Error(`Critical error: Cannot create user profile. ${profileResult.error?.message || 'Unknown error'}`),
          userRepaired: false
        };
      }
    }

    // Verify user can create organization
    const healthCheck = await checkUserDataHealth(userId);
    if (!healthCheck.canCreateOrganization) {
      console.error(`[DEMO_ORG] User health check failed:`, healthCheck.issues);
      return {
        success: false,
        error: new Error(`User not ready for organization creation: ${healthCheck.issues.join(', ')}`),
        userRepaired
      };
    }

    console.log(`[DEMO_ORG] User profile verified, proceeding with organization creation`);

    // PHASE 1: Create organization
    const orgSlug = `demo-org-${userId.slice(0, 8)}-${Date.now()}`;
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Demo Organization',
        slug: orgSlug,
      })
      .select()
      .single();

    if (orgError) {
      console.error(`[DEMO_ORG] Organization creation failed:`, orgError);
      
      // Provide specific error handling for RLS issues
      if (orgError.code === '42501') {
        return {
          success: false,
          error: new Error('Permission denied: User profile may be corrupted. Please try signing out and back in.'),
          userRepaired
        };
      }
      
      throw new Error(`Organization creation failed: ${orgError.message}`);
    }

    console.log(`[DEMO_ORG] Organization created: ${organization.id}`);

    // PHASE 2: Assign user to organization
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
        organization_id: organization.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error(`[DEMO_ORG] Profile update failed:`, profileUpdateError);
      
      // Attempt to cleanup organization if profile update fails
      await supabase.from('organizations').delete().eq('id', organization.id);
      
      throw new Error(`Failed to assign user to organization: ${profileUpdateError.message}`);
    }

    console.log(`[DEMO_ORG] User assigned to organization`);

    // PHASE 3: Create demo app
    const { data: demoApp, error: appError } = await supabase
      .from('apps')
      .insert({
        organization_id: organization.id,
        name: 'Demo Mobile App',
        bundle_id: 'com.demo.mobileapp',
        platform: 'ios',
      })
      .select()
      .single();

    if (appError) {
      console.error(`[DEMO_ORG] Demo app creation failed:`, appError);
      // Don't fail the entire process for demo app creation
      console.log(`[DEMO_ORG] Continuing without demo app`);
    } else {
      console.log(`[DEMO_ORG] Demo app created: ${demoApp.id}`);

      // PHASE 4: Create sample metrics (optional)
      try {
        await createSampleMetrics(demoApp.id);
        console.log(`[DEMO_ORG] Sample metrics created`);
      } catch (metricsError) {
        console.error(`[DEMO_ORG] Sample metrics creation failed:`, metricsError);
        // Non-critical error, continue
      }
    }

    console.log(`[DEMO_ORG] Demo organization setup completed successfully`);
    
    return {
      success: true,
      organization,
      userRepaired
    };

  } catch (error: any) {
    console.error(`[DEMO_ORG] Critical error during demo organization creation:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      userRepaired: false
    };
  }
};

const createSampleMetrics = async (appId: string): Promise<void> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const sampleData = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    sampleData.push({
      app_id: appId,
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 10000) + 1000,
      downloads: Math.floor(Math.random() * 500) + 50,
      page_views: Math.floor(Math.random() * 2000) + 200,
    });
  }

  const { error } = await supabase
    .from('aso_metrics')
    .insert(sampleData);

  if (error) {
    throw error;
  }
};
