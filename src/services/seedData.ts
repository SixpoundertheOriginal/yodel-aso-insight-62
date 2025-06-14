import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/utils/stringUtils';
import type { Database } from '@/integrations/supabase/types';
import { ensureUserProfile, repairUserDataConsistency } from './userManagement';
import { assignUserRole } from './roleManagement';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type App = Database['public']['Tables']['apps']['Row'];
type AppInsert = Database['public']['Tables']['apps']['Insert'];
type AsoMetricInsert = Database['public']['Tables']['aso_metrics']['Insert'];

export interface OrganizationCreationResult {
  success: boolean;
  organization?: Organization;
  error?: Error;
  userRepaired?: boolean;
}

const seedAsoData = async (appId: string): Promise<void> => {
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const asoData: AsoMetricInsert = {
      app_id: appId,
      date: dateString,
      impressions: Math.floor(Math.random() * 1000),
      downloads: Math.floor(Math.random() * 100),
      page_views: Math.floor(Math.random() * 500),
    };

    const { error } = await supabase
      .from('aso_metrics')
      .insert(asoData);

    if (error) {
      console.error('Failed to seed ASO data:', error);
      throw new Error(`ASO data seeding failed: ${error.message}`);
    }
  }
};

export const createDemoOrganization = async (userId: string, email: string): Promise<OrganizationCreationResult> => {
  console.log(`[DEMO_ORG] Starting demo organization creation for user ${userId}`);
  
  try {
    let userRepaired = false;
    
    // Health check and repair
    const healthCheckResult = await repairUserDataConsistency(userId, email);
    if (!healthCheckResult.success) {
      console.warn(`[DEMO_ORG] User data health check failed:`, healthCheckResult.error);
      if (healthCheckResult.requiresManualFix) {
        return {
          success: false,
          error: new Error('User account requires manual repair. Please contact support.'),
        };
      } else {
        // Attempt to repair user data automatically
        console.log(`[DEMO_ORG] Attempting to repair user data automatically`);
        const repairResult = await repairUserDataConsistency(userId, email);
        if (!repairResult.success) {
          console.error(`[DEMO_ORG] User data repair failed:`, repairResult.error);
          return {
            success: false,
            error: new Error(`Failed to repair user data: ${repairResult.error?.message}`),
          };
        } else {
          console.log(`[DEMO_ORG] User data repaired successfully`);
          userRepaired = true;
        }
      }
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`[DEMO_ORG] Failed to fetch profile:`, profileError);
      return {
        success: false,
        error: new Error(`Failed to fetch profile: ${profileError.message}`),
      };
    }

    // Create organization
    const organizationData: OrganizationInsert = {
      name: `${profile?.first_name || 'Demo'} Organization`,
      slug: generateSlug(`${profile?.first_name || 'demo'}-org-${Date.now()}`)
    };

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert(organizationData)
      .select()
      .single();

    if (orgError) {
      console.error(`[DEMO_ORG] Failed to create organization:`, orgError);
      throw new Error(`Organization creation failed: ${orgError.message}`);
    }

    console.log(`[DEMO_ORG] Created organization: ${organization.id}`);

    // Update user profile with organization_id
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ organization_id: organization.id })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error(`[DEMO_ORG] Failed to update profile:`, profileUpdateError);
      throw new Error(`Profile update failed: ${profileUpdateError.message}`);
    }

    // Assign ORGANIZATION_ADMIN role to the user
    const roleResult = await assignUserRole(userId, 'ORGANIZATION_ADMIN', organization.id);
    if (!roleResult.success) {
      console.error(`[DEMO_ORG] Failed to assign role:`, roleResult.error);
      throw new Error(`Role assignment failed: ${roleResult.error?.message}`);
    }

    // Create demo app
    const appData: AppInsert = {
      organization_id: organization.id,
      app_name: 'Demo App',
      bundle_id: 'com.example.demo',
      platform: 'ios',
      app_store_id: '123456789',
      created_by: userId,
    };

    const { data: app, error: appError } = await supabase
      .from('apps')
      .insert(appData)
      .select()
      .single();

    if (appError) {
      console.error(`[DEMO_ORG] Failed to create app:`, appError);
      throw new Error(`App creation failed: ${appError.message}`);
    }

    console.log(`[DEMO_ORG] Created app: ${app.id}`);

    // Seed ASO data
    await seedAsoData(app.id);

    console.log(`[DEMO_ORG] Demo organization setup completed successfully for user ${userId}`);
    return { 
      success: true, 
      organization,
      userRepaired
    };

  } catch (error: any) {
    console.error(`[DEMO_ORG] Demo organization setup failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
