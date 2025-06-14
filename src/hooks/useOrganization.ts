
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
      setOrganization(null); // Clear organization if no user
      setProfile(null); // Clear profile if no user
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() to handle no profile yet

        if (profileError) {
          // Don't throw if it's a "no rows" type of error for maybeSingle,
          // as that's a valid state (profile might not exist yet).
          // We only throw for other unexpected errors.
          if (profileError.code !== 'PGRST116') { // PGRST116 is "request did not find any rows"
            throw profileError;
          }
          // If PGRST116, profileData will be null, which is handled below.
        }
        
        if (profileData) {
          // Type assertion with validation
          const typedProfile: UserProfile = {
            ...profileData,
            role: profileData.role as 'admin' | 'manager' | 'analyst' | 'viewer'
          };
          setProfile(typedProfile);

          // If user has an organization, fetch it
          if (profileData.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', profileData.organization_id)
              .maybeSingle(); // Use maybeSingle() here too

            if (orgError) {
              if (orgError.code !== 'PGRST116') {
                throw orgError;
              }
              // If PGRST116, orgData will be null.
            }
            setOrganization(orgData); // orgData can be null if not found
          } else {
            setOrganization(null); // No organization_id on profile
          }
        } else {
          // No profile found for the user
          setProfile(null);
          setOrganization(null);
          console.warn(`No profile found for user ${user.id}. This might be expected for new users.`);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err as Error);
        // Clear data on error
        setProfile(null);
        setOrganization(null);
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

