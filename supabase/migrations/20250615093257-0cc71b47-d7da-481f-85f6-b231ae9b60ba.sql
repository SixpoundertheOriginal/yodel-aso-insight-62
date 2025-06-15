
-- Create a state-tracking table for admin creation sessions.
CREATE TABLE IF NOT EXISTS public.admin_creation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'initiated', -- initiated, user_created, profile_verified, role_assigned, audit_logged, completed, failed
  step TEXT NOT NULL DEFAULT 'start',      -- start, create_user, verify_profile, assign_role, audit, finish, error
  user_id UUID,                            -- Populated after user creation
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_details TEXT,
  UNIQUE(email)
);

-- Add index for session cleanup.
CREATE INDEX IF NOT EXISTS idx_admin_creation_sessions_updated ON public.admin_creation_sessions(updated_at);

-- (Recommended but optional for high scale) Concurrency advisory lock helper function.
CREATE OR REPLACE FUNCTION public.lock_platform_admin_creation()
RETURNS VOID AS $$
DECLARE
  locked BOOLEAN;
BEGIN
  -- Use a global lock key for platform admin setup; change the int for a different context.
  PERFORM pg_advisory_lock(998823442); 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unlock_platform_admin_creation()
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_unlock(998823442); 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure only platform super admins can select/update sessions for security.
ALTER TABLE public.admin_creation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage creation sessions"
ON public.admin_creation_sessions
FOR ALL
USING (
  public.check_user_permission('PLATFORM_VIEW_ALL_AUDIT_LOGS')
);

