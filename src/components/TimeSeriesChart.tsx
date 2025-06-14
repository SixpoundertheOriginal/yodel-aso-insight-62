
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
import { TimeSeriesPoint } from "@/hooks/useAsoMetrics";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartColors, chartConfig } from "@/utils/chartConfig";

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

  // Use shared chart config
  const chartConfigObj = {
    impressions: { color: chartColors.impressions },
    downloads: { color: chartColors.downloads },
    productPageViews: { color: chartColors.pageViews }
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" style={{ backgroundColor: chartColors.impressions }}></div>
            <span className="text-sm text-zinc-400">Impressions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" style={{ backgroundColor: chartColors.downloads }}></div>
            <span className="text-sm text-zinc-400">Downloads</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2" style={{ backgroundColor: chartColors.pageViews }}></div>
            <span className="text-sm text-zinc-400">Product Page Views</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ChartContainer config={chartConfigObj}>
          <LineChart data={formattedData}>
            <CartesianGrid 
              strokeDasharray={chartConfig.grid.strokeDasharray} 
              stroke={chartConfig.grid.stroke}
            />
            <XAxis 
              dataKey="date"
              tick={{ fill: chartConfig.axis.tick.fill }}
              tickLine={{ stroke: chartConfig.axis.tick.fill }}
              tickFormatter={(value) => {
                // On mobile screens, show shorter date format
                if (window.innerWidth < 768) {
                  return value.split(' ')[1]; // Just show the day
                }
                return value;
              }}
            />
            <YAxis 
              tick={{ fill: chartConfig.axis.tick.fill }} 
              tickLine={{ stroke: chartConfig.axis.tick.fill }}
              width={60}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="impressions" 
              stroke={chartColors.impressions}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="downloads" 
              stroke={chartColors.downloads}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="productPageViews" 
              stroke={chartColors.pageViews}
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
