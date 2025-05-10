
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TimeSeriesDataPoint {
  date: string;
  impressions: number;
  downloads: number;
  pageViews: number;
  [key: string]: any;
}

interface ComparisonChartProps {
  currentData: TimeSeriesDataPoint[];
  previousData: TimeSeriesDataPoint[];
  title: string;
  metric: string;
}

/**
 * Utility function that merges current and previous series data
 * ensuring dates are properly aligned for comparison
 */
export const mergeSeries = (currentData: TimeSeriesDataPoint[], previousData: TimeSeriesDataPoint[], metric: string) => {
  // Create a map to hold all unique dates and their values
  const mergedMap = new Map();
  
  // Process current data
  currentData.forEach(point => {
    // Format date for consistent comparison
    const dateStr = new Date(point.date).toISOString().split('T')[0];
    mergedMap.set(dateStr, { 
      date: dateStr,
      current: point[metric] || 0
    });
  });
  
  // Process previous data and merge with current
  previousData.forEach(point => {
    const dateStr = new Date(point.date).toISOString().split('T')[0];
    const existing = mergedMap.get(dateStr);
    
    if (existing) {
      // Update existing entry with previous data
      mergedMap.set(dateStr, { 
        ...existing, 
        previous: point[metric] || 0
      });
    } else {
      // Create new entry for dates only in previous data
      mergedMap.set(dateStr, { 
        date: dateStr,
        previous: point[metric] || 0,
        current: 0 // Default 0 for missing current data
      });
    }
  });
  
  // Make sure all entries have both current and previous (using 0 as default)
  mergedMap.forEach((value, key) => {
    if (value.current === undefined) value.current = 0;
    if (value.previous === undefined) value.previous = 0;
  });
  
  // Convert map to array and sort by date
  return Array.from(mergedMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  currentData, 
  previousData, 
  title, 
  metric 
}) => {
  // Use our utility function to merge the series data
  const mergedData = useMemo(() => {
    if (!currentData || !previousData) return [];
    return mergeSeries(currentData, previousData, metric);
  }, [currentData, previousData, metric]);

  // Find the minimum and maximum values for proper scaling
  const dataExtent = useMemo(() => {
    if (mergedData.length === 0) return { min: 0, max: 100 };
    
    let min = Infinity;
    let max = -Infinity;
    
    mergedData.forEach(point => {
      if (point.current !== undefined && point.current < min) min = point.current;
      if (point.previous !== undefined && point.previous < min) min = point.previous;
      if (point.current !== undefined && point.current > max) max = point.current;
      if (point.previous !== undefined && point.previous > max) max = point.previous;
    });
    
    // Ensure min is at least 0 (no negative values)
    min = Math.max(0, min);
    
    // Add some padding to the max for better visualization
    max = max * 1.1;
    
    return { min, max };
  }, [mergedData]);

  // Check if we have valid data to render
  if (!mergedData.length) {
    return <div className="text-zinc-400 p-4 text-center">Insufficient data for comparison</div>;
  }

  // Custom tooltip to display both current and previous values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 p-3 border border-zinc-700 rounded-md shadow-lg">
          <p className="text-zinc-400 text-xs mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mergedData}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#999999' }} 
              axisLine={{ stroke: '#555555' }} 
            />
            <YAxis 
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fill: '#999999' }}
              axisLine={{ stroke: '#555555' }}
              domain={[dataExtent.min, dataExtent.max]} 
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              name="Current"
              stroke="#3b82f6" // Blue
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous"
              stroke="#8b5cf6" // Purple
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(ComparisonChart);
