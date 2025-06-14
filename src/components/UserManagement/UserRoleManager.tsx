
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getOrganizationUsers, assignUserRole, removeUserRole } from '@/services/roleManagement';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface OrganizationUser {
  id: string;
  user_id: string;
  organization_id: string;
  role: AppRole;
  profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface UserRoleManagerProps {
  organizationId: string;
}

const ORGANIZATION_ROLES: AppRole[] = ['ORGANIZATION_ADMIN', 'MANAGER', 'ANALYST', 'VIEWER'];

const getRoleBadgeColor = (role: AppRole) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'bg-red-600';
    case 'ORGANIZATION_ADMIN': return 'bg-purple-600';
    case 'MANAGER': return 'bg-blue-600';
    case 'ANALYST': return 'bg-green-600';
    case 'VIEWER': return 'bg-gray-600';
    default: return 'bg-gray-600';
  }
};

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({ organizationId }) => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { hasPermission } = usePermissions(organizationId);

  useEffect(() => {
    loadUsers();
  }, [organizationId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await getOrganizationUsers(organizationId);
      
      if (result.success) {
        setUsers(result.users as OrganizationUser[]);
      } else {
        toast({
          title: 'Error loading users',
          description: result.error?.message || 'Failed to load organization users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error loading users',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, currentRole: AppRole, newRole: AppRole) => {
    if (currentRole === newRole) return;

    try {
      setUpdatingRoles(prev => new Set(prev).add(userId));

      // Remove current role
      const removeResult = await removeUserRole(userId, currentRole, organizationId);
      if (!removeResult.success) {
        throw removeResult.error || new Error('Failed to remove current role');
      }

      // Assign new role
      const assignResult = await assignUserRole(userId, newRole, organizationId);
      if (!assignResult.success) {
        throw assignResult.error || new Error('Failed to assign new role');
      }

      toast({
        title: 'Role updated successfully',
        description: `User role changed from ${currentRole} to ${newRole}`,
      });

      // Refresh users list
      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error updating role',
        description: error instanceof Error ? error.message : 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const canManageUsers = async () => {
    return await hasPermission('MANAGE_ORGANIZATION_USERS', organizationId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-zinc-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-700 rounded animate-pulse"></div>
                  <div className="h-3 bg-zinc-700 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-zinc-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-zinc-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-zinc-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.profiles?.first_name?.[0] || user.profiles?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">
                    {user.profiles?.first_name && user.profiles?.last_name
                      ? `${user.profiles.first_name} ${user.profiles.last_name}`
                      : user.profiles?.email || 'Unknown User'}
                  </p>
                  <p className="text-sm text-zinc-400">{user.profiles?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                  {user.role.replace('_', ' ')}
                </Badge>
                
                <Select
                  value={user.role}
                  onValueChange={(newRole: AppRole) => updateUserRole(user.user_id, user.role, newRole)}
                  disabled={updatingRoles.has(user.user_id)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="text-center py-8 text-zinc-400">
              No users found in this organization
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
