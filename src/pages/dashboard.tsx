
import React, { useState, useEffect } from "react";
import { MainLayout } from "../layouts";
import KpiCard from "../components/KpiCard";
import TimeSeriesChart from "../components/TimeSeriesChart";
import ComparisonChart from "../components/ComparisonChart";
import { useAsoData } from "../context/AsoDataContext";
import { useComparisonData } from "../hooks/useComparisonData";
import { Toggle } from "@/components/ui/toggle";

const Dashboard: React.FC = () => {
  const [excludeAsa, setExcludeAsa] = useState(false);
  const { data, loading, filters, setFilters } = useAsoData();
  
  // Update traffic sources when excludeAsa changes
  useEffect(() => {
    if (excludeAsa) {
      setFilters(prev => ({
        ...prev,
        trafficSources: prev.trafficSources.filter(source => source !== "Apple Search Ads")
      }));
    } else {
      setFilters(prev => {
        // Only add Apple Search Ads if it's not already present
        if (!prev.trafficSources.includes("Apple Search Ads")) {
          return {
            ...prev,
            trafficSources: [...prev.trafficSources, "Apple Search Ads"]
          };
        }
        return prev;
      });
    }
  }, [excludeAsa, setFilters]);
  
  // Get comparison data for previous period and year
  const periodComparison = useComparisonData('period');
  const yearComparison = useComparisonData('year');
  
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
      
      <TimeSeriesChart title="Performance Metrics" data={data.timeseriesData} />
      
      {!periodComparison.loading && periodComparison.current && periodComparison.previous && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Previous Period</h2>
          <ComparisonChart 
            currentData={periodComparison.current.timeseriesData} 
            previousData={periodComparison.previous.timeseriesData} 
            title="Downloads Comparison" 
            metric="downloads"
          />
        </div>
      )}
      
      {!yearComparison.loading && yearComparison.current && yearComparison.previous && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Previous Year</h2>
          <ComparisonChart 
            currentData={yearComparison.current.timeseriesData} 
            previousData={yearComparison.previous.timeseriesData} 
            title="Downloads Comparison" 
            metric="downloads"
          />
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;
