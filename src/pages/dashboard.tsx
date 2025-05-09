
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
          value={145872} 
          delta={5.4} 
        />
        <KpiCard 
          title="Downloads" 
          value={23456} 
          delta={-2.1} 
        />
        <KpiCard 
          title="Page Views" 
          value={78943} 
          delta={12.7} 
        />
        <KpiCard 
          title="CVR" 
          value={3.45} 
          delta={-0.8} 
        />
      </div>
      
      <LineChartPlaceholder title="Performance Metrics" />
    </MainLayout>
  );
};

export default Dashboard;
