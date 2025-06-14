
-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view apps in their organization" ON public.apps;
DROP POLICY IF EXISTS "Users can view metrics for their organization's apps" ON public.aso_metrics;
DROP POLICY IF EXISTS "Users can access cache for their organization" ON public.data_cache;
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON public.audit_logs;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (
    organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id = public.get_current_user_organization_id()
  );

CREATE POLICY "Users can view apps in their organization" ON public.apps
  FOR SELECT USING (
    organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY "Users can view metrics for their organization's apps" ON public.aso_metrics
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM public.apps a
      WHERE a.organization_id = public.get_current_user_organization_id()
    )
  );

CREATE POLICY "Users can access cache for their organization" ON public.data_cache
  FOR SELECT USING (
    cache_key LIKE (public.get_current_user_organization_id()::text || '%')
  );

CREATE POLICY "Users can view audit logs for their organization" ON public.audit_logs
  FOR SELECT USING (
    organization_id = public.get_current_user_organization_id()
  );

-- Add policies for INSERT, UPDATE, DELETE operations as needed
CREATE POLICY "Users can insert apps in their organization" ON public.apps
  FOR INSERT WITH CHECK (
    organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY "Users can insert metrics for their organization's apps" ON public.aso_metrics
  FOR INSERT WITH CHECK (
    app_id IN (
      SELECT a.id FROM public.apps a
      WHERE a.organization_id = public.get_current_user_organization_id()
    )
  );

CREATE POLICY "Users can insert cache for their organization" ON public.data_cache
  FOR INSERT WITH CHECK (
    cache_key LIKE (public.get_current_user_organization_id()::text || '%')
  );

CREATE POLICY "Users can update cache for their organization" ON public.data_cache
  FOR UPDATE USING (
    cache_key LIKE (public.get_current_user_organization_id()::text || '%')
  );

CREATE POLICY "Users can insert audit logs for their organization" ON public.audit_logs
  FOR INSERT WITH CHECK (
    organization_id = public.get_current_user_organization_id()
  );
