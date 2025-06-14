
import React from 'react';
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/Auth/PermissionGate";

interface DashboardHeaderProps {
  organization: { id: string; name: string };
  profile: { first_name?: string; email?: string } | null;
  getHighestRole: () => string | null;
  onToggleUserManagement: () => void;
  showUserManagement: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  organization,
  profile,
  getHighestRole,
  onToggleUserManagement,
  showUserManagement,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
          <p className="text-zinc-400">
            Welcome back, {profile?.first_name || profile?.email || 'User'}
            {getHighestRole() && (
              <span className="ml-2 text-xs px-2 py-1 bg-zinc-700 rounded">
                {getHighestRole()?.replace(/_/g, ' ')}
              </span>
            )}
          </p>
        </div>
        
        <PermissionGate permission="MANAGE_ORGANIZATION_USERS" organizationId={organization.id}>
          <Button
            variant="outline"
            onClick={onToggleUserManagement}
          >
            {showUserManagement ? 'Hide' : 'Manage'} Users
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
};
