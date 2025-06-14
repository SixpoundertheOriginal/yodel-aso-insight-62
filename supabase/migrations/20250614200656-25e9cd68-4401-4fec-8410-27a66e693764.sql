
-- To ensure a clean state, drop all existing policies on the organizations table.
-- This will remove any conflicting or duplicated rules that are causing the lockout.
DROP POLICY IF EXISTS "Allow authenticated users to create their first organization" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations; -- Dropping this too for a clean slate

-- Now, re-create the essential policies cleanly.

-- 1. SELECT Policy: Allows a user to see the organization they belong to.
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id = public.get_current_user_organization_id());

-- 2. INSERT Policy: Explicitly allows any logged-in user to create an organization.
-- This is the critical fix for the sign-up and first-login process.
CREATE POLICY "Authenticated users can insert organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. UPDATE Policy: Allows a user to update their own organization's details.
CREATE POLICY "Users can update their own organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.get_current_user_organization_id())
  WITH CHECK (id = public.get_current_user_organization_id());
