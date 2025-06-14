
import { useState, useEffect } from 'react';
import { AsoData, DateRange, TimeSeriesPoint } from './useAsoMetrics';

// These interfaces are not exported from useAsoMetrics.ts so they are defined here.
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
            productPageViews: Math.floor(Math.random() * 3000) + 300,
          });
        }
        
        const mockData: AsoData = {
          summary,
          timeseriesData,
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
  
  return { data, loading, error, apps: mockApps, trafficSources };
};
