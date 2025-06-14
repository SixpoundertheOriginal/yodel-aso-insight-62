
-- Create organizations/clients table for multi-tenancy
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create apps table to track different apps being monitored
CREATE TABLE public.apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bundle_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, bundle_id, platform)
);

-- Create traffic sources lookup table
CREATE TABLE public.traffic_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default traffic sources
INSERT INTO public.traffic_sources (name, display_name) VALUES
  ('app_store_search', 'App Store Search'),
  ('app_store_browse', 'App Store Browse'),
  ('apple_search_ads', 'Apple Search Ads'),
  ('web_referrer', 'Web Referrer'),
  ('app_referrer', 'App Referrer'),
  ('unknown', 'Unknown');

-- Create ASO metrics table for time series data
CREATE TABLE public.aso_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  traffic_source_id UUID REFERENCES public.traffic_sources(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app_id, traffic_source_id, date)
);

-- Create data cache table for optimized queries
CREATE TABLE public.data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit log table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aso_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create RLS policies for profiles
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Create RLS policies for apps
CREATE POLICY "Users can view apps in their organization" ON public.apps
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create RLS policies for ASO metrics
CREATE POLICY "Users can view metrics for their organization's apps" ON public.aso_metrics
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM public.apps a
      INNER JOIN public.profiles p ON a.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Create RLS policies for data cache
CREATE POLICY "Users can access cache for their organization" ON public.data_cache
  FOR SELECT USING (
    cache_key LIKE (
      SELECT p.organization_id::text || '%' 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Create RLS policies for audit logs
CREATE POLICY "Users can view audit logs for their organization" ON public.audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance (removed the problematic partial index)
CREATE INDEX idx_aso_metrics_app_date ON public.aso_metrics(app_id, date DESC);
CREATE INDEX idx_aso_metrics_date ON public.aso_metrics(date DESC);
CREATE INDEX idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX idx_apps_organization ON public.apps(organization_id);
CREATE INDEX idx_data_cache_expires ON public.data_cache(expires_at);
CREATE INDEX idx_audit_logs_organization_created ON public.audit_logs(organization_id, created_at DESC);

-- Create function to clean expired cache
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.data_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
