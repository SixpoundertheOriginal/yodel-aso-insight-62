
import React from 'react';
import { Toggle } from "@/components/ui/toggle";
import { PermissionGate } from "../Auth/PermissionGate";

interface DashboardControlsProps {
  organizationId: string;
  excludeAsa: boolean;
  setExcludeAsa: (value: boolean) => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  organizationId,
  excludeAsa,
  setExcludeAsa,
}) => {
  return (
    <PermissionGate permission="VIEW_ASO_METRICS" organizationId={organizationId}>
      <div className="flex justify-end mb-4">
        <div className="flex items-center">
          <span className="text-sm text-zinc-400 mr-2">Exclude ASA</span>
          <Toggle
            pressed={excludeAsa}
            onPressedChange={setExcludeAsa}
            aria-label="Exclude Apple Search Ads"
          />
        </div>
      </div>
    </PermissionGate>
  );
};
