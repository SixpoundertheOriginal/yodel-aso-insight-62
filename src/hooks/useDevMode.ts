
import { useState, useEffect, useCallback } from 'react';
import { useEnvironmentConfig } from './useEnvironmentConfig';

const DEV_AUTH_BYPASS_KEY = 'dev_auth_bypass_enabled';

/**
 * Hook to manage a development mode authentication bypass.
 * The bypass is only possible in 'development' environments.
 *
 * @returns {object} An object containing:
 * - `isAuthBypassed`: boolean - True if authentication should be bypassed.
 * - `canBypass`: boolean - True if the environment allows bypassing auth (i.e., 'development').
 * - `isBypassEnabled`: boolean - The raw state of the toggle (persisted in localStorage).
 * - `toggleBypass`: function - A function to toggle the bypass state.
 */
export function useDevMode() {
  const { data: environmentConfig, isLoading } = useEnvironmentConfig();
  
  const canBypass = !isLoading && environmentConfig?.environment === 'development';

  const [isBypassEnabled, setIsBypassEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true; // Default to bypassed in dev SSR
    try {
        const storedValue = window.localStorage.getItem(DEV_AUTH_BYPASS_KEY);
        // Default to 'true' (bypassed) in dev environment if not set
        return storedValue !== null ? JSON.parse(storedValue) : true;
    } catch (error) {
        console.error("Error reading dev mode from localStorage", error);
        return true;
    }
  });

  useEffect(() => {
    // Only allow bypass to be enabled in a dev environment.
    // If we switch to a non-dev environment, force bypass off.
    if (!canBypass && isBypassEnabled) {
      setIsBypassEnabled(false);
    }
  }, [canBypass, isBypassEnabled]);

  useEffect(() => {
    try {
        window.localStorage.setItem(DEV_AUTH_BYPASS_KEY, JSON.stringify(isBypassEnabled));
    } catch (error) {
        console.error("Error saving dev mode to localStorage", error);
    }
  }, [isBypassEnabled]);

  const toggleBypass = useCallback(() => {
    if (canBypass) {
      setIsBypassEnabled(prev => !prev);
    } else {
        console.warn("Cannot toggle auth bypass in non-development environment.");
    }
  }, [canBypass]);
  
  // The final state: auth is bypassed if it's possible AND the toggle is on.
  const isAuthBypassed = canBypass && isBypassEnabled;

  return { 
    isAuthBypassed, 
    canBypass,
    isBypassEnabled,
    toggleBypass,
  };
}
