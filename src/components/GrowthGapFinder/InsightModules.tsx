
import React, { useState } from "react";
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
  Loader2,
  Filter,
  PieChart,
  BarChart3,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDetails } from "./AppStoreScraper";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KeywordData } from "@/utils/keywordAnalysis";

interface InsightModuleProps {
  onInsightSelect: (insightType: string) => void;
  selectedInsight?: string | null;
  isAnalyzing?: boolean;
  selectedApp?: AppDetails | null;
  keywordData?: KeywordData[] | null;
  keywordsCount?: number;
}

export const InsightModules: React.FC<InsightModuleProps> = ({ 
  onInsightSelect, 
  selectedInsight = null,
  isAnalyzing = false,
  selectedApp = null,
  keywordData = null,
  keywordsCount = 0
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedFilters, setExpandedFilters] = useState<boolean>(false);
  
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
      borderColor: "border-blue-500/30",
      category: "opportunity",
      metrics: keywordData ? [
        { label: "Est. Missed Impressions", value: "~140K" },
        { label: "Keywords Outside Top 10", value: `${Math.floor(keywordsCount * 0.65)}` }
      ] : []
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
      borderColor: "border-yodel-orange/30",
      category: "analysis",
      metrics: keywordData ? [
        { label: "Brand Term Share", value: "34%" },
        { label: "Generic Term Share", value: "66%" }
      ] : []
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
      borderColor: "border-green-500/30",
      category: "analysis",
      metrics: keywordData ? [
        { label: "Keyword Overlap", value: "42%" },
        { label: "Ranking Advantage", value: "18%" }
      ] : []
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
      borderColor: "border-purple-500/30",
      category: "action",
      metrics: keywordData ? [
        { label: "Title Optimization", value: "68%" },
        { label: "Keyword Coverage", value: "72%" }
      ] : []
    },
    {
      id: "GrowthOpportunity",
      title: "Visualize Growth Opportunity",
      description: "See a visual representation of potential growth areas",
      icon: <LineChart className="h-5 w-5" />,
      color: "from-teal-500/20 to-teal-600/20",
      textColor: "text-teal-400",
      borderColor: "border-teal-500/30",
      category: "opportunity",
      metrics: keywordData ? [
        { label: "Growth Potential", value: "High" },
        { label: "Market Share Gap", value: "18%" }
      ] : []
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
      borderColor: "border-yellow-500/30",
      category: "opportunity",
      metrics: keywordData ? [
        { label: "Easy Improvements", value: "8" },
        { label: "Est. Impact", value: "~15%" }
      ] : []
    },
    {
      id: "RankingOpportunities",
      title: "Ranking Improvement Opportunities",
      description: selectedApp 
        ? `Find keywords where ${selectedApp.trackName} can improve rankings`
        : "Identify keywords where ranking improvements can have big impact",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "from-pink-500/20 to-pink-600/20",
      textColor: "text-pink-400",
      borderColor: "border-pink-500/30",
      category: "opportunity",
      metrics: keywordData ? [
        { label: "Keywords at Risk", value: `${Math.floor(keywordsCount * 0.22)}` },
        { label: "Close to Top 10", value: `${Math.floor(keywordsCount * 0.15)}` }
      ] : [],
      new: true
    },
    {
      id: "RelevancyAnalysis",
      title: "Keyword Relevancy Analysis",
      description: selectedApp 
        ? `Analyze how relevant keywords are to ${selectedApp.trackName}`
        : "Determine which keywords are most relevant to your app",
      icon: <PieChart className="h-5 w-5" />,
      color: "from-indigo-500/20 to-indigo-600/20",
      textColor: "text-indigo-400",
      borderColor: "border-indigo-500/30",
      category: "analysis",
      metrics: keywordData ? [
        { label: "High Relevance", value: `${Math.floor(keywordsCount * 0.45)}` },
        { label: "Low Relevance", value: `${Math.floor(keywordsCount * 0.25)}` }
      ] : [],
      new: true
    }
  ];
  
  const filteredInsights = activeTab === "all" 
    ? insights 
    : insights.filter(insight => insight.category === activeTab);

  return (
    <Card className="border-none shadow-none bg-transparent h-full">
      <CardHeader className="p-4 flex justify-between items-center">
        <div>
          <CardTitle className="text-lg text-white">Insight Modules</CardTitle>
          <p className="text-xs text-zinc-400 mt-1">
            {keywordsCount > 0 
              ? `Analyzing ${keywordsCount} keywords` 
              : "Select a module to analyze your data"}
          </p>
        </div>
        
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
      
      <CardContent className="p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="bg-zinc-800 border border-zinc-700 mb-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
              All
            </TabsTrigger>
            <TabsTrigger value="opportunity" className="data-[state=active]:bg-zinc-700">
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-zinc-700">
              Analysis
            </TabsTrigger>
            <TabsTrigger value="action" className="data-[state=active]:bg-zinc-700">
              Actions
            </TabsTrigger>
          </TabsList>
          
          <div 
            className="flex items-center justify-between mb-2 text-sm text-zinc-400 cursor-pointer p-1"
            onClick={() => setExpandedFilters(!expandedFilters)}
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              Filters & Sorting
            </div>
            {expandedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {expandedFilters && (
            <div className="bg-zinc-800/70 p-3 rounded-md mb-4 border border-zinc-700/50 text-sm space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1">Sort by</label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="bg-zinc-700 border-zinc-600 text-xs">Impact</Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-zinc-700 text-xs">Effort</Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-zinc-700 text-xs">Volume</Button>
                </div>
              </div>
              
              <div>
                <label className="text-zinc-400 block mb-1">Focus on</label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="bg-zinc-700 border-zinc-600 text-xs">Quick Wins</Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-zinc-700 text-xs">Long-term</Button>
                </div>
              </div>
            </div>
          )}
        </Tabs>
        
        <div className="grid grid-cols-1 gap-4 overflow-auto max-h-[calc(100vh-280px)]">
          {filteredInsights.map((insight) => {
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
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium mb-1 ${insight.textColor} flex items-center`}>
                        {insight.title}
                        {insight.new && (
                          <Badge variant="outline" className="ml-2 bg-zinc-800 text-zinc-300 text-[0.6rem] px-1">NEW</Badge>
                        )}
                        {isSelected && isAnalyzing && (
                          <span className="ml-2 text-xs bg-zinc-900/80 px-2 py-0.5 rounded-full">
                            Analyzing...
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-zinc-400 mb-3">
                      {insight.description}
                    </p>
                    
                    {insight.metrics && insight.metrics.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {insight.metrics.map((metric, idx) => (
                          <div key={idx} className="bg-zinc-900/50 rounded p-1.5 text-center">
                            <div className={`text-xs ${insight.textColor} font-medium`}>{metric.value}</div>
                            <div className="text-[10px] text-zinc-500">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
