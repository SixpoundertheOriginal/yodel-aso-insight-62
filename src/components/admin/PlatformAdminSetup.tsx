
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shield, CheckCircle, AlertTriangle, Copy, Eye, EyeOff, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ConfigurationValidator } from './ConfigurationValidator';
import { useEnvironmentConfig } from '@/hooks/useEnvironmentConfig';
import { useDevMode } from '@/hooks/useDevMode'; // Import useDevMode
import { logAdminAction } from '@/utils/auditLogger';

const adminSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
});

type AdminFormValues = z.infer<typeof adminSchema>;

interface AdminCreationResponse {
  success: boolean;
  message: string;
  adminId?: string;
  temporaryPassword?: string;
  nextSteps?: string[];
}

export const PlatformAdminSetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdminCreationResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [configurationValid, setConfigurationValid] = useState(false);
  const { toast } = useToast();
  const { data: envConfig, isLoading: isEnvLoading } = useEnvironmentConfig();
  const { canBypass } = useDevMode(); // Get dev mode status

  useEffect(() => {
    if (envConfig?.features.adminControls || canBypass) {
      logAdminAction('view_admin_setup_granted');
    } else if (envConfig) {
      logAdminAction('view_admin_setup_denied', { environment: envConfig.environment });
    }
  }, [envConfig, canBypass]);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
    },
  });

  const getTroubleshootingSteps = (status?: number): string[] => {
    switch (status) {
      case 403:
        return [
          'Verify Supabase secrets are configured',
          'Check ADMIN_CREATION_ENABLED=true',
          'Ensure ENVIRONMENT=development or staging',
          'Review Edge Function deployment status'
        ];
      case 404:
        return [
          'Confirm Edge Function is deployed',
          'Check function name: create-platform-admin',
          'Review Supabase project configuration'
        ];
      case 500:
        return [
          'Check Edge Function logs for errors',
          'Verify database connectivity',
          'Review function permissions'
        ];
      default:
        return [
          'Review console logs for details',
          'Check Edge Function logs',
          'Verify network connectivity'
        ];
    }
  };

  const handleCreateAdmin = async (data: AdminFormValues) => {
    const startTime = Date.now();
    
    try {
      setIsLoading(true);
      setResult(null);
      setDebugInfo(null);

      console.log('[ADMIN_SETUP] Starting admin creation process...');
      console.log('[ADMIN_SETUP] Request data:', { email: data.email });
      console.log('[ADMIN_SETUP] Environment:', import.meta.env.DEV ? 'development' : 'production');
      console.log('[ADMIN_SETUP] Client URL:', window.location.origin);
      console.log('[ADMIN_SETUP] Timestamp:', new Date().toISOString());

      const { data: response, error } = await supabase.functions.invoke('create-platform-admin', {
        body: { email: data.email }
      });

      const duration = Date.now() - startTime;

      // Enhanced logging for debugging
      console.log('[ADMIN_SETUP] Edge Function Response Summary:', {
        hasResponse: !!response,
        hasError: !!error,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.error('[ADMIN_SETUP] Detailed Error Analysis:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          details: error.details || 'No additional details',
          context: error.context || 'No context provided',
          duration: `${duration}ms`,
          requestTime: new Date().toISOString()
        });

        // Store comprehensive debug info for UI display
        setDebugInfo({
          type: 'error',
          error: {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            details: error.details || error,
            duration: `${duration}ms`
          },
          environment: {
            isDev: import.meta.env.DEV,
            origin: window.location.origin,
            userAgent: navigator.userAgent.substring(0, 100) + '...'
          },
          timestamp: new Date().toISOString(),
          troubleshooting: getTroubleshootingSteps(error.status)
        });

        // Provide specific error messages and guidance
        let userMessage = error.message || 'Edge Function call failed';
        let troubleshootingGuidance = '';
        
        switch (error.status) {
          case 403:
            userMessage = 'Environment validation failed. Admin creation is restricted.';
            troubleshootingGuidance = 'Check Supabase secrets: ADMIN_CREATION_ENABLED=true, ENVIRONMENT=development';
            break;
          case 404:
            userMessage = 'Edge Function not found. Deployment may be required.';
            troubleshootingGuidance = 'Verify create-platform-admin function is deployed to Supabase';
            break;
          case 500:
            userMessage = 'Internal server error in Edge Function.';
            troubleshootingGuidance = 'Review Edge Function logs for detailed error information';
            break;
          case 409:
            userMessage = 'Platform administrator already exists.';
            troubleshootingGuidance = 'Only one super admin is allowed per platform';
            break;
          default:
            troubleshootingGuidance = 'Review console logs and Edge Function logs for details';
        }

        console.error('[ADMIN_SETUP] User guidance:', { userMessage, troubleshootingGuidance });
        throw new Error(`${userMessage}\n\nTroubleshooting: ${troubleshootingGuidance}`);
      }

      if (!response) {
        console.error('[ADMIN_SETUP] No response data received from Edge Function');
        setDebugInfo({
          type: 'no_response',
          duration: `${duration}ms`,
          environment: {
            isDev: import.meta.env.DEV,
            origin: window.location.origin
          },
          timestamp: new Date().toISOString()
        });
        throw new Error('No response received from Edge Function');
      }

      console.log('[ADMIN_SETUP] Success response received:', {
        success: response.success,
        hasAdminId: !!response.adminId,
        hasPassword: !!response.temporaryPassword,
        duration: `${duration}ms`
      });
      
      setDebugInfo({
        type: 'success',
        response: {
          success: response.success,
          message: response.message,
          hasCredentials: !!(response.adminId && response.temporaryPassword)
        },
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      const adminResult = response as AdminCreationResponse;
      
      if (!adminResult.success) {
        throw new Error(adminResult.message || 'Admin creation failed');
      }

      setResult(adminResult);
      
      toast({
        title: "Platform Administrator Created",
        description: "Admin account created successfully. Save the credentials securely.",
        variant: "default"
      });

      console.log('[ADMIN_SETUP] Admin creation completed successfully');

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[ADMIN_SETUP] Creation failed after', `${duration}ms:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setResult({
        success: false,
        message: errorMessage
      });

      toast({
        title: "Admin Creation Failed",
        description: errorMessage.split('\n')[0], // Only show first line in toast
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: `${label} copied successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  if (isEnvLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-zinc-400">Verifying access...</p>
      </div>
    );
  }

  if (!envConfig?.features.adminControls && !canBypass) {
    return (
      <Card className="max-w-2xl mx-auto p-6 border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">Access Denied</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            You do not have permission to access this page, or it is disabled in the current environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mt-2">
            Current Environment: <span className="font-semibold">{envConfig?.environment || 'unknown'}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            This page is restricted. For development, ensure you are on a recognized development URL (e.g., localhost, *.lovable.dev).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">Platform Administrator Setup</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            Create the initial platform administrator account for your enterprise SaaS platform.
            This interface is only available in development environments.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> This component only functions in development mode. 
              Platform admin creation is restricted to authorized environments with proper validation.
            </AlertDescription>
          </Alert>

          {/* Configuration Validator */}
          <div className="mb-6">
            <ConfigurationValidator onValidationChange={setConfigurationValid} />
          </div>

          {!result && configurationValid && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateAdmin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administrator Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@yourcompany.com"
                          {...field}
                          disabled={isLoading}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isLoading || !configurationValid}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating Platform Administrator...
                    </div>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Platform Administrator
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Enhanced Debug Information Display */}
          {debugInfo && (
            <div className="mt-4">
              <Alert className="border-gray-200 bg-gray-50">
                <Info className="h-4 w-4 text-gray-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-800">Debug Information:</p>
                    
                    {/* Error Analysis */}
                    {debugInfo.type === 'error' && (
                      <div className="space-y-2">
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="text-sm font-medium text-red-800">Error Details:</p>
                          <ul className="text-xs text-red-700 mt-1 space-y-1">
                            <li><strong>Status:</strong> {debugInfo.error.status}</li>
                            <li><strong>Message:</strong> {debugInfo.error.message}</li>
                            <li><strong>Duration:</strong> {debugInfo.error.duration}</li>
                          </ul>
                        </div>
                        
                        {debugInfo.troubleshooting && (
                          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-800">Troubleshooting Steps:</p>
                            <ol className="list-decimal list-inside text-xs text-yellow-700 mt-1 space-y-1">
                              {debugInfo.troubleshooting.map((step: string, index: number) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Success Information */}
                    {debugInfo.type === 'success' && (
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="text-sm font-medium text-green-800">Success Details:</p>
                        <ul className="text-xs text-green-700 mt-1 space-y-1">
                          <li><strong>Duration:</strong> {debugInfo.duration}</li>
                          <li><strong>Credentials Generated:</strong> {debugInfo.response.hasCredentials ? 'Yes' : 'No'}</li>
                        </ul>
                      </div>
                    )}

                    {/* Environment Context */}
                    {debugInfo.environment && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-800">Environment Context:</p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-1">
                          <li><strong>Development Mode:</strong> {debugInfo.environment.isDev ? 'Yes' : 'No'}</li>
                          <li><strong>Origin:</strong> {debugInfo.environment.origin}</li>
                          <li><strong>Timestamp:</strong> {debugInfo.timestamp}</li>
                        </ul>
                      </div>
                    )}

                    {/* Raw Debug Data (Collapsible) */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Show Raw Debug Data
                      </summary>
                      <pre className="bg-white p-2 rounded border mt-2 overflow-auto text-xs">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-3">
                    <p className={result.success ? 'text-green-800 font-medium' : 'text-red-800'}>
                      {result.message}
                    </p>
                    
                    {result.success && result.temporaryPassword && (
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="font-semibold text-green-800 mb-3">
                          🔐 Administrator Credentials (Save Immediately)
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Email:</p>
                              <p className="text-sm text-gray-900">{form.getValues('email')}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(form.getValues('email'), 'Email')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">Temporary Password:</p>
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                  {showPassword ? result.temporaryPassword : '••••••••••••••••'}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(result.temporaryPassword!, 'Password')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <Alert className="mt-3 border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            <strong>Security Warning:</strong> Change this password immediately after first login. 
                            Do not share these credentials through unsecured channels.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {result.nextSteps && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-800 mb-2">📋 Next Steps:</p>
                        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                          {result.nextSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setDebugInfo(null);
                  form.reset();
                  setShowPassword(false);
                }}
                className="w-full"
              >
                Create Another Administrator
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
