
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createDemoOrganization } from '@/services/seedData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const SetupOrganization: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateDemo = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await createDemoOrganization(user.id, user.email || '');
      
      if (result.success) {
        toast({
          title: 'Demo organization created!',
          description: 'Your demo organization has been set up with sample data.',
        });
        // Refresh the page to load the new organization
        window.location.reload();
      } else {
        // Ensure result.error is treated as an Error type or similar
        const errorToThrow = result.error instanceof Error ? result.error : new Error(String(result.error?.message || 'Unknown error during organization creation'));
        if (result.error && typeof result.error === 'object' && 'message' in result.error) {
          // Augment the error with more details if available
          (errorToThrow as any).details = result.error;
        }
        throw errorToThrow;
      }
    } catch (error: any) {
      console.error('Detailed error creating demo organization:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      toast({
        title: 'Error Creating Organization',
        description: error.message || 'Failed to create demo organization. Please check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900 p-4">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Welcome to ASO Platform</CardTitle>
          <CardDescription className="text-zinc-400">
            You need to be part of an organization to access ASO data. 
            Create a demo organization to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCreateDemo} 
            disabled={loading || !user} // Also disable if user is somehow null
            className="w-full"
          >
            {loading ? 'Creating Demo Organization...' : 'Create Demo Organization'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

