
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  TrendingUp, 
  ArrowDown, 
  Edit, 
  LineChart, 
  Zap, 
  Eye, 
  Target,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDetails } from "./AppStoreScraper";

interface InsightModuleProps {
  onInsightSelect: (insightType: string) => void;
  selectedInsight?: string | null;
  isAnalyzing?: boolean;
  selectedApp?: AppDetails | null;
}

export const InsightModules: React.FC<InsightModuleProps> = ({ 
  onInsightSelect, 
  selectedInsight = null,
  isAnalyzing = false,
  selectedApp = null
}) => {
  const insights = [
    {
      id: "MissedImpressions",
      title: "Estimate Missed Impressions",
      description: selectedApp 
        ? `Calculate potential visibility ${selectedApp.trackName} is losing due to ranking positions`
        : "Calculate potential visibility lost due to ranking positions",
      icon: <Eye className="h-5 w-5" />,
      color: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30"
    },
    {
      id: "BrandVsGeneric",
      title: "Brand vs. Generic Keyword Gaps",
      description: selectedApp 
        ? `Identify branded and generic search term opportunities for ${selectedApp.trackName}`
        : "Identify opportunities in branded and generic search terms",
      icon: <Target className="h-5 w-5" />,
      color: "from-yodel-orange/20 to-orange-600/20",
      textColor: "text-yodel-orange",
      borderColor: "border-yodel-orange/30"
    },
    {
      id: "CompetitorComparison",
      title: "Compare with Top Competitors",
      description: selectedApp 
        ? `See how ${selectedApp.trackName} ranks against top 3 competitors`
        : "See how your rankings stack up against the top 3 competitors",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-green-500/20 to-green-600/20",
      textColor: "text-green-400",
      borderColor: "border-green-500/30"
    },
    {
      id: "MetadataSuggestions",
      title: "Draft Metadata Suggestions",
      description: selectedApp 
        ? `Get optimization recommendations for ${selectedApp.trackName}'s metadata`
        : "Get optimization recommendations for your app metadata",
      icon: <Edit className="h-5 w-5" />,
      color: "from-purple-500/20 to-purple-600/20",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30"
    },
    {
      id: "GrowthOpportunity",
      title: "Visualize Growth Opportunity",
      description: "See a visual representation of potential growth areas",
      icon: <LineChart className="h-5 w-5" />,
      color: "from-teal-500/20 to-teal-600/20",
      textColor: "text-teal-400",
      borderColor: "border-teal-500/30"
    },
    {
      id: "QuickWins",
      title: "Identify Quick Wins",
      description: selectedApp 
        ? `Find high-impact, low-effort opportunities for ${selectedApp.trackName}`
        : "Find low-effort, high-impact optimization opportunities",
      icon: <Zap className="h-5 w-5" />,
      color: "from-yellow-500/20 to-yellow-600/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/30"
    }
  ];

  return (
    <Card className="border-none shadow-none bg-transparent h-full">
      <CardHeader className="p-4 flex justify-between items-center">
        <CardTitle className="text-lg text-white">Insight Modules</CardTitle>
        {selectedApp && (
          <div className="flex items-center space-x-2">
            <img 
              src={selectedApp.artworkUrl100} 
              alt={selectedApp.trackName} 
              className="w-6 h-6 rounded-md" 
            />
            <span className="text-sm text-zinc-300">{selectedApp.trackName}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0 grid grid-cols-1 gap-4">
        {insights.map((insight) => {
          const isSelected = selectedInsight === insight.id;
          const isLoading = isAnalyzing && isSelected;
          
          return (
            <div
              key={insight.id}
              className={`rounded-lg border p-4 cursor-pointer transition-all 
                ${isSelected 
                  ? `border-${insight.textColor} ring-1 ring-${insight.textColor} scale-[1.02]` 
                  : insight.borderColor} 
                bg-gradient-to-br ${insight.color}
                ${isAnalyzing && !isSelected ? 'opacity-50' : 'hover:scale-[1.01]'}`}
              onClick={() => !isAnalyzing && onInsightSelect(insight.id)}
            >
              <div className="flex items-start space-x-3">
                <div className={`rounded-full p-2 ${insight.textColor} bg-zinc-900/40`}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    insight.icon
                  )}
                </div>
                <div>
                  <h3 className={`font-medium mb-1 ${insight.textColor} flex items-center`}>
                    {insight.title}
                    {isSelected && isAnalyzing && (
                      <span className="ml-2 text-xs bg-zinc-900/80 px-2 py-0.5 rounded-full">
                        Analyzing...
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
