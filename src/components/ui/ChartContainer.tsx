
import React from 'react';

interface ChartContainerProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  height = 450,
  className = ""
}) => {
  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${height}px`, minHeight: `${height}px` }}
    >
      {children}
    </div>
  );
};

export default ChartContainer;
