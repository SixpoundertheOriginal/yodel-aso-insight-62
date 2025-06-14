
-- Add organization_id for multi-tenancy and populate it for existing rows
ALTER TABLE public.aso_metrics ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE public.aso_metrics am
SET organization_id = a.organization_id
FROM public.apps a
WHERE am.app_id = a.id AND am.organization_id IS NULL;

-- After populating, enforce NOT NULL and add foreign key
ALTER TABLE public.aso_metrics ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.aso_metrics ADD CONSTRAINT aso_metrics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Rename page_views to product_page_views for clarity
ALTER TABLE public.aso_metrics RENAME COLUMN page_views TO product_page_views;

-- Change column types for scalability
ALTER TABLE public.aso_metrics ALTER COLUMN impressions TYPE BIGINT;
ALTER TABLE public.aso_metrics ALTER COLUMN downloads TYPE BIGINT;
ALTER TABLE public.aso_metrics ALTER COLUMN product_page_views TYPE BIGINT;

-- Adjust conversion_rate precision and set default
ALTER TABLE public.aso_metrics ALTER COLUMN conversion_rate TYPE DECIMAL(5, 4);
ALTER TABLE public.aso_metrics ALTER COLUMN conversion_rate SET DEFAULT 0;

-- Add new columns for enhanced analytics and tracking
ALTER TABLE public.aso_metrics
  ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS revenue DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- Remove the old updated_at column which is not in the new schema
ALTER TABLE public.aso_metrics DROP COLUMN IF EXISTS updated_at;

-- Remove the old traffic_source_id as it's replaced by data_source
ALTER TABLE public.aso_metrics DROP COLUMN IF EXISTS traffic_source_id;

-- Drop existing unique constraints that might conflict
-- The name of unique constraints can vary, this is a common pattern.
ALTER TABLE public.aso_metrics DROP CONSTRAINT IF EXISTS aso_metrics_app_id_date_traffic_source_id_key;

-- Add the new composite unique constraint for data integrity
ALTER TABLE public.aso_metrics
  ADD CONSTRAINT aso_metrics_org_app_date_country_source_key
  UNIQUE(organization_id, app_id, date, country, data_source);
