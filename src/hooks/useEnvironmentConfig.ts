
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  features: {
    adminControls: boolean;
    debugMode: boolean;
  };
}

export function useEnvironmentConfig() {
  return useQuery({
    queryKey: ['environment-config'],
    queryFn: async (): Promise<EnvironmentConfig> => {
      const { data, error } = await supabase.functions.invoke('get-environment-config');
      
      if (error) {
        console.error('Environment config error:', error);
        // Fail secure - no admin access if we can't verify
        return {
          environment: 'production',
          features: {
            adminControls: false,
            debugMode: false,
          }
        };
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
}
