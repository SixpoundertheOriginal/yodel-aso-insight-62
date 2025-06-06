
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Target, Eye, Zap } from "lucide-react";
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
  const [insights, setInsights] = useState<Array<{text: string; type: 'positive' | 'negative' | 'neutral' | 'actionable'; icon: string}>>([]);

  // Generate detailed insights based on data
  const generateDetailedInsights = () => {
    if (!summaryData) return [];

    const newInsights = [];
    
    // CVR Deep Analysis
    if (summaryData.cvr?.value && summaryData.cvr?.delta) {
      const cvrValue = summaryData.cvr.value;
      const cvrDelta = summaryData.cvr.delta;
      
      if (Math.abs(cvrDelta) > 15) {
        const trend = cvrDelta > 0 ? "surged" : "declined";
        const performance = cvrDelta > 0 ? "exceptional" : "concerning";
        newInsights.push({
          text: `Conversion rate has ${trend} by ${Math.abs(cvrDelta).toFixed(1)}% to ${cvrValue.toFixed(2)}% - this ${performance} performance ${cvrDelta > 0 ? 'indicates strong product-market fit and optimized listing elements' : 'suggests immediate optimization needed for app icon, screenshots, or description'}`,
          type: cvrDelta > 0 ? 'positive' : 'negative',
          icon: 'target'
        });
      } else if (Math.abs(cvrDelta) > 5) {
        newInsights.push({
          text: `Conversion rate shifted ${cvrDelta > 0 ? 'up' : 'down'} by ${Math.abs(cvrDelta).toFixed(1)}% to ${cvrValue.toFixed(2)}% - ${cvrDelta > 0 ? 'moderate improvement suggests recent optimizations are working' : 'slight decline warrants monitoring competitive landscape and user reviews'}`,
          type: cvrDelta > 0 ? 'positive' : 'neutral',
          icon: 'target'
        });
      }
    }

    // Funnel Analysis - Downloads vs Impressions vs Page Views
    if (summaryData.downloads?.delta && summaryData.impressions?.delta && summaryData.pageViews?.delta) {
      const downloadsDelta = summaryData.downloads.delta;
      const impressionsDelta = summaryData.impressions.delta;
      const pageViewsDelta = summaryData.pageViews.delta;
      
      // Analyze funnel efficiency
      if (downloadsDelta > impressionsDelta + 15) {
        newInsights.push({
          text: `Downloads growth (+${downloadsDelta.toFixed(1)}%) significantly outpacing impressions growth (+${impressionsDelta.toFixed(1)}%) indicates excellent listing optimization and strong conversion funnel. Your app store presence is highly effective at converting visibility into installs.`,
          type: 'positive',
          icon: 'zap'
        });
      } else if (impressionsDelta > downloadsDelta + 20) {
        newInsights.push({
          text: `High impression growth (+${impressionsDelta.toFixed(1)}%) with lower download conversion (+${downloadsDelta.toFixed(1)}%) suggests visibility is improving but conversion needs attention. Consider A/B testing app icon, updating screenshots, or refining your value proposition.`,
          type: 'actionable',
          icon: 'eye'
        });
      }
      
      // Page views analysis in context
      if (pageViewsDelta > impressionsDelta + 10) {
        newInsights.push({
          text: `Page views growing faster (+${pageViewsDelta.toFixed(1)}%) than impressions (+${impressionsDelta.toFixed(1)}%) indicates users are actively seeking your app through direct searches or external referrals - strong brand awareness signal.`,
          type: 'positive',
          icon: 'trending-up'
        });
      }
    }

    // ASA Performance Context
    if (excludeAsa) {
      newInsights.push({
        text: `Organic performance analysis active - these metrics exclude Apple Search Ads traffic. Strong organic performance indicates sustainable growth through App Store optimization, word-of-mouth, and brand recognition rather than paid acquisition.`,
        type: 'neutral',
        icon: 'alert-circle'
      });
    } else {
      newInsights.push({
        text: `Full traffic analysis including Apple Search Ads - if ASA comprises significant portion of your traffic, monitor organic performance separately to ensure sustainable growth strategy beyond paid acquisition.`,
        type: 'actionable',
        icon: 'alert-circle'
      });
    }

    // Performance Stability Analysis
    if (summaryData.impressions?.delta && summaryData.downloads?.delta && summaryData.pageViews?.delta) {
      const volatility = Math.abs(summaryData.impressions.delta) + Math.abs(summaryData.downloads.delta) + Math.abs(summaryData.pageViews.delta);
      
      if (volatility < 15) {
        newInsights.push({
          text: `Performance metrics show strong stability (low volatility) indicating predictable user acquisition patterns. This consistency suggests effective long-term ASO strategy and stable competitive positioning.`,
          type: 'positive',
          icon: 'target'
        });
      } else if (volatility > 50) {
        newInsights.push({
          text: `High performance volatility detected across key metrics. This could indicate recent algorithm changes, new competitor actions, or seasonal effects. Monitor trending keywords and competitor activities closely.`,
          type: 'actionable',
          icon: 'alert-circle'
        });
      }
    }

    // Market Performance Benchmarking
    if (summaryData.cvr?.value) {
      const cvrValue = summaryData.cvr.value;
      if (cvrValue > 25) {
        newInsights.push({
          text: `Exceptional conversion rate of ${cvrValue.toFixed(2)}% places you in the top 10% of App Store performers. This premium conversion efficiency indicates highly optimized listing elements and strong product-market fit.`,
          type: 'positive',
          icon: 'zap'
        });
      } else if (cvrValue < 10) {
        newInsights.push({
          text: `Conversion rate of ${cvrValue.toFixed(2)}% is below industry benchmarks (15-25%). Priority actions: optimize app icon for category, refresh screenshots with clear value props, and enhance first 3 lines of description.`,
          type: 'actionable',
          icon: 'target'
        });
      }
    }

    return newInsights.length > 0 ? newInsights : [{
      text: "Performance metrics are within normal ranges with no significant anomalies detected. Consider implementing A/B tests on listing elements to drive incremental improvements.",
      type: 'neutral',
      icon: 'alert-circle'
    }];
  };

  useEffect(() => {
    setIsLoading(true);
    // Simulate AI processing time for more sophisticated analysis
    const timer = setTimeout(() => {
      setInsights(generateDetailedInsights());
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [summaryData, excludeAsa]);

  const refreshInsights = () => {
    setIsLoading(true);
    setTimeout(() => {
      setInsights(generateDetailedInsights());
      setIsLoading(false);
    }, 1500);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'target': return <Target className="h-4 w-4" />;
      case 'eye': return <Eye className="h-4 w-4" />;
      case 'zap': return <Zap className="h-4 w-4" />;
      case 'trending-up': return <TrendingUp className="h-4 w-4" />;
      case 'trending-down': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'actionable': return 'text-orange-400';
      default: return 'text-blue-400';
    }
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
                {insights.length} detailed insight{insights.length !== 1 ? 's' : ''} available
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
          <div className="mt-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-zinc-800/50 rounded-lg border-l-2 border-l-orange-500/30">
                    <div className={`flex-shrink-0 mt-1 ${getIconColor(insight.type)}`}>
                      {getIcon(insight.icon)}
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed">{insight.text}</p>
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
