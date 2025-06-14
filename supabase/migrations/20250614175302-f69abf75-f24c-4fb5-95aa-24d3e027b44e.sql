
-- The 'apps' table already exists. The following commands will update it to match the new schema.
-- NOTE: `app_store_id` is added as nullable to prevent errors on existing data.

-- Rename 'name' to 'app_name' and update its type
ALTER TABLE public.apps RENAME COLUMN name TO app_name;
ALTER TABLE public.apps ALTER COLUMN app_name TYPE VARCHAR(255);

-- Make 'bundle_id' nullable and update its type
ALTER TABLE public.apps ALTER COLUMN bundle_id DROP NOT NULL;
ALTER TABLE public.apps ALTER COLUMN bundle_id TYPE VARCHAR(255);

-- Update 'platform' type
ALTER TABLE public.apps ALTER COLUMN platform TYPE VARCHAR(20);

-- Add new columns.
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS app_store_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS developer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS app_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop old unique constraint. The constraint name is inferred.
ALTER TABLE public.apps DROP CONSTRAINT IF EXISTS apps_organization_id_bundle_id_platform_key;

-- Add new unique constraint.
ALTER TABLE public.apps ADD CONSTRAINT apps_organization_id_app_store_id_platform_key UNIQUE (organization_id, app_store_id, platform);

-- To fully match your schema, you should populate the 'app_store_id' for all existing rows
-- and then run: ALTER TABLE public.apps ALTER COLUMN app_store_id SET NOT NULL;
