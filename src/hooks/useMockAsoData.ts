import { useState, useEffect } from 'react';

// Define and export types here to be used across the app, fixing the export errors.
export interface DateRange {
  from: Date;
  to: Date;
}

export interface TimeSeriesPoint {
  date: string;
  impressions: number;
  downloads: number;
  pageViews: number;
}

export interface TrafficSource {
  name: string;
  value: number;
  delta: number;
}

export interface MetricSummary {
  value: number;
  delta: number; // percentage change
}

export interface AsoMetrics {
  impressions: MetricSummary;
  downloads: MetricSummary;
  productPageViews: MetricSummary;
  cvr: MetricSummary;
}

export interface AsoData {
  summary: AsoMetrics;
  timeseriesData: TimeSeriesPoint[];
  trafficSources: TrafficSource[];
}

export const useMockAsoData = (
  dateRange: DateRange,
  trafficSources: string[],
  appIds: string[]
): { data: AsoData | null; loading: boolean; error: Error | null; apps: any[]; trafficSources: string[] } => {
  const [data, setData] = useState<AsoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const generateMockData = async () => {
      try {
        setLoading(true);
        
        // Generate random values for metrics
        const generateMetric = (): MetricSummary => {
          const value = Math.floor(Math.random() * 99000) + 1000; // 1k to 100k
          const delta = (Math.random() * 40) - 20; // -20% to +20%
          return { value, delta };
        };
        
        // Generate summary metrics
        const summary: AsoMetrics = {
          impressions: generateMetric(),
          downloads: generateMetric(),
          productPageViews: generateMetric(),
          cvr: { 
            value: parseFloat((Math.random() * 10).toFixed(2)), // 0 to 10%
            delta: parseFloat((Math.random() * 40 - 20).toFixed(1)) // -20% to +20%
          }
        };
        
        // Generate timeseries data for the last 30 days
        const timeseriesData: TimeSeriesPoint[] = [];
        const endDate = dateRange.to;
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29); // 30 days including the end date
        
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
          timeseriesData.push({
            date: currentDate.toISOString().split('T')[0],
            impressions: Math.floor(Math.random() * 5000) + 500,
            downloads: Math.floor(Math.random() * 1000) + 100,
            pageViews: Math.floor(Math.random() * 3000) + 300, // FIX: renamed productPageViews to pageViews
          });
        }

        // FIX: Add mock traffic sources data
        const mockTrafficSources: TrafficSource[] = [
            { name: "App Store Search", value: Math.floor(Math.random() * 50000) + 5000, delta: (Math.random() * 40) - 20 },
            { name: "App Store Browse", value: Math.floor(Math.random() * 30000) + 3000, delta: (Math.random() * 40) - 20 },
            { name: "Apple Search Ads", value: Math.floor(Math.random() * 15000) + 1500, delta: (Math.random() * 40) - 20 },
            { name: "Web Referrer", value: Math.floor(Math.random() * 10000) + 1000, delta: (Math.random() * 40) - 20 },
            { name: "App Referrer", value: Math.floor(Math.random() * 5000) + 500, delta: (Math.random() * 40) - 20 },
            { name: "Unknown", value: Math.floor(Math.random() * 1000) + 100, delta: (Math.random() * 40) - 20 },
        ];
        
        const mockData: AsoData = {
          summary,
          timeseriesData,
          trafficSources: mockTrafficSources, // FIX: Added trafficSources to the mock data object
        };
        
        // Simulate API delay
        setTimeout(() => {
          setData(mockData);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };
    
    generateMockData();
  }, [dateRange.from, dateRange.to, trafficSources, appIds]);
  
  const mockApps = [
    { id: '1', name: 'Mock App 1 (iOS)', platform: 'iOS' },
    { id: '2', name: 'Mock App 2 (Android)', platform: 'Android' },
  ];
  
  const mockTrafficSourceNames = [
    "App Store Search",
    "App Store Browse", 
    "Apple Search Ads",
    "Web Referrer",
    "App Referrer",
    "Unknown"
  ];
  
  return { data, loading, error, apps: mockApps, trafficSources: mockTrafficSourceNames };
};
