
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { createDemoOrganization } from '@/services/seedData'; // This will be replaced
import { supabase } from '@/integrations/supabase/client';
import { checkUserDataHealth } from '@/services/userManagement';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const SetupOrganization: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean;
    canProceed: boolean;
    issues: string[];
    userRepaired?: boolean;
  }>({ checked: false, canProceed: false, issues: [] });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const performHealthCheck = async () => {
    if (!user) return;
    
    setHealthChecking(true);
    try {
      const health = await checkUserDataHealth(user.id);
      setHealthStatus({
        checked: true,
        canProceed: health.canCreateOrganization,
        issues: health.issues
      });
      
      if (health.issues.length > 0) {
        toast({
          title: 'Account Issues Detected',
          description: `Found ${health.issues.length} issue(s). We can attempt to fix them automatically.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account Status: Good',
          description: 'Your account is ready for organization creation.',
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: 'Health Check Failed',
        description: 'Unable to verify account status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setHealthChecking(false);
    }
  };

  const handleCreateDemo = async () => {
    if (!user || !user.email) {
      toast({
          title: 'Cannot Create Organization',
          description: 'User email is not available. Please try logging in again.',
          variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`[UI] Starting demo organization creation for user ${user.id}`);
      
      const emailPrefix = user.email.split('@')[0];
      const safeSlugBase = emailPrefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const orgName = `${emailPrefix}'s Demo Org`;
      const slug = `${safeSlugBase || 'demo'}-org-${Math.random().toString(36).substring(2, 8)}`;

      console.log(`[UI] Calling create_organization_and_assign_admin with name: "${orgName}", slug: "${slug}"`);
      
      const { error: rpcError } = await supabase.rpc('create_organization_and_assign_admin', {
        org_name: orgName,
        org_slug: slug,
      });

      const result = { success: !rpcError, error: rpcError };
      
      if (result.success) {
        const message = 'Your demo organization has been set up with sample data.';
        
        toast({
          title: 'Demo organization created!',
          description: message,
        });
        
        // Refresh the page to load the new organization
        window.location.reload();
      } else {
        // Handle graceful degradation
        const errorMessage = result.error?.message || 'Unknown error during organization creation';
        
        console.error('Demo organization creation failed:', {
          error: result.error,
        });
        
        toast({
          title: 'Organization Creation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // Update health status to show current state
        setHealthStatus(prev => ({
          ...prev,
          canProceed: false,
          issues: [...prev.issues, errorMessage]
        }));
      }
    } catch (error: any) {
      console.error('Unexpected error creating demo organization:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900 p-4">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Welcome to ASO Platform</CardTitle>
          <CardDescription className="text-zinc-400">
            You need to be part of an organization to access ASO data. 
            Create a demo organization to get started or go back to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Status Display */}
          {healthStatus.checked && (
            <Alert className={healthStatus.canProceed ? "border-green-600 bg-green-900/20" : "border-red-600 bg-red-900/20"}>
              {healthStatus.canProceed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className="text-white">
                {healthStatus.canProceed ? (
                  'Account ready for organization creation'
                ) : (
                  <>
                    Account issues detected: {healthStatus.issues.join(', ')}
                    <br />
                    <span className="text-sm text-zinc-400 mt-1 block">
                      Don't worry - we can fix these automatically when you create your organization.
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Health Check Button */}
          <Button 
            onClick={performHealthCheck}
            disabled={healthChecking || loading}
            variant="outline"
            className="w-full"
          >
            {healthChecking ? (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking Account Status...
              </div>
            ) : (
              'Check Account Status'
            )}
          </Button>

          {/* Create Demo Organization Button */}
          <Button 
            onClick={handleCreateDemo} 
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Demo Organization...
              </div>
            ) : (
              'Create Demo Organization'
            )}
          </Button>

          {/* Go Home Button */}
          <Button 
            onClick={handleGoHome} 
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Go Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
