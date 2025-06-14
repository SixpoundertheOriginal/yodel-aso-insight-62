// src/pages/dashboard.tsx
import React, { useState, useEffect } from "react";
import { MainLayout } from "../layouts";
import KpiCard from "../components/KpiCard";
import TimeSeriesChart from "../components/TimeSeriesChart";
import ComparisonChart from "../components/ComparisonChart";
import AiInsightsBox from "../components/AiInsightsBox";
import { ChatInterface } from "../components/ChatInterface";
import { ChatButton } from "../components/ChatButton";
import { useAsoData } from "../context/AsoDataContextV2";
import { useComparisonData } from "../hooks/useComparisonData";
import { useOrganization } from "../hooks/useOrganization";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent } from "@/components/ui/card";
import ChartContainer from "@/components/ui/ChartContainer";
import { chartConfig } from "@/utils/chartConfig";

const Dashboard: React.FC = () => {
  const [excludeAsa, setExcludeAsa] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { organization, profile, loading: orgDetailsLoading } = useOrganization();
  const { data, loading: asoDataLoading, filters, setFilters } = useAsoData();

  // The withAuth HOC now ensures this component only renders when authState is AUTHENTICATED_COMPLETE.
  // Thus, user, profile, and a basic organization record are guaranteed to exist.
  // The SetupOrganization flow is handled by AuthContext and withAuth.

  // Update traffic sources when excludeAsa toggles
  useEffect(() => {
    if (excludeAsa) {
      setFilters(prev => ({
        ...prev,
        trafficSources: prev.trafficSources.filter(src => src !== "Apple Search Ads"),
      }));
    } else {
      setFilters(prev =>
        prev.trafficSources.includes("Apple Search Ads")
          ? prev
          : { ...prev, trafficSources: [...prev.trafficSources, "Apple Search Ads"] }
      );
    }
  }, [excludeAsa, setFilters]);

  const periodComparison = useComparisonData("period");
  const yearComparison = useComparisonData("year");

  // orgDetailsLoading is for fetching specific org data via useOrganization
  // asoDataLoading is for fetching ASO metrics
  if (orgDetailsLoading || asoDataLoading || !data || !organization) {
    // Show a generic loading state for the dashboard content
    // This assumes that by the time we are here, basic org/profile exists (guaranteed by withAuth)
    // This loading is for the *content* of the dashboard.
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

  // Add null/undefined checks for the summary data
  const impressionsValue = data.summary?.impressions?.value || 0;
  const impressionsDelta = data.summary?.impressions?.delta || 0;
  const downloadsValue = data.summary?.downloads?.value || 0;
  const downloadsDelta = data.summary?.downloads?.delta || 0;
  const pageViewsValue = data.summary?.pageViews?.value || 0;
  const pageViewsDelta = data.summary?.pageViews?.delta || 0;
  const cvrValue = data.summary?.cvr?.value || 0;
  const cvrDelta = data.summary?.cvr?.delta || 0;

  return (
    <MainLayout>
      {/* Organization Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
        <p className="text-zinc-400">Welcome back, {profile?.first_name || user?.email || 'User'}</p>
      </div>

      {/* KPI Cards */}
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

      {/* Exclude ASA Toggle */}
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

      {/* AI Insights Box */}
      <AiInsightsBox 
        summaryData={data.summary}
        excludeAsa={excludeAsa}
      />

      {/* Performance Metrics Chart */}
      <Card className="bg-zinc-800 rounded-md mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-4">Performance Metrics</h2>
          <ChartContainer height={chartConfig.height}>
            {data.timeseriesData && <TimeSeriesChart data={data.timeseriesData} />}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Previous Period Comparison */}
      {!periodComparison.loading &&
        periodComparison.current &&
        periodComparison.previous && (
          <Card className="bg-zinc-800 rounded-md mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Previous Period</h2>
              <ChartContainer height={chartConfig.height}>
                <ComparisonChart
                  currentData={periodComparison.current.timeseriesData}
                  previousData={periodComparison.previous.timeseriesData}
                  title="Previous Period"
                  metric="downloads"
                />
              </ChartContainer>
            </CardContent>
          </Card>
        )}

      {/* Previous Year Comparison */}
      {!yearComparison.loading &&
        yearComparison.current &&
        yearComparison.previous && (
          <Card className="bg-zinc-800 rounded-md mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Previous Year</h2>
              <ChartContainer height={chartConfig.height}>
                <ComparisonChart
                  currentData={yearComparison.current.timeseriesData}
                  previousData={yearComparison.previous.timeseriesData}
                  title="Previous Year"
                  metric="downloads"
                />
              </ChartContainer>
            </CardContent>
          </Card>
        )}

      {/* Chat Interface */}
      <ChatButton 
        onClick={() => setIsChatOpen(true)} 
        isOpen={isChatOpen} 
      />
      <ChatInterface 
        dashboardData={data}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </MainLayout>
  );
};

export default Dashboard;
