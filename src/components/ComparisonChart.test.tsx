
import React from 'react';
import { render, screen } from '@testing-library/react';
import ComparisonChart, { mergeSeries } from './ComparisonChart';
import { TimeSeriesPoint } from '@/hooks/useMockAsoData';

// Mock the ChartContainer component to avoid rendering issues in tests
jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />
}));

// Mock the recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: (props: any) => <path data-testid={`line-${props.dataKey}`} {...props} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>
}));

describe('ComparisonChart', () => {
  const currentData: TimeSeriesPoint[] = [
    { date: '2023-01-01', impressions: 100, downloads: 50, pageViews: 200 },
    { date: '2023-01-02', impressions: 150, downloads: 75, pageViews: 250 }
  ];
  
  const previousData: TimeSeriesPoint[] = [
    { date: '2022-12-31', impressions: 90, downloads: 45, pageViews: 180 },
    { date: '2023-01-01', impressions: 110, downloads: 55, pageViews: 220 }
  ];

  test('renders both current and previous lines', () => {
    render(
      <ComparisonChart 
        currentData={currentData} 
        previousData={previousData} 
        title="Test Chart" 
        metric="downloads"
      />
    );

    // Check for both lines
    const currentLine = screen.getByTestId('line-current');
    const previousLine = screen.getByTestId('line-previous');
    
    expect(currentLine).toBeInTheDocument();
    expect(previousLine).toBeInTheDocument();
    
    // Verify that the previous line has a dash array
    expect(previousLine).toHaveAttribute('strokeDasharray', '5 5');
    
    // Check for the title
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    
    // Check for the legend entries
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
  });

  test('mergeSeries correctly merges and formats data', () => {
    const metric = 'downloads';
    const result = mergeSeries(currentData, previousData, metric);
    
    // We expect 3 data points (Jan 1 is in both, but Dec 31 and Jan 2 are in one each)
    expect(result.length).toBe(3);
    
    // Find Jan 1 data point which should have both current and previous values
    const jan1Data = result.find(item => item.date.includes('Jan 1'));
    
    expect(jan1Data).toBeDefined();
    expect(jan1Data?.current).toBe(50); // Current downloads for Jan 1
    expect(jan1Data?.previous).toBe(55); // Previous downloads for Jan 1
  });
});
