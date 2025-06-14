
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
        throw result.error;
      }
    } catch (error) {
      console.error('Error creating demo organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to create demo organization. Please try again.',
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
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Demo Organization...' : 'Create Demo Organization'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
