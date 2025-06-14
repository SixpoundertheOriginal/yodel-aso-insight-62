
-- Add enterprise subscription fields to existing organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active'
  CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS api_limits JSONB DEFAULT '{"requests_per_hour": 1000, "exports_per_day": 10}',
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Update existing organizations with proper defaults
UPDATE public.organizations 
SET 
  subscription_tier = COALESCE(subscription_tier, 'free'),
  subscription_status = COALESCE(subscription_status, 'active'),
  settings = COALESCE(settings, '{}'),
  api_limits = COALESCE(api_limits, '{"requests_per_hour": 1000, "exports_per_day": 10, "apps_limit": 3}'),
  features = COALESCE(features, '{"basic_analytics": true, "data_export": true}')
WHERE subscription_tier IS NULL OR settings IS NULL;
