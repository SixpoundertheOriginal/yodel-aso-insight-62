
-- Grant INSERT permission on the organizations table to authenticated users
GRANT INSERT ON TABLE public.organizations TO authenticated;

-- It's also good practice to ensure SELECT is granted for general use by authenticated users
-- if they are expected to select specific organizations based on RLS.
-- The existing RLS policy "Users can view their organization" already handles row-level access for SELECT.
-- Let's also ensure the authenticated role has general SELECT privilege on the table,
-- which RLS will then filter.
GRANT SELECT ON TABLE public.organizations TO authenticated;

-- Similarly, for profiles, ensure authenticated users can select and update (RLS will filter rows).
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- For apps
GRANT SELECT, INSERT ON TABLE public.apps TO authenticated;

-- For aso_metrics
GRANT SELECT, INSERT ON TABLE public.aso_metrics TO authenticated;

-- For data_cache
GRANT SELECT, INSERT, UPDATE ON TABLE public.data_cache TO authenticated;

-- For audit_logs
GRANT SELECT, INSERT ON TABLE public.audit_logs TO authenticated;

