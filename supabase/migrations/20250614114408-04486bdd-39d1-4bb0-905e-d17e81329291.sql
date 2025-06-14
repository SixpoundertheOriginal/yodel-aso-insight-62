
-- Phase 1: Database Schema Enhancement

-- 1. Create app_role ENUM type
-- This defines the available roles in the system.
CREATE TYPE public.app_role AS ENUM (
  'SUPER_ADMIN',        -- Platform-wide super administrator
  'ORGANIZATION_ADMIN', -- Manages a specific organization
  'MANAGER',            -- Manages teams/projects within an organization
  'ANALYST',            -- Access to data and analytics features
  'VIEWER'              -- Read-only access
);

-- 2. Create user_roles table
-- This table links users to roles, potentially within a specific organization.
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- Nullable for SUPER_ADMIN
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_organization_role UNIQUE (user_id, organization_id, role), -- Ensures a user doesn't have the same role twice for the same org (or platform-wide)
  CONSTRAINT chk_super_admin_no_org CHECK (NOT (role = 'SUPER_ADMIN' AND organization_id IS NOT NULL)), -- SUPER_ADMIN is platform-wide
  CONSTRAINT chk_org_role_has_org CHECK (NOT (role <> 'SUPER_ADMIN' AND organization_id IS NULL)) -- Non-SUPER_ADMIN roles must be tied to an organization
);
-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 3. Create permissions table
-- This table lists all distinct permissions available in the application.
CREATE TABLE public.permissions (
  name TEXT PRIMARY KEY,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial set of permissions (can be expanded later)
INSERT INTO public.permissions (name, description) VALUES
  ('VIEW_DASHBOARD', 'Can view the main dashboard content'),
  ('MANAGE_ORGANIZATION_SETTINGS', 'Can edit general settings for their organization'),
  ('MANAGE_ORGANIZATION_USERS', 'Can invite, remove, and change roles of users within their organization'),
  ('VIEW_OWN_PROFILE', 'Can view their own user profile'),
  ('EDIT_OWN_PROFILE', 'Can edit their own user profile'),
  ('MANAGE_APPS', 'Can add, edit, or remove apps for their organization'),
  ('VIEW_ASO_METRICS', 'Can view ASO metrics and related analytics'),
  ('MANAGE_BILLING', 'Can manage billing settings and subscription for their organization'),
  ('PLATFORM_MANAGE_ALL_USERS', 'SUPER_ADMIN: Can manage all user accounts across the platform'),
  ('PLATFORM_MANAGE_ALL_ORGANIZATIONS', 'SUPER_ADMIN: Can manage all organizations on the platform'),
  ('PLATFORM_VIEW_SYSTEM_LOGS', 'SUPER_ADMIN: Can view system-level logs and analytics');

-- 4. Create role_permissions table
-- This join table maps roles to their granted permissions.
CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission_name TEXT NOT NULL REFERENCES public.permissions(name) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_name),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assign permissions to roles (examples, to be refined based on detailed app functionality)
-- SUPER_ADMIN Permissions
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('SUPER_ADMIN', 'PLATFORM_MANAGE_ALL_USERS'),
  ('SUPER_ADMIN', 'PLATFORM_MANAGE_ALL_ORGANIZATIONS'),
  ('SUPER_ADMIN', 'PLATFORM_VIEW_SYSTEM_LOGS'),
  ('SUPER_ADMIN', 'VIEW_DASHBOARD'), -- Super Admins can often do what Org Admins do
  ('SUPER_ADMIN', 'MANAGE_ORGANIZATION_SETTINGS'),
  ('SUPER_ADMIN', 'MANAGE_ORGANIZATION_USERS'),
  ('SUPER_ADMIN', 'MANAGE_APPS'),
  ('SUPER_ADMIN', 'VIEW_ASO_METRICS');

-- ORGANIZATION_ADMIN Permissions
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('ORGANIZATION_ADMIN', 'VIEW_DASHBOARD'),
  ('ORGANIZATION_ADMIN', 'MANAGE_ORGANIZATION_SETTINGS'),
  ('ORGANIZATION_ADMIN', 'MANAGE_ORGANIZATION_USERS'),
  ('ORGANIZATION_ADMIN', 'MANAGE_APPS'),
  ('ORGANIZATION_ADMIN', 'VIEW_ASO_METRICS'),
  ('ORGANIZATION_ADMIN', 'MANAGE_BILLING'),
  ('ORGANIZATION_ADMIN', 'EDIT_OWN_PROFILE'),
  ('ORGANIZATION_ADMIN', 'VIEW_OWN_PROFILE');

-- MANAGER Permissions
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('MANAGER', 'VIEW_DASHBOARD'),
  ('MANAGER', 'MANAGE_APPS'), -- Example: May manage specific app settings or a subset of apps
  ('MANAGER', 'VIEW_ASO_METRICS'),
  ('MANAGER', 'EDIT_OWN_PROFILE'),
  ('MANAGER', 'VIEW_OWN_PROFILE');

-- ANALYST Permissions
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('ANALYST', 'VIEW_DASHBOARD'),
  ('ANALYST', 'VIEW_ASO_METRICS'),
  ('ANALYST', 'VIEW_OWN_PROFILE'); -- Typically read-only profile view, maybe edit some parts

-- VIEWER Permissions
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('VIEWER', 'VIEW_DASHBOARD'), -- Potentially a restricted view
  ('VIEWER', 'VIEW_ASO_METRICS'), -- Potentially restricted view
  ('VIEWER', 'VIEW_OWN_PROFILE');

-- 5. Create Security Definer Helper Functions for RLS
-- These functions will be used in RLS policies to check permissions.

-- Function to check if the current authenticated user has a specific permission.
-- It checks against platform-wide roles (like SUPER_ADMIN) first,
-- then against organization-specific roles if target_organization_id is provided.
CREATE OR REPLACE FUNCTION public.check_user_permission(
  permission_to_check TEXT,
  target_organization_id UUID DEFAULT NULL -- Contextual organization for the permission check.
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  has_permission BOOLEAN := FALSE;
BEGIN
  -- Check for permission through platform-wide roles (organization_id IS NULL in user_roles)
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = v_user_id
      AND ur.organization_id IS NULL -- Platform-wide role
      AND rp.permission_name = permission_to_check
  ) INTO has_permission;

  IF has_permission THEN
    RETURN TRUE;
  END IF;

  -- If target_organization_id is provided, check for permission through roles specific to that organization
  IF target_organization_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role = rp.role
      WHERE ur.user_id = v_user_id
        AND ur.organization_id = target_organization_id -- Role specific to this organization
        AND rp.permission_name = permission_to_check
    ) INTO has_permission;
  END IF;

  RETURN has_permission;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
-- Set search_path for security definer functions to ensure they can access public schema tables correctly.
ALTER FUNCTION public.check_user_permission(TEXT, UUID) SET search_path = public;


-- 6. Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies for new tables

-- user_roles:
-- Users can view their own roles.
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());
-- Organization Admins (or those with MANAGE_ORGANIZATION_USERS perm) can manage roles within their organization.
CREATE POLICY "Org Admins can manage roles in their organization"
  ON public.user_roles FOR ALL
  USING (public.check_user_permission('MANAGE_ORGANIZATION_USERS', organization_id))
  WITH CHECK (public.check_user_permission('MANAGE_ORGANIZATION_USERS', organization_id));
-- Super Admins can manage all roles.
CREATE POLICY "Super Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.check_user_permission('PLATFORM_MANAGE_ALL_USERS')) -- No org_id context, implies SUPER_ADMIN global perm
  WITH CHECK (public.check_user_permission('PLATFORM_MANAGE_ALL_USERS'));

-- permissions: Typically, permissions list can be public or readable by authenticated users.
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- role_permissions: Linking table, can also be public or readable by authenticated users.
CREATE POLICY "Authenticated users can view role-permission assignments"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- 8. Update RLS Policies for existing tables (examples for profiles and organizations)
-- IMPORTANT: This is a critical step. Existing RLS policies need to be dropped and recreated.
-- This section should be expanded to cover all relevant tables (apps, aso_metrics, etc.)

-- PROFILES Table RLS
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid()); -- Basic self-view, specific data visibility can be column-level or handled by application logic

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() AND public.check_user_permission('EDIT_OWN_PROFILE', organization_id)) -- organization_id from the profiles row being accessed
  WITH CHECK (id = auth.uid() AND public.check_user_permission('EDIT_OWN_PROFILE', organization_id));

CREATE POLICY "Org members with permission can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.organization_id = profiles.organization_id -- profiles.organization_id is the org of the profile being viewed
    ) AND public.check_user_permission('MANAGE_ORGANIZATION_USERS', organization_id) -- permission in the context of the org being viewed
  );

CREATE POLICY "Super Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.check_user_permission('PLATFORM_MANAGE_ALL_USERS'))
  WITH CHECK (public.check_user_permission('PLATFORM_MANAGE_ALL_USERS'));


-- ORGANIZATIONS Table RLS
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations; -- Replacing with permission-based

CREATE POLICY "Org members can view their organization details"
  ON public.organizations FOR SELECT
  USING (public.check_user_permission('VIEW_DASHBOARD', id)); -- 'id' here is organizations.id

CREATE POLICY "Org Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.check_user_permission('MANAGE_ORGANIZATION_SETTINGS', id))
  WITH CHECK (public.check_user_permission('MANAGE_ORGANIZATION_SETTINGS', id));

CREATE POLICY "Super Admins can manage all organizations"
  ON public.organizations FOR ALL -- SELECT, INSERT, UPDATE, DELETE
  USING (public.check_user_permission('PLATFORM_MANAGE_ALL_ORGANIZATIONS'))
  WITH CHECK (public.check_user_permission('PLATFORM_MANAGE_ALL_ORGANIZATIONS'));


-- 9. Function to assign SUPER_ADMIN role (for manual setup by a DB admin)
-- This is for bootstrapping the first SUPER_ADMIN. Not for general frontend use.
CREATE OR REPLACE FUNCTION public.assign_super_admin_role(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Ensure target_user_id exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User with ID % not found in profiles. Cannot assign SUPER_ADMIN role.', target_user_id;
  END IF;

  -- Remove any existing SUPER_ADMIN roles for this user to prevent duplicates and ensure idempotency
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'SUPER_ADMIN';

  -- Assign SUPER_ADMIN role (platform-wide, so organization_id is NULL)
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (target_user_id, NULL, 'SUPER_ADMIN');

  RAISE NOTICE 'SUPER_ADMIN role assigned to user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION public.assign_super_admin_role(UUID) SET search_path = public;

