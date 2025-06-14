
import { supabase } from '@/integrations/supabase/client';

// Function to seed demo data for testing
export const seedDemoData = async (organizationId: string) => {
  try {
    // Create demo apps
    const { data: appsData, error: appsError } = await supabase
      .from('apps')
      .insert([
        {
          organization_id: organizationId,
          name: 'TUI Mobile App',
          bundle_id: 'com.tui.mobile',
          platform: 'ios'
        },
        {
          organization_id: organizationId,
          name: 'YodelDelivery',
          bundle_id: 'com.yodel.delivery',
          platform: 'ios'
        }
      ])
      .select();

    if (appsError) throw appsError;

    // Get traffic sources
    const { data: trafficSources, error: sourcesError } = await supabase
      .from('traffic_sources')
      .select('*');

    if (sourcesError) throw sourcesError;

    // Generate demo metrics for the last 30 days
    const metricsToInsert = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (const app of appsData) {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        for (const source of trafficSources) {
          const impressions = Math.floor(Math.random() * 5000) + 500;
          const pageViews = Math.floor(impressions * (0.1 + Math.random() * 0.3));
          const downloads = Math.floor(pageViews * (0.05 + Math.random() * 0.15));
          
          metricsToInsert.push({
            app_id: app.id,
            traffic_source_id: source.id,
            date: d.toISOString().split('T')[0],
            impressions,
            downloads,
            page_views: pageViews,
            conversion_rate: pageViews > 0 ? (downloads / pageViews) : 0
          });
        }
      }
    }

    // Insert metrics in batches to avoid hitting limits
    const batchSize = 100;
    for (let i = 0; i < metricsToInsert.length; i += batchSize) {
      const batch = metricsToInsert.slice(i, i + batchSize);
      const { error: metricsError } = await supabase
        .from('aso_metrics')
        .insert(batch);

      if (metricsError) {
        console.error('Error inserting metrics batch:', metricsError);
      }
    }

    console.log('Demo data seeded successfully');
    return { success: true };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return { success: false, error };
  }
};

// Function to create a demo organization and assign user to it
export const createDemoOrganization = async (userId: string, userEmail: string) => {
  try {
    // Create demo organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Demo Organization',
        slug: `demo-org-${Date.now()}`
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Update user profile with organization
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: orgData.id,
        role: 'admin'
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Seed demo data for the organization
    await seedDemoData(orgData.id);

    return { success: true, organization: orgData };
  } catch (error) {
    console.error('Error creating demo organization:', error);
    return { success: false, error };
  }
};
