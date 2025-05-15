
import React, { useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { chartColors, chartConfig } from "@/utils/chartConfig";

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
export const mergeSeries = (
  currentData: TimeSeriesDataPoint[] = [], 
  previousData: TimeSeriesDataPoint[] = [], 
  metric: string
) => {
  // Safety check for inputs
  if (!Array.isArray(currentData) || !Array.isArray(previousData)) {
    console.error("Invalid data provided to mergeSeries:", { currentData, previousData });
    return [];
  }
  
  // Log some debug info to help diagnose issues
  console.log(`Merging data for metric: ${metric}`);
  console.log(`Current data (${currentData.length} points):`, currentData.slice(0, 2));
  console.log(`Previous data (${previousData.length} points):`, previousData.slice(0, 2));
  
  // Create a map to hold all unique dates and their values
  const mergedMap = new Map();
  
  // Process current data
  currentData.forEach(point => {
    if (!point || typeof point !== 'object' || !point.date) {
      console.warn("Invalid data point in currentData:", point);
      return; // Skip invalid points
    }
    
    // Use the date as-is without reformatting to avoid issues
    const dateStr = point.date;
    
    // Check if the metric exists in the data point
    if (!(metric in point)) {
      console.warn(`Metric "${metric}" not found in current data point:`, point);
    }
    
    mergedMap.set(dateStr, { 
      date: dateStr,
      current: typeof point[metric] === 'number' ? point[metric] : 0
    });
  });
  
  // Process previous data and merge with current
  previousData.forEach(point => {
    if (!point || typeof point !== 'object' || !point.date) {
      console.warn("Invalid data point in previousData:", point);
      return; // Skip invalid points
    }
    
    const dateStr = point.date;
    
    // Check if the metric exists in the data point
    if (!(metric in point)) {
      console.warn(`Metric "${metric}" not found in previous data point:`, point);
    }
    
    const existing = mergedMap.get(dateStr);
    
    if (existing) {
      // Update existing entry with previous data
      mergedMap.set(dateStr, { 
        ...existing, 
        previous: typeof point[metric] === 'number' ? point[metric] : 0
      });
    } else {
      // Create new entry for dates only in previous data
      mergedMap.set(dateStr, { 
        date: dateStr,
        previous: typeof point[metric] === 'number' ? point[metric] : 0,
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
  const result = Array.from(mergedMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log(`Merged result (${result.length} points):`, result.slice(0, 2));
  return result;
};

const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  currentData, 
  previousData, 
  title, 
  metric 
}) => {
  // Add some debug logging
  useEffect(() => {
    console.log(`ComparisonChart "${title}" rendering with:`, {
      currentDataLength: currentData?.length,
      previousDataLength: previousData?.length,
      metric
    });
  }, [currentData, previousData, title, metric]);

  // Use our utility function to merge the series data
  const mergedData = useMemo(() => {
    console.log(`Computing merged data for ${title}`);
    return mergeSeries(currentData, previousData, metric);
  }, [currentData, previousData, metric, title]);

  // Find the minimum and maximum values for proper scaling
  const dataExtent = useMemo(() => {
    if (!mergedData || mergedData.length === 0) return { min: 0, max: 100 };
    
    let min = Infinity;
    let max = -Infinity;
    
    mergedData.forEach(point => {
      if (typeof point.current === 'number' && point.current < min) min = point.current;
      if (typeof point.previous === 'number' && point.previous < min) min = point.previous;
      if (typeof point.current === 'number' && point.current > max) max = point.current;
      if (typeof point.previous === 'number' && point.previous > max) max = point.previous;
    });
    
    // Ensure min is at least 0 (no negative values)
    min = Math.max(0, min);
    
    // Add some padding to the max for better visualization
    max = max * 1.1;
    
    return { min, max };
  }, [mergedData]);

  // Format date for tooltip and axis labels
  const formatDate = (dateStr: string, isShort: boolean = false) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', 
        isShort ? { day: 'numeric' } : { month: 'short', day: 'numeric' }
      );
    } catch (e) {
      return dateStr;
    }
  };

  // Check if we have valid data to render
  if (!mergedData || !mergedData.length) {
    console.warn(`No merged data available for ${title}`);
    return <div className="text-zinc-400 p-4 text-center h-64 flex items-center justify-center">
      Insufficient data for comparison
    </div>;
  }

  // Enhanced tooltip with percentage difference
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate percentage difference if both values exist
      const calculateDiff = () => {
        const current = payload.find((item: any) => item.dataKey === 'current')?.value;
        const previous = payload.find((item: any) => item.dataKey === 'previous')?.value;
        
        if (typeof current === 'number' && typeof previous === 'number' && previous !== 0) {
          const diff = ((current - previous) / previous) * 100;
          return diff.toFixed(1);
        }
        return null;
      };
      
      const diff = calculateDiff();
      const diffClass = diff && parseFloat(diff) >= 0 ? 'text-green-500' : 'text-red-500';
      
      return (
        <div className={`${chartConfig.tooltip.background} p-3 border ${chartConfig.tooltip.border} rounded-md shadow-lg`}>
          <p className={`${chartConfig.tooltip.text} text-xs mb-1`}>{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{entry.value.toLocaleString()}</span>
            </p>
          ))}
          {diff && (
            <p className="text-xs mt-1 pt-1 border-t border-zinc-700">
              Difference: <span className={diffClass}>{diff}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  console.log(`Rendering chart for ${title} with ${mergedData.length} data points`);

  return (
    <div className="w-full h-full">
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
          <CartesianGrid 
            strokeDasharray={chartConfig.grid.strokeDasharray} 
            stroke={chartConfig.grid.stroke} 
          />
          <XAxis 
            dataKey="date" 
            tick={{ fill: chartConfig.axis.tick.fill }} 
            axisLine={{ stroke: chartConfig.axis.line.stroke }} 
            tickFormatter={(value) => formatDate(value, window.innerWidth < 768)}
          />
          <YAxis 
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fill: chartConfig.axis.tick.fill }}
            axisLine={{ stroke: chartConfig.axis.line.stroke }}
            domain={[dataExtent.min, dataExtent.max]} 
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="current"
            name="Current"
            stroke={chartColors.current}
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="previous"
            name="Previous"
            stroke={chartColors.previous}
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(ComparisonChart);
