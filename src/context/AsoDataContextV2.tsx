
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAsoMetrics, DateRange, AsoData } from '../hooks/useAsoMetrics';

interface AsoFilters {
  clientList: string[];
  dateRange: DateRange;
  trafficSources: string[];
  appIds: string[];
}

interface AsoDataContextType {
  data: AsoData | null;
  loading: boolean;
  error: Error | null;
  filters: AsoFilters;
  setFilters: React.Dispatch<React.SetStateAction<AsoFilters>>;
  apps: any[];
  trafficSourceOptions: any[];
}

const AsoDataContext = createContext<AsoDataContextType | undefined>(undefined);

interface AsoDataProviderProps {
  children: ReactNode;
}

export const AsoDataProvider: React.FC<AsoDataProviderProps> = ({ children }) => {
  // Default filters
  const [filters, setFilters] = useState<AsoFilters>({
    clientList: [],
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
    appIds: [],
  });
  
  const { data, loading, error, apps, trafficSources } = useAsoMetrics(
    filters.dateRange,
    filters.trafficSources,
    filters.appIds
  );
  
  const value = {
    data,
    loading,
    error,
    filters,
    setFilters,
    apps,
    trafficSourceOptions: trafficSources,
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
