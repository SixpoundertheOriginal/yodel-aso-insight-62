
import React, { useState } from 'react';
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
  const { toast } = useToast();

  // Environment gate - only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleCreateAdmin = async (data: AdminFormValues) => {
    try {
      setIsLoading(true);
      setResult(null);
      setDebugInfo(null);

      console.log('[ADMIN_SETUP] Starting admin creation process...');
      console.log('[ADMIN_SETUP] Request data:', { email: data.email });
      console.log('[ADMIN_SETUP] Environment:', import.meta.env.DEV ? 'development' : 'production');
      console.log('[ADMIN_SETUP] Supabase URL:', supabase.supabaseUrl);

      const { data: response, error } = await supabase.functions.invoke('create-platform-admin', {
        body: { email: data.email }
      });

      // Enhanced logging for debugging
      console.log('[ADMIN_SETUP] Edge Function Raw Response:', {
        response,
        error,
        hasResponse: !!response,
        hasError: !!error
      });

      if (error) {
        console.error('[ADMIN_SETUP] Detailed Error Information:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          details: error.details || error,
          context: error.context || 'No context provided'
        });

        // Store debug info for UI display
        setDebugInfo({
          type: 'error',
          error: {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            details: error.details || error
          },
          timestamp: new Date().toISOString()
        });

        // Provide specific error messages based on common issues
        let userMessage = error.message || 'Edge Function call failed';
        
        if (error.status === 403) {
          userMessage = 'Environment validation failed. Admin creation may not be enabled in Supabase secrets.';
        } else if (error.status === 404) {
          userMessage = 'Edge Function not found. Please ensure create-platform-admin function is deployed.';
        } else if (error.status === 500) {
          userMessage = 'Internal server error in Edge Function. Check function logs for details.';
        }

        throw new Error(userMessage);
      }

      if (!response) {
        console.error('[ADMIN_SETUP] No response data received from Edge Function');
        setDebugInfo({
          type: 'no_response',
          timestamp: new Date().toISOString()
        });
        throw new Error('No response received from Edge Function');
      }

      console.log('[ADMIN_SETUP] Success response:', response);
      setDebugInfo({
        type: 'success',
        response,
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

      console.log('[ADMIN_SETUP] Admin created successfully');

    } catch (error) {
      console.error('[ADMIN_SETUP] Creation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setResult({
        success: false,
        message: errorMessage
      });

      toast({
        title: "Admin Creation Failed",
        description: errorMessage,
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

          {/* Environment Configuration Alert */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Environment Setup:</strong> Ensure these Supabase secrets are configured:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>ADMIN_CREATION_ENABLED=true</code></li>
                <li><code>ENVIRONMENT=development</code></li>
                <li><code>DEFAULT_ADMIN_EMAIL</code> (optional)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!result && (
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
                  disabled={isLoading}
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

          {/* Debug Information Display */}
          {debugInfo && (
            <div className="mt-4">
              <Alert className="border-gray-200 bg-gray-50">
                <Info className="h-4 w-4 text-gray-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-800">Debug Information:</p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                    {debugInfo.type === 'error' && debugInfo.error?.status === 403 && (
                      <div className="text-sm text-gray-700 mt-2">
                        <p><strong>Troubleshooting 403 Error:</strong></p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Check Supabase secrets configuration</li>
                          <li>Verify ADMIN_CREATION_ENABLED is set to 'true'</li>
                          <li>Ensure ENVIRONMENT is set to 'development' or 'staging'</li>
                          <li>Review Edge Function logs for detailed error information</li>
                        </ol>
                      </div>
                    )}
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
