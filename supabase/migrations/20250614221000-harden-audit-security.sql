
-- Phase 1: Harden Audit Security

-- Step 1: Add new permissions for viewing audit logs.
-- This provides granular control over who can see audit trails.
INSERT INTO public.permissions (name, description)
VALUES
  ('VIEW_ORGANIZATION_AUDIT_LOGS', 'Can view the audit logs for their own organization'),
  ('PLATFORM_VIEW_ALL_AUDIT_LOGS', 'SUPER_ADMIN: Can view audit logs for all organizations')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Assign the new permissions to relevant roles.
-- By default, only organization admins can view their audit logs.
INSERT INTO public.role_permissions (role, permission_name)
VALUES
  ('ORGANIZATION_ADMIN', 'VIEW_ORGANIZATION_AUDIT_LOGS'),
  ('SUPER_ADMIN', 'VIEW_ORGANIZATION_AUDIT_LOGS'), -- Super admin can also view logs within an org context
  ('SUPER_ADMIN', 'PLATFORM_VIEW_ALL_AUDIT_LOGS')
ON CONFLICT (role, permission_name) DO NOTHING;

-- Step 3: Drop existing, potentially insecure RLS policies on the audit_logs table.
-- This ensures a clean slate before applying new, more secure policies.
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs for their organization" ON public.audit_logs;
DROP POLICY IF EXISTS "Super Admins can manage all logs" ON public.audit_logs;

-- Step 4: Create new, permission-based RLS policies for the audit_logs table.

-- SELECT Policy: Users can view logs if they have the 'VIEW_ORGANIZATION_AUDIT_LOGS' permission.
CREATE POLICY "Users with permission can view organization audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.check_user_permission('VIEW_ORGANIZATION_AUDIT_LOGS', organization_id));

-- INSERT Policy: Authenticated users can insert log entries for an organization they are a part of.
-- 'VIEW_DASHBOARD' is a proxy for "is a member of the organization".
CREATE POLICY "Authenticated users can insert audit logs for their organization"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (public.check_user_permission('VIEW_DASHBOARD', organization_id));

-- SUPER_ADMIN Policy: Super Admins can view all logs across the platform.
CREATE POLICY "Super Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.check_user_permission('PLATFORM_VIEW_ALL_AUDIT_LOGS'));

-- By omitting UPDATE/DELETE policies, logs are effectively immutable.

