
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AuthState } from '@/context/AuthContext';
import { CompletingSetup } from './CompletingSetup'; // New component
import { SetupOrganization } from '@/components/SetupOrganization';
import { RefreshCw } from 'lucide-react'; // For generic loading spinner
import { useDevMode } from '@/hooks/useDevMode';
import { Badge } from '@/components/ui/badge';

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const AuthProtected: React.FC<P> = (props) => {
    const { authState, isLoading, authError } = useAuth();
    const { isAuthBypassed } = useDevMode();
    const navigate = useNavigate();

    if (isAuthBypassed) {
      return (
        <>
          <div className="fixed bottom-4 right-4 z-50 animate-pulse">
            <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 shadow-lg hover:bg-yellow-300">
              DEV MODE: AUTH BYPASSED
            </Badge>
          </div>
          <Component {...props} />
        </>
      );
    }

    React.useEffect(() => {
      // This effect primarily handles redirection for non-complete states
      // It doesn't need to run if isLoading is true, as we'll show a spinner then.
      if (!isLoading) {
        if (authState === AuthState.ANONYMOUS || 
            (authState === AuthState.AUTHENTICATION_FAILED && authError !== "User already registered")) { // Avoid redirect loop on signup existing user
          console.log('[WITH_AUTH] Redirecting to sign-in due to state:', authState, 'Error:', authError);
          navigate('/auth/sign-in');
        }
      }
    }, [authState, isLoading, navigate, authError]);

    if (isLoading) {
      // This covers initial load and any subsequent loading during provisioning
      return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (authState) {
      case AuthState.AUTHENTICATED_COMPLETE:
        return <Component {...props} />;
      case AuthState.AUTHENTICATING:
      case AuthState.AUTHENTICATED_PENDING_PROFILE:
        return <CompletingSetup />;
      case AuthState.AUTHENTICATED_PENDING_ORGANIZATION:
        return <SetupOrganization />;
      case AuthState.ANONYMOUS:
      case AuthState.AUTHENTICATION_FAILED:
        // Redirection is handled by useEffect. Showing a brief loading or null here.
        // Or, you could show an error component for AUTHENTICATION_FAILED.
        // For now, relying on useEffect to redirect.
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-white">Redirecting...</p>
            </div>
        ); // Fallback while redirecting
      default:
        // Should not happen
        return null;
    }
  };

  return AuthProtected;
};
