
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { PermissionValidator, RateLimiter } from '../../../src/utils/permissionMiddleware.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting: 60 requests per minute per IP
    if (RateLimiter.isRateLimited(`env-config:${clientIp}`, 60, 60000)) {
      return RateLimiter.createRateLimitResponse(corsHeaders);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize permission validator with service role credentials
    const validator = new PermissionValidator(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate platform admin access using our new permission
    const validation = await validator.validatePlatformAdmin(authHeader);
    
    if (!validation.isValid) {
      return validator.createErrorResponse(validation, corsHeaders);
    }

    // Determine environment based on host
    const host = req.headers.get('host') || '';
    let environment = 'production';
    
    if (host.includes('localhost') || 
        host.includes('127.0.0.1') || 
        host.includes('lovableproject.com') ||
        host.includes('lovable.dev')) {
      environment = 'development';
    } else if (host.includes('staging') || host.includes('preview')) {
      environment = 'staging';
    }

    // Feature flags based on permission validation and environment
    const features = {
      adminControls: validation.isValid && (environment === 'development' || environment === 'staging'),
      debugMode: environment !== 'production',
    };

    return new Response(JSON.stringify({
      environment,
      features,
      timestamp: new Date().toISOString(),
      user: {
        id: validation.user?.id,
        email: validation.user?.email
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ENV_CONFIG] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
