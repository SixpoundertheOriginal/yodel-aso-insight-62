
-- Create a new RLS policy on the 'organizations' table.
-- This policy allows any authenticated user to insert a new row into 'organizations'.
-- This is necessary for the initial user provisioning flow where a new user
-- needs to create their first organization upon signing up.
-- The 'WITH CHECK (true)' means the condition for insertion is always met for an authenticated user.
CREATE POLICY "Allow authenticated users to create their first organization"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
