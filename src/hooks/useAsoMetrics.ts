import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import type { Database } from '@/integrations/supabase/types';

export interface DateRange {
  from: Date;
  to: Date;
}

// Use database types directly
type AsoMetricRow = Database['public']['Tables']['aso_metrics']['Row'];
type AppRow = Database['public']['Tables']['apps']['Row'];
type TrafficSourceRow = Database['public']['Tables']['traffic_sources']['Row'];

// Create properly typed interfaces
export interface App extends Omit<AppRow, 'platform'> {
  platform: 'ios' | 'android';
}

export interface TrafficSource {
  id: string;
  name: string;
  display_name: string;
}

export interface AggregatedMetrics {
  impressions: { value: number; delta: number };
  downloads: { value: number; delta: number };
  productPageViews: { value: number; delta: number };
  cvr: { value: number; delta: number };
}

export interface TimeSeriesPoint {
  date: string;
  impressions: number;
  downloads: number;
  productPageViews: number;
}

export interface AsoData {
  summary: AggregatedMetrics;
  timeseriesData: TimeSeriesPoint[];
  trafficSources: Array<{
    name: string;
    value: number;
    delta: number;
  }>;
}

// Type guard function for AsoData
function isValidAsoData(data: unknown): data is AsoData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as any;
  return (
    obj.summary &&
    Array.isArray(obj.timeseriesData) &&
    Array.isArray(obj.trafficSources)
  );
}

export const useAsoMetrics = (
  dateRange: DateRange,
  trafficSources: string[] = [],
  appIds: string[] = []
) => {
  const [data, setData] = useState<AsoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [allTrafficSources, setAllTrafficSources] = useState<TrafficSource[]>([]);
  
  const { organization, profile } = useOrganization();

  // Fetch apps and traffic sources
  useEffect(() => {
    if (!organization) return;

    const fetchStaticData = async () => {
      try {
        // Fetch apps for the organization
        const { data: appsData, error: appsError } = await supabase
          .from('apps')
          .select('*')
          .eq('organization_id', organization.id);

        if (appsError) throw appsError;
        
        // Type assertion with validation for apps
        const typedApps: App[] = (appsData || []).map(app => ({
          ...app,
          platform: app.platform as 'ios' | 'android'
        }));
        
        setApps(typedApps);

        // Fetch traffic sources
        const { data: sourcesData, error: sourcesError } = await supabase
          .from('traffic_sources')
          .select('*');

        if (sourcesError) throw sourcesError;
        setAllTrafficSources(sourcesData || []);
      } catch (err) {
        console.error('Error fetching static data:', err);
        setError(err as Error);
      }
    };

    fetchStaticData();
  }, [organization]);

  // Generate cache key for data caching
  const cacheKey = useMemo(() => {
    if (!organization) return '';
    
    return `${organization.id}_metrics_${dateRange.from.toISOString().split('T')[0]}_${dateRange.to.toISOString().split('T')[0]}_${trafficSources.join(',')}_${appIds.join(',')}`;
  }, [organization, dateRange, trafficSources, appIds]);

  // Fetch ASO metrics data
  useEffect(() => {
    if (!organization || !cacheKey || apps.length === 0) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const { data: cachedData } = await supabase
          .from('data_cache')
          .select('data, expires_at')
          .eq('cache_key', cacheKey)
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        if (cachedData && isValidAsoData(cachedData.data)) {
          setData(cachedData.data);
          setLoading(false);
          return;
        }

        // Filter apps if specific app IDs provided
        const targetAppIds = appIds.length > 0 ? appIds : apps.map(app => app.id);
        
        // Build query
        let query = supabase
          .from('aso_metrics')
          .select(`*`)
          .in('app_id', targetAppIds)
          .gte('date', dateRange.from.toISOString().split('T')[0])
          .lte('date', dateRange.to.toISOString().split('T')[0]);

        if (trafficSources.length > 0) {
          query = query.in('data_source', trafficSources);
        }

        const { data: metricsData, error: metricsError } = await query;

        if (metricsError) throw metricsError;

        // Process the data into the expected format
        const processedData = processMetricsData(metricsData || [], allTrafficSources, dateRange);
        
        // Cache the result for 5 minutes
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        
        // Convert AsoData to JSON-compatible format for storage
        const cacheData = JSON.parse(JSON.stringify(processedData));
        
        await supabase
          .from('data_cache')
          .upsert({
            cache_key: cacheKey,
            data: cacheData,
            expires_at: expiresAt.toISOString()
          });

        setData(processedData);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [organization, cacheKey, apps, allTrafficSources, dateRange, trafficSources, appIds]);

  return {
    data,
    loading,
    error,
    apps,
    trafficSources: allTrafficSources,
  };
};

// Helper function to process raw metrics data
function processMetricsData(
  metrics: any[],
  trafficSources: TrafficSource[],
  dateRange: DateRange
): AsoData {
  // Create time series data
  const timeSeriesMap = new Map<string, TimeSeriesPoint>();
  const trafficSourceMap = new Map<string, { value: number; previousValue: number }>();

  // Initialize time series for all dates in range
  const currentDate = new Date(dateRange.from);
  while (currentDate <= dateRange.to) {
    const dateStr = currentDate.toISOString().split('T')[0];
    timeSeriesMap.set(dateStr, {
      date: dateStr,
      impressions: 0,
      downloads: 0,
      productPageViews: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Aggregate metrics
  let totalImpressions = 0;
  let totalDownloads = 0;
  let totalProductPageViews = 0;

  metrics.forEach((metric) => {
    // Update time series
    const existing = timeSeriesMap.get(metric.date);
    if (existing) {
      existing.impressions += metric.impressions;
      existing.downloads += metric.downloads;
      existing.productPageViews += metric.product_page_views;
    }

    // Update totals
    totalImpressions += metric.impressions;
    totalDownloads += metric.downloads;
    totalProductPageViews += metric.product_page_views;

    // Update traffic source totals
    const sourceName = metric.data_source || 'Unknown';
    const existing_source = trafficSourceMap.get(sourceName);
    if (existing_source) {
      existing_source.value += metric.downloads;
    } else {
      trafficSourceMap.set(sourceName, { value: metric.downloads, previousValue: 0 });
    }
  });

  // Calculate CVR
  const cvr = totalProductPageViews > 0 ? (totalDownloads / totalProductPageViews) * 100 : 0;

  // Mock previous period data for delta calculations (in a real implementation, you'd fetch actual historical data)
  const mockPreviousImpressions = totalImpressions * (0.85 + Math.random() * 0.3);
  const mockPreviousDownloads = totalDownloads * (0.85 + Math.random() * 0.3);
  const mockPreviousPageViews = totalProductPageViews * (0.85 + Math.random() * 0.3);
  const mockPreviousCvr = cvr * (0.85 + Math.random() * 0.3);

  return {
    summary: {
      impressions: {
        value: totalImpressions,
        delta: totalImpressions > 0 ? ((totalImpressions - mockPreviousImpressions) / mockPreviousImpressions) * 100 : 0,
      },
      downloads: {
        value: totalDownloads,
        delta: totalDownloads > 0 ? ((totalDownloads - mockPreviousDownloads) / mockPreviousDownloads) * 100 : 0,
      },
      productPageViews: {
        value: totalProductPageViews,
        delta: totalProductPageViews > 0 ? ((totalProductPageViews - mockPreviousPageViews) / mockPreviousPageViews) * 100 : 0,
      },
      cvr: {
        value: parseFloat(cvr.toFixed(2)),
        delta: cvr > 0 ? ((cvr - mockPreviousCvr) / mockPreviousCvr) * 100 : 0,
      },
    },
    timeseriesData: Array.from(timeSeriesMap.values()),
    trafficSources: Array.from(trafficSourceMap.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      delta: Math.random() * 40 - 20, // Mock delta for now
    })),
  };
}
