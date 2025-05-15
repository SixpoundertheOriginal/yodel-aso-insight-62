
// src/utils/chartConfig.ts
export const chartColors = {
  impressions: "#3b82f6", // blue
  downloads: "#10b981",   // green
  pageViews: "#8b5cf6",   // purple
  current: "#3b82f6",     // blue
  previous: "#8b5cf6",    // purple
};

export const chartConfig = {
  grid: {
    strokeDasharray: "3 3",
    stroke: "#444444"
  },
  axis: {
    tick: { fill: '#999999' },
    line: { stroke: '#555555' }
  },
  tooltip: {
    background: "bg-zinc-800",
    border: "border-zinc-700",
    text: "text-zinc-400"
  },
  height: 280 // standard chart height
};
