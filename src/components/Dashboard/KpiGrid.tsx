
import React from 'react';
import KpiCard from "../KpiCard";
import { PermissionGate } from "../Auth/PermissionGate";

interface KpiGridProps {
  organizationId: string;
  impressionsValue: number;
  impressionsDelta: number;
  downloadsValue: number;
  downloadsDelta: number;
  pageViewsValue: number;
  pageViewsDelta: number;
  cvrValue: number;
  cvrDelta: number;
}

export const KpiGrid: React.FC<KpiGridProps> = ({
  organizationId,
  impressionsValue,
  impressionsDelta,
  downloadsValue,
  downloadsDelta,
  pageViewsValue,
  pageViewsDelta,
  cvrValue,
  cvrDelta,
}) => {
  return (
    <PermissionGate permission="VIEW_DASHBOARD" organizationId={organizationId}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard
          title="Impressions"
          value={impressionsValue}
          delta={impressionsDelta}
        />
        <KpiCard
          title="Downloads"
          value={downloadsValue}
          delta={downloadsDelta}
        />
        <KpiCard
          title="Page Views"
          value={pageViewsValue}
          delta={pageViewsDelta}
        />
        <KpiCard 
          title="CVR" 
          value={cvrValue} 
          delta={cvrDelta} 
        />
      </div>
    </PermissionGate>
  );
};
