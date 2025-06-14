
-- Create a security definer function to handle the atomic creation of an organization
-- and assignment of the creating user as the organization admin.
-- This is the standard, secure pattern for bootstrapping organizations in a multi-tenant system,
-- as it correctly handles permissions and avoids RLS chicken-and-egg problems.

CREATE OR REPLACE FUNCTION public.create_organization_and_assign_admin(
  org_name TEXT,
  org_slug TEXT
)
RETURNS uuid -- Returns the new organization's ID
LANGUAGE plpgsql
SECURITY DEFINER
-- Important: Set a secure search path to prevent hijacking
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  calling_user_id uuid := auth.uid();
BEGIN
  -- Step 1: Create the organization
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Step 2: Update the profile of the user who called this function
  -- to assign them to the new organization.
  UPDATE public.profiles
  SET organization_id = new_org_id
  WHERE id = calling_user_id;

  -- Step 3: Assign the 'ORGANIZATION_ADMIN' role to the user for the new organization.
  -- This ensures the creator has full control over their new organization.
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (calling_user_id, new_org_id, 'ORGANIZATION_ADMIN');

  -- Return the ID of the newly created organization
  RETURN new_org_id;
END;
$$;
