
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { 
  createPlatformAdmin, 
  checkAdminCreationStatus, 
  validateAdminCreationPrerequisites,
  getAdminSetupInstructions,
  type AdminCreationResponse,
  type AdminStatusResponse 
} from '@/services/adminService';
import { isDevelopmentEnvironment } from '@/utils/security';

export const PlatformAdminSetup: React.FC = () => {
  const [adminStatus, setAdminStatus] = useState<AdminStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdminCreationResponse | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);

  // Only show in development environment
  if (!isDevelopmentEnvironment()) {
    return null;
  }

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const status = await checkAdminCreationStatus();
      setAdminStatus(status);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const prerequisites = validateAdminCreationPrerequisites();
      if (!prerequisites.valid) {
        setResult({
          success: false,
          message: `Prerequisites not met: ${prerequisites.issues.join(', ')}`
        });
        return;
      }

      const response = await createPlatformAdmin({
        email: useCustomEmail ? customEmail : undefined
      });
      
      setResult(response);
      
      // Refresh status after creation
      if (response.success) {
        await checkStatus();
      }
    } catch (error) {
      console.error('Admin creation failed:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupInstructions = getAdminSetupInstructions();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">Platform Administrator Setup</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This interface is only available in development environments. 
              Use this to create the initial platform administrator account.
            </AlertDescription>
          </Alert>

          {/* Status Display */}
          {adminStatus && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${adminStatus.canCreate ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">
                    {adminStatus.canCreate ? 'Can Create Admin' : 'Cannot Create Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${adminStatus.exists ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="text-sm">
                    {adminStatus.exists ? 'Admin Exists' : 'No Admin Found'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Environment: {adminStatus.environment}</span>
                </div>
              </div>
              {adminStatus.message && (
                <p className="text-sm text-gray-600 mt-2">{adminStatus.message}</p>
              )}
            </div>
          )}

          <Separator className="my-4" />

          {/* Setup Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              {setupInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Admin Creation Form */}
          {adminStatus?.canCreate && !adminStatus.exists && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-semibold">Create Platform Administrator</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useCustomEmail"
                    checked={useCustomEmail}
                    onChange={(e) => setUseCustomEmail(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useCustomEmail">Use custom email address</Label>
                </div>

                {useCustomEmail && (
                  <div>
                    <Label htmlFor="customEmail">Admin Email Address</Label>
                    <Input
                      id="customEmail"
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                      className="mt-1"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleCreateAdmin} 
                  disabled={loading || (useCustomEmail && !customEmail)}
                  className="w-full"
                >
                  {loading ? 'Creating Administrator...' : 'Create Platform Administrator'}
                </Button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-3">
                    <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.message}
                    </p>
                    
                    {result.success && result.temporaryPassword && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-semibold text-green-800 mb-2">Admin Credentials (Save Securely):</p>
                        <div className="space-y-1 text-sm">
                          <p><strong>Email:</strong> {customEmail || 'Default admin email'}</p>
                          <p><strong>Temporary Password:</strong> 
                            <code className="bg-gray-100 px-2 py-1 rounded ml-2 font-mono">
                              {result.temporaryPassword}
                            </code>
                          </p>
                        </div>
                        <p className="text-amber-600 text-sm mt-2">
                          ⚠️ Change this password immediately after first login
                        </p>
                      </div>
                    )}

                    {result.nextSteps && (
                      <div>
                        <p className="font-semibold text-green-800 mb-2">Next Steps:</p>
                        <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
                          {result.nextSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={checkStatus} disabled={loading}>
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
