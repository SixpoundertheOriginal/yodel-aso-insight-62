import React, { useMemo } from "react";
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

const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  currentData, 
  previousData, 
  title, 
  metric 
}) => {
  // Normalize and validate data to ensure no negative values
  const processedCurrentData = useMemo(() => {
    if (!currentData || !Array.isArray(currentData)) return [];
    
    return currentData.map(point => ({
      ...point,
      [metric]: Math.max(0, Number(point[metric] || 0)),
      date: point.date
    }));
  }, [currentData, metric]);

  const processedPreviousData = useMemo(() => {
    if (!previousData || !Array.isArray(previousData)) return [];
    
    return previousData.map(point => ({
      ...point,
      [metric]: Math.max(0, Number(point[metric] || 0)),
      date: point.date
    }));
  }, [previousData, metric]);

  // Create a merged dataset with aligned dates for comparison
  const mergedData = useMemo(() => {
    if (processedCurrentData.length === 0) return [];
    
    // Create a map of current data points by date for easier merging
    const currentMap = new Map(
      processedCurrentData.map(point => [
        point.date, 
        { date: point.date, current: point[metric] }
      ])
    );
    
    // Merge with previous data points
    processedPreviousData.forEach(point => {
      const matchingDate = currentMap.get(point.date);
      if (matchingDate) {
        matchingDate.previous = point[metric];
      } else {
        currentMap.set(point.date, { 
          date: point.date, 
          previous: point[metric],
          current: 0 // Set to 0 if no current data exists for this date
        });
      }
    });
    
    // Convert map back to array and sort by date
    return Array.from(currentMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [processedCurrentData, processedPreviousData, metric]);

  // Find the minimum and maximum values for proper scaling
  const dataExtent = useMemo(() => {
    if (mergedData.length === 0) return { min: 0, max: 100 };
    
    let min = Infinity;
    let max = 0;
    
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
    <div className="bg-zinc-900 p-4 rounded-md border border-zinc-800 mb-6">
      <h3 className="text-lg font-medium mb-4 text-zinc-200">{title}</h3>
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