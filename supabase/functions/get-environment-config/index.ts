import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getHasPermission(supabase: SupabaseClient): Promise<boolean> {
  // A SUPER_ADMIN should have access. We check for a specific permission for other roles.
  // This assumes 'SUPER_ADMIN' role is managed in your `user_roles` table.
  try {
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .is('organization_id', null); // FIX: Use .is() for NULL checks, which is safer than .eq().

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return false;
    }

    if (userRoles?.some(r => r.role === 'SUPER_ADMIN')) {
      return true;
    }

    // Fallback to check for a specific permission if needed for other roles
    const { data: hasPermission, error: rpcError } = await supabase.rpc('check_user_permission', {
      permission_to_check: 'admin.platform.access',
    });
    
    if (rpcError) {
      console.error('Error checking permission via RPC:', rpcError);
      return false;
    }
    
    return hasPermission || false;

  } catch (e) {
    console.error('Exception in getHasPermission:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const hasPermission = await getHasPermission(supabase);
    
    const host = req.headers.get('host') || '';
    let environment = 'production';
    
    // Updated environment detection to include Lovable.dev domains
    if (host.includes('localhost') || 
        host.includes('127.0.0.1') || 
        host.includes('lovableproject.com') ||
        host.includes('lovable.dev')) {
      environment = 'development';
    } else if (host.includes('staging') || host.includes('preview')) {
      environment = 'staging';
    }

    const features = {
      adminControls: (environment === 'development' && hasPermission),
      debugMode: environment !== 'production',
    };

    return new Response(JSON.stringify({
      environment,
      features,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
