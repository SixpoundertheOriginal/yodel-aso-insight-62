
// src/utils/chartConfig.ts
export const chartColors = {
  impressions: "#3B82F6", // Yodel blue
  downloads: "#F97316",   // Yodel orange
  pageViews: "#8B5CF6",   // Complementary purple
  current: "#F97316",     // Yodel orange for current data
  previous: "#94A3B8",    // Grey for previous data
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
  height: 400 // increased chart height for better visualization
};
