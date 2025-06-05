
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AiInsightsBoxProps {
  summaryData?: {
    impressions?: { value: number; delta: number };
    downloads?: { value: number; delta: number };
    pageViews?: { value: number; delta: number };
    cvr?: { value: number; delta: number };
  };
  excludeAsa?: boolean;
}

const AiInsightsBox: React.FC<AiInsightsBoxProps> = ({ summaryData, excludeAsa }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  // Generate insights based on data
  const generateInsights = () => {
    if (!summaryData) return [];

    const newInsights = [];
    
    // CVR Analysis
    if (summaryData.cvr?.delta && Math.abs(summaryData.cvr.delta) > 5) {
      const trend = summaryData.cvr.delta > 0 ? "increased" : "decreased";
      newInsights.push(`Conversion rate ${trend} by ${Math.abs(summaryData.cvr.delta).toFixed(1)}% - ${summaryData.cvr.delta > 0 ? "excellent performance" : "needs attention"}`);
    }

    // Downloads vs Impressions
    if (summaryData.downloads?.delta && summaryData.impressions?.delta) {
      if (summaryData.downloads.delta > summaryData.impressions.delta + 10) {
        newInsights.push("Download growth is outpacing impression growth - strong conversion optimization");
      } else if (summaryData.impressions.delta > summaryData.downloads.delta + 15) {
        newInsights.push("High impression growth but lower download conversion - consider optimizing listing");
      }
    }

    // ASA Performance
    if (excludeAsa) {
      newInsights.push("Apple Search Ads excluded - organic performance metrics being displayed");
    }

    // Page Views Analysis
    if (summaryData.pageViews?.delta && Math.abs(summaryData.pageViews.delta) > 20) {
      const trend = summaryData.pageViews.delta > 0 ? "surge" : "drop";
      newInsights.push(`Significant page view ${trend} of ${Math.abs(summaryData.pageViews.delta).toFixed(1)}% indicates changing user interest`);
    }

    return newInsights.length > 0 ? newInsights : ["Performance metrics are stable with no significant anomalies detected"];
  };

  useEffect(() => {
    setIsLoading(true);
    // Simulate AI processing time
    const timer = setTimeout(() => {
      setInsights(generateInsights());
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [summaryData, excludeAsa]);

  const refreshInsights = () => {
    setIsLoading(true);
    setTimeout(() => {
      setInsights(generateInsights());
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="bg-gradient-to-r from-zinc-800 to-zinc-700 border-orange-500/20 rounded-md mb-6">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-medium text-white">AI Performance Insights</h3>
            {!isExpanded && !isLoading && (
              <span className="text-sm text-orange-400">
                {insights.length} insight{insights.length !== 1 ? 's' : ''} available
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  refreshInsights();
                }}
                disabled={isLoading}
                className="text-orange-400 hover:text-orange-300"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {insight.includes("excellent") || insight.includes("surge") ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : insight.includes("needs attention") || insight.includes("drop") ? (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiInsightsBox;
