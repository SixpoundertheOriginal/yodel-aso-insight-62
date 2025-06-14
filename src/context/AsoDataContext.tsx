
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMockAsoData, AsoData, DateRange } from '../hooks/useMockAsoData';

interface AsoFilters {
  clientList: string[];
  dateRange: DateRange;
  trafficSources: string[];
}

interface AsoDataContextType {
  data: AsoData | null;
  loading: boolean;
  error: Error | null;
  filters: AsoFilters;
  setFilters: React.Dispatch<React.SetStateAction<AsoFilters>>;
}

const AsoDataContext = createContext<AsoDataContextType | undefined>(undefined);

interface AsoDataProviderProps {
  children: ReactNode;
}

export const AsoDataProvider: React.FC<AsoDataProviderProps> = ({ children }) => {
  // Default filters
  const [filters, setFilters] = useState<AsoFilters>({
    clientList: ["TUI", "YodelDelivery", "ClientX", "ClientY"],
    dateRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
      to: new Date(), // today
    },
    trafficSources: [
      "App Store Search",
      "App Store Browse",
      "Apple Search Ads",
      "Web Referrer", 
      "App Referrer",
      "Unknown"
    ],
  });
  
  const { data, loading, error } = useMockAsoData(
    filters.dateRange,
    filters.trafficSources,
    [] // Pass empty array for appIds, as clientList is not used by the mock hook.
  );
  
  const value = {
    data,
    loading,
    error,
    filters,
    setFilters,
  };
  
  return (
    <AsoDataContext.Provider value={value}>
      {children}
    </AsoDataContext.Provider>
  );
};

export const useAsoData = (): AsoDataContextType => {
  const context = useContext(AsoDataContext);
  if (context === undefined) {
    throw new Error('useAsoData must be used within an AsoDataProvider');
  }
  return context;
};
