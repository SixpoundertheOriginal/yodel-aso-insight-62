
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkUserDataHealth } from '@/services/userManagement';
// import { createDemoOrganization } from '@/services/seedData'; // This will be replaced

export enum AuthState {
  ANONYMOUS = 'ANONYMOUS', // Initial state, no user session
  AUTHENTICATING = 'AUTHENTICATING', // Supabase auth in progress (e.g. after signIn call)
  AUTHENTICATED_PENDING_PROFILE = 'AUTHENTICATED_PENDING_PROFILE', // Supabase session exists, profile check/creation pending
  AUTHENTICATED_PENDING_ORGANIZATION = 'AUTHENTICATED_PENDING_ORGANIZATION', // Profile exists, organization check/creation pending
  AUTHENTICATED_COMPLETE = 'AUTHENTICATED_COMPLETE', // Supabase session, profile, and organization all exist
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED', // Any step in the auth/provisioning process failed
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  authState: AuthState;
  authError: string | null;
  isLoading: boolean; // True during initial session load and subsequent provisioning attempts
  signUp: (options: { email: string; password: string }) => Promise<any>;
  signIn: (options: { email: string; password: string }) => Promise<any>;
  signOut: () => Promise<any>;
  signInWithOAuth: (options: { provider: 'google' | 'github' | 'twitter' }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>(AuthState.ANONYMOUS);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Starts true for initial session check

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUserProvisioning = useCallback(async (currentUser: User) => {
    if (!currentUser) {
      setAuthState(AuthState.ANONYMOUS);
      setIsLoading(false);
      return;
    }

    setAuthState(AuthState.AUTHENTICATED_PENDING_PROFILE);
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log(`[AUTH_PROVISIONING] Starting provisioning for user ${currentUser.id}`);
      const healthCheck = await checkUserDataHealth(currentUser.id);
      console.log(`[AUTH_PROVISIONING] Health check result:`, healthCheck);

      if (healthCheck.hasProfile && healthCheck.hasOrganization) {
        console.log(`[AUTH_PROVISIONING] User profile and organization exist.`);
        setAuthState(AuthState.AUTHENTICATED_COMPLETE);
      } else {
        // Profile or organization (or both) are missing. Attempt to create/repair.
        if (healthCheck.hasProfile && !healthCheck.hasOrganization) {
          setAuthState(AuthState.AUTHENTICATED_PENDING_ORGANIZATION);
          console.log(`[AUTH_PROVISIONING] Profile exists, organization missing. Attempting to create demo org.`);
        } else if (!healthCheck.hasProfile) {
          // AUTHENTICATED_PENDING_PROFILE is already set
          console.log(`[AUTH_PROVISIONING] Profile missing. Attempting to create profile and demo org.`);
        }
        
        // Use the new secure RPC call instead of the direct insert
        const emailPrefix = currentUser.email?.split('@')[0] || 'user';
        const safeSlugBase = emailPrefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const orgName = `${emailPrefix}'s Demo Org`;
        const slug = `${safeSlugBase || 'demo'}-org-${Math.random().toString(36).substring(2, 8)}`;
        
        console.log(`[AUTH_PROVISIONING] Calling create_organization_and_assign_admin with name: "${orgName}", slug: "${slug}"`);

        const { error: rpcError } = await supabase.rpc('create_organization_and_assign_admin', {
          org_name: orgName,
          org_slug: slug
        });
        
        const orgResult = { success: !rpcError, error: rpcError };
        console.log(`[AUTH_PROVISIONING] Demo organization creation result:`, orgResult);

        if (orgResult.success) {
          toast({
            title: 'Account Setup Complete!',
            description: 'Your profile and demo organization are ready.',
          });
          setAuthState(AuthState.AUTHENTICATED_COMPLETE);
          // Reload to ensure all contexts are updated with new org info
          setTimeout(() => window.location.reload(), 1000);
        } else {
          const errorMsg = orgResult.error?.message || 'Failed to set up your account automatically.';
          console.error(`[AUTH_PROVISIONING] Automated provisioning failed: ${errorMsg}. User will be prompted to try manually.`);
          toast({
            title: 'Automatic Setup Failed',
            description: `We couldn't set up your organization automatically. Please try again from the setup page.`,
            variant: 'warning',
          });
          // CRITICAL: We stay in a pending state, don't fail completely.
          setAuthError(errorMsg);
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An unexpected error occurred during account setup.';
      console.error(`[AUTH_PROVISIONING] Unexpected error: ${errorMsg}`, error);
      toast({
        title: 'Account Setup Error',
        description: errorMsg,
        variant: 'destructive',
      });
      setAuthError(errorMsg);
      setAuthState(AuthState.AUTHENTICATION_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    // Check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        console.log('[AUTH_CONTEXT] Initial session found. Starting provisioning.');
        handleUserProvisioning(currentUser);
      } else {
        console.log('[AUTH_CONTEXT] No initial session.');
        setAuthState(AuthState.ANONYMOUS);
        setIsLoading(false);
      }
    }).catch(error => {
        console.error('[AUTH_CONTEXT] Error getting initial session:', error);
        setAuthState(AuthState.AUTHENTICATION_FAILED);
        setAuthError("Failed to retrieve initial session.");
        setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        setAuthError(null); // Clear previous errors on state change

        if (event === 'SIGNED_IN') {
          console.log('[AUTH_CONTEXT] Event: SIGNED_IN. Starting provisioning.');
          toast({ title: 'Signed in successfully', description: 'Welcome back!' });
          if (currentUser) {
            handleUserProvisioning(currentUser);
          } else {
             // Should not happen if SIGNED_IN, but handle defensively
            setAuthState(AuthState.AUTHENTICATION_FAILED);
            setAuthError("Signed in but no user data received.");
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AUTH_CONTEXT] Event: SIGNED_OUT.');
          toast({ title: 'Signed out successfully', description: 'You have been signed out.' });
          setAuthState(AuthState.ANONYMOUS);
          setIsLoading(false);
        } else if (event === 'USER_UPDATED' && currentUser) {
            // If user is updated, re-check provisioning status
            // This could happen if e.g. email is verified
            console.log('[AUTH_CONTEXT] Event: USER_UPDATED. Re-checking provisioning.');
            handleUserProvisioning(currentUser);
        }
        // Other events like TOKEN_REFRESHED, PASSWORD_RECOVERY don't typically require full provisioning re-check
        // unless user object itself changes in a way that affects profile/org.
        // USER_UPDATED covers cases where user metadata might change.
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, handleUserProvisioning]);

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    setAuthState(AuthState.AUTHENTICATING);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // emailRedirectTo is important for email confirmation flows
          emailRedirectTo: `${window.location.origin}/dashboard`, 
        }
      });
      
      if (error) throw error;
      
      // if no email confirmation, onAuthStateChange SIGNED_IN will trigger provisioning
      // if email confirmation is required, user will complete that, then on next session load/SIGNED_IN, provisioning will trigger.
      toast({
        title: 'Sign up successful!',
        description: 'Please check your email for verification if required.',
      });
      // No explicit navigation here, onAuthStateChange handles it.
      // AuthState will be updated by onAuthStateChange listener
      return data;
    } catch (error: any) {
      console.error('[AUTH_CONTEXT] Sign up failed:', error);
      toast({
        title: 'Sign up failed',
        description: error.message || 'There was an error during sign up.',
        variant: 'destructive',
      });
      setAuthError(error.message);
      setAuthState(AuthState.AUTHENTICATION_FAILED);
      setIsLoading(false);
      throw error;
    }
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    setAuthState(AuthState.AUTHENTICATING);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      // onAuthStateChange SIGNED_IN will trigger provisioning and navigation logic in withAuth
      // No explicit navigation here. AuthState will be updated by onAuthStateChange listener
      return data;
    } catch (error: any) {
      console.error('[AUTH_CONTEXT] Sign in failed:', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
      setAuthError(error.message);
      setAuthState(AuthState.AUTHENTICATION_FAILED);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true); // Briefly set loading true during sign out process
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // onAuthStateChange SIGNED_OUT will set state to ANONYMOUS
      // Navigation will be handled by withAuth or route setup
      navigate('/auth/sign-in'); // Explicit navigation after sign out is common
    } catch (error: any) {
      console.error('[AUTH_CONTEXT] Sign out failed:', error);
      toast({
        title: 'Sign out failed',
        description: error.message || 'There was an error signing out.',
        variant: 'destructive',
      });
      setAuthError(error.message);
      setAuthState(AuthState.AUTHENTICATION_FAILED); // Or keep previous auth state? ANONYMOUS is safer.
      setIsLoading(false); // Ensure loading is false on error
      throw error;
    }
  };

  const signInWithOAuth = async ({ provider }: { provider: 'google' | 'github' | 'twitter' }) => {
    setIsLoading(true);
    setAuthState(AuthState.AUTHENTICATING);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      // OAuth flow will redirect. On return, onAuthStateChange handles provisioning.
      return data;
    } catch (error: any) {
      console.error(`[AUTH_CONTEXT] OAuth sign in with ${provider} failed:`, error);
      toast({
        title: 'OAuth sign in failed',
        description: error.message || `There was an error signing in with ${provider}.`,
        variant: 'destructive',
      });
      setAuthError(error.message);
      setAuthState(AuthState.AUTHENTICATION_FAILED);
      setIsLoading(false);
      throw error;
    }
  };

  const value = {
    session,
    user,
    authState,
    authError,
    isLoading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
