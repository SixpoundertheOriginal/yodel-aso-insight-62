
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

const ComparisonChart: React.FC<ComparisonChartProps> = React.memo(({ 
  currentData,
  previousData,
  title = "Comparison",
  metric = 'downloads'
}) => {
  // Format the data for display
  const formattedCurrentData = currentData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    [`current_${metric}`]: item[metric]
  }));
  
  const formattedPreviousData = previousData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    [`previous_${metric}`]: item[metric]
  }));
  
  // Create a mapping dictionary for dates
  const dateMap = new Map();
  formattedCurrentData.forEach(item => {
    dateMap.set(item.date, { 
      date: item.date, 
      [`current_${metric}`]: item[`current_${metric}`] 
    });
  });
  
  // Merge previous data into the dictionary
  formattedPreviousData.forEach(item => {
    if (dateMap.has(item.date)) {
      dateMap.set(item.date, { 
        ...dateMap.get(item.date), 
        [`previous_${metric}`]: item[`previous_${metric}`] 
      });
    } else {
      dateMap.set(item.date, { 
        date: item.date, 
        [`previous_${metric}`]: item[`previous_${metric}`] 
      });
    }
  });
  
  // Convert the map to an array
  const combinedData = Array.from(dateMap.values());
  
  const chartConfig = {
    [`current_${metric}`]: { color: "#3b82f6" }, // blue for current
    [`previous_${metric}`]: { color: "#8b5cf6" }  // purple for previous
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
            <LineChart data={combinedData}>
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
                dataKey={`current_${metric}`}
                name="Current"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey={`previous_${metric}`}
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
