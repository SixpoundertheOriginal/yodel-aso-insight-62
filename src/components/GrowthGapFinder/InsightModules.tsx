
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
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InsightModuleProps {
  onInsightSelect: (insightType: string) => void;
}

export const InsightModules: React.FC<InsightModuleProps> = ({ onInsightSelect }) => {
  const insights = [
    {
      id: "MissedImpressions",
      title: "Estimate Missed Impressions",
      description: "Calculate potential visibility lost due to ranking positions",
      icon: <Eye className="h-5 w-5" />,
      color: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30"
    },
    {
      id: "BrandVsGeneric",
      title: "Brand vs. Generic Keyword Gaps",
      description: "Identify opportunities in branded and generic search terms",
      icon: <Target className="h-5 w-5" />,
      color: "from-yodel-orange/20 to-orange-600/20",
      textColor: "text-yodel-orange",
      borderColor: "border-yodel-orange/30"
    },
    {
      id: "CompetitorComparison",
      title: "Compare with Top Competitors",
      description: "See how your rankings stack up against the top 3 competitors",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-green-500/20 to-green-600/20",
      textColor: "text-green-400",
      borderColor: "border-green-500/30"
    },
    {
      id: "MetadataSuggestions",
      title: "Draft Metadata Suggestions",
      description: "Get optimization recommendations for your app metadata",
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
      description: "Find low-effort, high-impact optimization opportunities",
      icon: <Zap className="h-5 w-5" />,
      color: "from-yellow-500/20 to-yellow-600/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/30"
    }
  ];

  return (
    <Card className="border-none shadow-none bg-transparent h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-white">Insight Modules</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 grid grid-cols-1 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-lg border p-4 cursor-pointer transition-all hover:scale-[1.01] ${insight.borderColor} bg-gradient-to-br ${insight.color}`}
            onClick={() => onInsightSelect(insight.id)}
          >
            <div className="flex items-start space-x-3">
              <div className={`rounded-full p-2 ${insight.textColor} bg-zinc-900/40`}>
                {insight.icon}
              </div>
              <div>
                <h3 className={`font-medium mb-1 ${insight.textColor}`}>
                  {insight.title}
                </h3>
                <p className="text-sm text-zinc-400">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
