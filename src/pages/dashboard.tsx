
import React from "react";
import { MainLayout } from "../layouts";
import KpiCard from "../components/KpiCard";
import TimeSeriesChart from "../components/TimeSeriesChart";
import { useAsoData } from "../context/AsoDataContext";

const Dashboard: React.FC = () => {
  const { data, loading } = useAsoData();
  
  // Display a loading state when data is being fetched
  if (loading || !data) {
    return (
      <MainLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 animate-pulse rounded-md"></div>
          ))}
        </div>
        <div className="h-64 bg-zinc-800 animate-pulse rounded-md"></div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard 
          title="Impressions" 
          value={data.summary.impressions.value} 
          delta={data.summary.impressions.delta} 
        />
        <KpiCard 
          title="Downloads" 
          value={data.summary.downloads.value} 
          delta={data.summary.downloads.delta} 
        />
        <KpiCard 
          title="Page Views" 
          value={data.summary.pageViews.value} 
          delta={data.summary.pageViews.delta} 
        />
        <KpiCard 
          title="CVR" 
          value={data.summary.cvr.value} 
          delta={data.summary.cvr.delta} 
        />
      </div>
      
      <TimeSeriesChart title="Performance Metrics" data={data.timeseriesData} />
    </MainLayout>
  );
};

export default Dashboard;
