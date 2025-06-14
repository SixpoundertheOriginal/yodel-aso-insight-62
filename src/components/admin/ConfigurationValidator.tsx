
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Settings, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConfigStatus {
  isValidating: boolean;
  canCreate: boolean;
  issues: string[];
  lastChecked?: Date;
}

interface ConfigurationValidatorProps {
  onValidationChange?: (isValid: boolean) => void;
}

export const ConfigurationValidator: React.FC<ConfigurationValidatorProps> = ({ 
  onValidationChange 
}) => {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    isValidating: false,
    canCreate: false,
    issues: ['Configuration not yet validated'],
  });

  const validateConfiguration = async () => {
    setConfigStatus(prev => ({ ...prev, isValidating: true }));

    try {
      console.log('[CONFIG_VALIDATOR] Testing Edge Function configuration...');
      
      const { data, error } = await supabase.functions.invoke('create-platform-admin', {
        method: 'GET'
      });

      const issues: string[] = [];
      let canCreate = true;

      if (error) {
        console.log('[CONFIG_VALIDATOR] Edge Function error:', error);
        
        switch (error.status) {
          case 403:
            issues.push('ADMIN_CREATION_ENABLED must be set to "true"');
            issues.push('ENVIRONMENT must be set to "development" or "staging"');
            canCreate = false;
            break;
          case 404:
            issues.push('Edge Function "create-platform-admin" not found or not deployed');
            canCreate = false;
            break;
          case 409:
            issues.push('Platform administrator already exists');
            canCreate = false;
            break;
          default:
            issues.push(`Edge Function error: ${error.message || 'Unknown error'}`);
            canCreate = false;
        }
      } else {
        console.log('[CONFIG_VALIDATOR] Configuration appears valid');
      }

      const newStatus = {
        isValidating: false,
        canCreate,
        issues: issues.length > 0 ? issues : [],
        lastChecked: new Date()
      };

      setConfigStatus(newStatus);
      onValidationChange?.(canCreate);

    } catch (error) {
      console.error('[CONFIG_VALIDATOR] Validation failed:', error);
      setConfigStatus({
        isValidating: false,
        canCreate: false,
        issues: ['Unable to validate configuration - check network connection'],
        lastChecked: new Date()
      });
      onValidationChange?.(false);
    }
  };

  useEffect(() => {
    validateConfiguration();
  }, []);

  const getStatusColor = () => {
    if (configStatus.isValidating) return 'bg-blue-100 text-blue-800';
    if (configStatus.canCreate) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (configStatus.isValidating) return 'Validating...';
    if (configStatus.canCreate) return 'Ready';
    return 'Configuration Required';
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800">Configuration Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={validateConfiguration}
              disabled={configStatus.isValidating}
            >
              {configStatus.isValidating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Summary */}
        {configStatus.canCreate ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Configuration is valid. Admin creation is ready.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Configuration issues detected. Please resolve the following:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {configStatus.issues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Requirements */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-3">Required Supabase Secrets</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                    ADMIN_CREATION_ENABLED
                  </code>
                  <p className="text-xs text-gray-600 mt-1">Must be set to: <strong>true</strong></p>
                </div>
                <Badge variant="outline" className="text-xs">Required</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                    ENVIRONMENT
                  </code>
                  <p className="text-xs text-gray-600 mt-1">Must be: <strong>development</strong> or <strong>staging</strong></p>
                </div>
                <Badge variant="outline" className="text-xs">Required</Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                    DEFAULT_ADMIN_EMAIL
                  </code>
                  <p className="text-xs text-gray-600 mt-1">Optional fallback email address</p>
                </div>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-3">Setup Instructions</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to Settings → Edge Functions</li>
            <li>Add the required secrets with their values</li>
            <li>Click "Refresh" above to validate the configuration</li>
          </ol>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/bkbcqocpjahewqjmlgvf/settings/functions', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Supabase Secrets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/bkbcqocpjahewqjmlgvf/functions/create-platform-admin/logs', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Function Logs
          </Button>
        </div>

        {/* Last Checked */}
        {configStatus.lastChecked && (
          <p className="text-xs text-gray-500">
            Last checked: {configStatus.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
