
-- Allow authenticated users to insert into organizations
-- This policy is broad; specific logic for who can create organizations
-- is typically handled at the application service layer (e.g., in createDemoOrganization).
-- The main goal here is to allow the INSERT operation to proceed if initiated by an authenticated user.
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Additionally, the user who creates an organization should be able to update it.
-- This might be useful for future features like renaming an organization.
-- The existing SELECT policy "Users can view their organization" uses get_current_user_organization_id(),
-- which implies a user is already associated with an organization.
-- For UPDATE, we can allow a user to update an organization if their profile points to it.
CREATE POLICY "Users can update their own organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.get_current_user_organization_id())
  WITH CHECK (id = public.get_current_user_organization_id());

