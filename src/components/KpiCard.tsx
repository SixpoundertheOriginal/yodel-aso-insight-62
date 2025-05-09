
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  changePercentage?: number;
  isPositive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = React.memo(({ 
  title, 
  value, 
  changePercentage = 0, 
  isPositive = true 
}) => {
  return (
    <Card className="border-l-4 border-l-orange-500 rounded-md shadow-md">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-zinc-400 font-medium mb-2">{title}</h3>
          <div className="text-3xl font-bold mb-2">{value.toLocaleString()}</div>
          <div className={`flex items-center justify-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(changePercentage)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

KpiCard.displayName = "KpiCard";
export default KpiCard;
