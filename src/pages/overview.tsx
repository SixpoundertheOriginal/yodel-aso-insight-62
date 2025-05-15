
import React, { useState } from "react";
import { MainLayout } from "../layouts";
import { useAsoData } from "../context/AsoDataContext";
import ComparisonChart from "../components/ComparisonChart";
import { useComparisonData } from "../hooks";
import { DateRange } from "../hooks/useMockAsoData";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/ChartContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrafficSourceSelect } from "@/components/Filters";

const OverviewPage: React.FC = () => {
  const { data, loading, filters, setFilters } = useAsoData();
  const { current, previous } = useComparisonData('period');
  const [selectedSources, setSelectedSources] = useState<string[]>(
    filters.trafficSources
  );

  // Handle filter change
  const handleSourceChange = (sources: string[]) => {
    setSelectedSources(sources);
    setFilters(prev => ({
      ...prev,
      trafficSources: sources
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    const today = new Date();
    let from = new Date();
    
    switch(value) {
      case '7d':
        from.setDate(today.getDate() - 7);
        break;
      case '30d':
        from.setDate(today.getDate() - 30);
        break;
      case '90d':
        from.setDate(today.getDate() - 90);
        break;
      default:
        from.setDate(today.getDate() - 30);
    }
    
    const newDateRange: DateRange = {
      from,
      to: today
    };
    
    setFilters(prev => ({
      ...prev,
      dateRange: newDateRange
    }));
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Performance Overview</h1>
          
          <div className="flex gap-4">
            {/* Date Range Filter */}
            <Select defaultValue="30d" onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Traffic Source Filter */}
            <TrafficSourceSelect 
              selectedSources={selectedSources}
              onSourceChange={handleSourceChange}
            />
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3].map((_, index) => (
              <Card key={index} className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-80 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Charts */}
        {!loading && current && previous && (
          <div className="grid grid-cols-1 gap-8">
            {/* Impressions Chart */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={400}>
                  <ComparisonChart
                    currentData={current.timeseriesData}
                    previousData={previous.timeseriesData}
                    title="Impressions"
                    metric="impressions"
                  />
                </ChartContainer>
              </CardContent>
            </Card>
            
            {/* Downloads Chart */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={400}>
                  <ComparisonChart
                    currentData={current.timeseriesData}
                    previousData={previous.timeseriesData}
                    title="Downloads"
                    metric="downloads"
                  />
                </ChartContainer>
              </CardContent>
            </Card>
            
            {/* Conversion Rate Chart - calculated as (downloads/impressions)*100 */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                {data && data.summary && (
                  <>
                    <ChartContainer height={200}>
                      <div className="flex flex-col h-full justify-center items-center">
                        <div className="text-6xl font-bold">
                          {((data.summary.downloads.value / data.summary.impressions.value) * 100).toFixed(1)}%
                        </div>
                        <div className="flex items-center mt-4">
                          <span className={`text-xl ${data.summary.cvr.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {data.summary.cvr.delta >= 0 ? '↑' : '↓'}
                            {Math.abs(data.summary.cvr.delta).toFixed(1)}%
                          </span>
                          <span className="text-lg text-zinc-400 ml-2">vs previous period</span>
                        </div>
                      </div>
                    </ChartContainer>
                    
                    <div className="mt-6">
                      <ChartContainer height={200}>
                        <div className="grid grid-cols-2 gap-8 h-full">
                          <div className="bg-zinc-700/30 rounded-lg p-6 flex flex-col justify-center">
                            <div className="text-zinc-400 mb-2">Total Impressions</div>
                            <div className="text-3xl font-bold">
                              {data.summary.impressions.value.toLocaleString()}
                            </div>
                            <div className={`text-sm mt-2 ${data.summary.impressions.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {data.summary.impressions.delta >= 0 ? '↑' : '↓'} 
                              {Math.abs(data.summary.impressions.delta).toFixed(1)}% vs previous
                            </div>
                          </div>
                          
                          <div className="bg-zinc-700/30 rounded-lg p-6 flex flex-col justify-center">
                            <div className="text-zinc-400 mb-2">Total Downloads</div>
                            <div className="text-3xl font-bold">
                              {data.summary.downloads.value.toLocaleString()}
                            </div>
                            <div className={`text-sm mt-2 ${data.summary.downloads.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {data.summary.downloads.delta >= 0 ? '↑' : '↓'} 
                              {Math.abs(data.summary.downloads.delta).toFixed(1)}% vs previous
                            </div>
                          </div>
                        </div>
                      </ChartContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default OverviewPage;
