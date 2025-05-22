
import React, { createContext, useContext, useState } from 'react';
import { AppDetails } from '@/components/GrowthGapFinder/AppStoreScraper';

interface AppContextType {
  selectedApp: AppDetails | null;
  setSelectedApp: (app: AppDetails | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null);

  return (
    <AppContext.Provider value={{ selectedApp, setSelectedApp }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
