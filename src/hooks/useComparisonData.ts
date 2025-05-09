
import { useMemo } from 'react';
import { useMockAsoData, AsoData, DateRange } from './useMockAsoData';
import { useAsoData } from '@/context/AsoDataContext';

type ComparisonPeriod = 'period' | 'year';

export interface ComparisonData {
  current: AsoData | null;
  previous: AsoData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook that fetches both current and previous period data
 * @param comparisonType - 'period' shifts back by the same duration, 'year' shifts by 1 year
 */
export const useComparisonData = (comparisonType: ComparisonPeriod): ComparisonData => {
  const { data: currentData, loading: currentLoading, error: currentError, filters } = useAsoData();
  
  // Calculate the previous period date range
  const previousDateRange = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      return filters.dateRange;
    }
    
    const currentFrom = new Date(filters.dateRange.from);
    const currentTo = new Date(filters.dateRange.to);
    const durationMs = currentTo.getTime() - currentFrom.getTime();
    
    let previousFrom: Date, previousTo: Date;
    
    if (comparisonType === 'period') {
      // Shift back by the same duration
      previousTo = new Date(currentFrom);
      previousFrom = new Date(currentFrom.getTime() - durationMs);
    } else {
      // Shift back by 1 year
      previousFrom = new Date(currentFrom);
      previousTo = new Date(currentTo);
      previousFrom.setFullYear(previousFrom.getFullYear() - 1);
      previousTo.setFullYear(previousTo.getFullYear() - 1);
    }
    
    return {
      from: previousFrom,
      to: previousTo,
    };
  }, [filters.dateRange, comparisonType]);
  
  // Fetch data for the previous period
  const { data: previousData, loading: previousLoading, error: previousError } = useMockAsoData(
    filters.clientList,
    previousDateRange,
    filters.trafficSources
  );
  
  return {
    current: currentData,
    previous: previousData,
    loading: currentLoading || previousLoading,
    error: currentError || previousError,
  };
};
