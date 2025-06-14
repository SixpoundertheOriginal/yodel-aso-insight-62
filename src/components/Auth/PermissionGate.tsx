
import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  role?: AppRole;
  organizationId?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified permissions/roles
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  organizationId,
  fallback = null,
  requireAll = false
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { hasPermission, hasRole, loading: permissionsLoading } = usePermissions(organizationId);

  useEffect(() => {
    const checkAccess = async () => {
      if (permissionsLoading) return;

      try {
        setLoading(true);
        
        const checks: Promise<boolean>[] = [];
        
        if (permission) {
          checks.push(hasPermission(permission, organizationId));
        }
        
        if (role) {
          checks.push(Promise.resolve(hasRole(role, organizationId)));
        }

        if (checks.length === 0) {
          // No conditions specified, default to allow access
          setHasAccess(true);
          return;
        }

        const results = await Promise.all(checks);
        
        if (requireAll) {
          setHasAccess(results.every(result => result));
        } else {
          setHasAccess(results.some(result => result));
        }
      } catch (error) {
        console.error('Error checking access permissions:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [permission, role, organizationId, requireAll, hasPermission, hasRole, permissionsLoading]);

  if (loading || permissionsLoading) {
    return <div className="animate-pulse h-4 bg-zinc-700 rounded"></div>;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
