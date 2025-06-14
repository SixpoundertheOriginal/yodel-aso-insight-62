
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/integrations/supabase/types';

// Use database types directly
type Organization = Database['public']['Tables']['organizations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Create a properly typed interface for UserProfile
interface UserProfile extends Omit<ProfileRow, 'role'> {
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
}

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Type assertion with validation
        const typedProfile: UserProfile = {
          ...profileData,
          role: profileData.role as 'admin' | 'manager' | 'analyst' | 'viewer'
        };

        setProfile(typedProfile);

        // If user has an organization, fetch it
        if (profileData?.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.organization_id)
            .single();

          if (orgError) {
            throw orgError;
          }

          setOrganization(orgData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return {
    organization,
    profile,
    loading,
    error,
  };
};
