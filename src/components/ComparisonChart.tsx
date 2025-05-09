
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { TimeSeriesPoint } from "@/hooks/useMockAsoData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ComparisonChartProps {
  currentData: TimeSeriesPoint[];
  previousData: TimeSeriesPoint[];
  title?: string;
  metric?: 'impressions' | 'downloads' | 'pageViews';
}

/**
 * Utility function to merge current and previous data series
 * with proper date alignment
 */
export const mergeSeries = (currentData: TimeSeriesPoint[], previousData: TimeSeriesPoint[], metric: string) => {
  const dateMap = new Map();
  
  // Format and add current data to map
  currentData.forEach(item => {
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateMap.set(dateStr, { 
      date: dateStr,
      current: item[metric as keyof TimeSeriesPoint] as number,
    });
  });
  
  // Add previous data to map
  previousData.forEach(item => {
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = dateMap.get(dateStr);
    
    if (existing) {
      dateMap.set(dateStr, { 
        ...existing, 
        previous: item[metric as keyof TimeSeriesPoint] as number,
      });
    } else {
      dateMap.set(dateStr, { 
        date: dateStr,
        previous: item[metric as keyof TimeSeriesPoint] as number,
      });
    }
  });
  
  // Convert map to array and sort by date
  return Array.from(dateMap.values()).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

const ComparisonChart: React.FC<ComparisonChartProps> = React.memo(({ 
  currentData,
  previousData,
  title = "Comparison",
  metric = 'downloads'
}) => {
  // Merge the data series
  const mergedData = mergeSeries(currentData, previousData, metric);
  
  const chartConfig = {
    current: { color: "#3b82f6" }, // blue for current
    previous: { color: "#8b5cf6" }  // purple for previous
  };
  
  return (
    <Card className="shadow-md mt-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-zinc-400">Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm text-zinc-400">Previous</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ChartContainer config={chartConfig}>
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="date"
                tick={{ fill: '#9ca3af' }}
                tickLine={{ stroke: '#9ca3af' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af' }} 
                tickLine={{ stroke: '#9ca3af' }}
                width={60}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="current"
                name="Current"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="previous"
                name="Previous"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
});

ComparisonChart.displayName = "ComparisonChart";
export default ComparisonChart;
