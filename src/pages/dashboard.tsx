
import React from "react";
import { MainLayout } from "../layouts";
import KpiCard from "../components/KpiCard";
import LineChartPlaceholder from "../components/LineChartPlaceholder";

const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard 
          title="Impressions" 
          value={0} 
          changePercentage={0} 
          isPositive={true} 
        />
        <KpiCard 
          title="Downloads" 
          value={0} 
          changePercentage={0} 
          isPositive={true} 
        />
        <KpiCard 
          title="Page Views" 
          value={0} 
          changePercentage={0} 
          isPositive={true} 
        />
        <KpiCard 
          title="CVR" 
          value={0} 
          changePercentage={0} 
          isPositive={true} 
        />
      </div>
      
      <LineChartPlaceholder title="Performance Metrics" />
    </MainLayout>
  );
};

export default Dashboard;
