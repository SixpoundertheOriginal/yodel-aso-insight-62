
import React from "react";
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

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  title?: string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = React.memo(({ 
  data,
  title = "Performance Over Time"
}) => {
  // Format the date to be more readable
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const chartConfig = {
    impressions: { color: "#3b82f6" }, // blue
    downloads: { color: "#10b981" },   // green
    pageViews: { color: "#8b5cf6" }    // purple
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-zinc-400">Impressions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-zinc-400">Downloads</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-sm text-zinc-400">Page Views</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ChartContainer config={chartConfig}>
          <LineChart data={formattedData}>
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
              dataKey="impressions" 
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="downloads" 
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="pageViews" 
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
});

TimeSeriesChart.displayName = "TimeSeriesChart";
export default TimeSeriesChart;
