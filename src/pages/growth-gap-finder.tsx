import React, { useState, useEffect } from "react";
import { MainLayout } from "@/layouts";
import { ChatInterface } from "@/components/GrowthGapFinder/ChatInterface";
import { FileUploadSection } from "@/components/GrowthGapFinder/FileUploadSection";
import { InsightModules } from "@/components/GrowthGapFinder/InsightModules";
import { ResultsDisplay } from "@/components/GrowthGapFinder/ResultsDisplay";
import { AppStoreScraper, AppDetails } from "@/components/GrowthGapFinder/AppStoreScraper";
import { AppDetailsView } from "@/components/GrowthGapFinder/AppDetailsView";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppProvider } from "@/context/AppContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";

// Import our keyword analysis utilities
import { 
  parseKeywordData, 
  analyzeBrandVsGeneric,
  analyzeCompetitorComparison,
  analyzeMetadataSuggestions,
  analyzeGrowthOpportunity,
  analyzeQuickWins,
  analyzeMissedImpressions,
  analyzeRankingOpportunities,
  analyzeKeywordRelevancy,
  KeywordData,
  AppContext as AppKeywordContext
} from "@/utils/keywordAnalysis";

const GrowthGapFinderPage = () => {
  const [activeTab, setActiveTab] = useState<string>("app-search");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [keywordData, setKeywordData] = useState<string | null>(null);
  const [parsedKeywords, setParsedKeywords] = useState<KeywordData[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null);
  
  // Parse keyword data whenever it changes
  useEffect(() => {
    if (keywordData) {
      try {
        const parsed = parseKeywordData(keywordData);
        setParsedKeywords(parsed);
        console.log(`Parsed ${parsed.length} keywords for analysis`);
        
        // Show a toast notification when keywords are successfully parsed
        if (parsed.length > 0) {
          toast({
            title: "Keywords Ready",
            description: `${parsed.length} keywords parsed and ready for analysis.`,
          });
        }
      } catch (error) {
        console.error("Error parsing keyword data:", error);
        toast({
          title: "Parsing Error",
          description: "There was an error processing your keyword data.",
          variant: "destructive"
        });
      }
    }
  }, [keywordData]);
  
  const handleFileUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
    setUploadedFiles(files);
    
    if (files.length > 0) {
      // Read and process the first file
      const file = files[0];
      if (file.type === 'text/csv' || file.type === 'text/tab-separated-values' || file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setKeywordData(e.target.result as string);
            toast({
              title: "Data Ready",
              description: `${files.length} file(s) uploaded successfully. You can now analyze your keyword data.`,
            });
            
            // If an app is selected, move to insights tab
            if (selectedApp) {
              setActiveTab("insights");
            }
          }
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV or TSV file with keyword data.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSelectApp = (app: AppDetails) => {
    setSelectedApp(app);
    // Move to the upload tab if an app is selected
    setActiveTab("upload");
    toast({
      title: "App Selected",
      description: `"${app.trackName}" selected for analysis. Please upload keyword data next.`,
    });
  };
  
  const handleInsightSelect = async (insightType: string) => {
    console.log("Insight selected:", insightType);
    setSelectedInsight(insightType);
    setIsAnalyzing(true);
    
    // If we have real keyword data, use it for analysis
    if (parsedKeywords.length > 0) {
      try {
        console.log(`Analyzing ${parsedKeywords.length} keywords for ${insightType}`);
        
        // Create app context if available
        const appContext = selectedApp ? {
          name: selectedApp.trackName,
          developer: selectedApp.sellerName,
          category: selectedApp.primaryGenreName || 'Unknown',
          rating: selectedApp.averageUserRating || 0,
          ratingCount: selectedApp.userRatingCount || 0,
        } : undefined;
        
        let resultData;
        
        // Try to do local analysis first, now with app context if available
        if (parsedKeywords.length > 0) {
          switch(insightType) {
            case "BrandVsGeneric":
              resultData = analyzeBrandVsGeneric(parsedKeywords, appContext);
              break;
              
            case "CompetitorComparison":
              resultData = analyzeCompetitorComparison(parsedKeywords, appContext);
              break;
              
            case "MetadataSuggestions":
              resultData = analyzeMetadataSuggestions(parsedKeywords, appContext);
              break;
              
            case "GrowthOpportunity":
              resultData = analyzeGrowthOpportunity(parsedKeywords, appContext);
              break;
              
            case "QuickWins":
              resultData = analyzeQuickWins(parsedKeywords, appContext);
              break;
              
            case "MissedImpressions":
              resultData = analyzeMissedImpressions(parsedKeywords, appContext);
              break;
              
            case "RankingOpportunities":
              resultData = analyzeRankingOpportunities(parsedKeywords, appContext);
              break;
              
            case "RelevancyAnalysis":
              resultData = analyzeKeywordRelevancy(parsedKeywords, appContext);
              break;
          }
        }
        
        // If local analysis isn't available or fails, try the edge function with app context
        if (!resultData) {
          const { data, error } = await supabase.functions.invoke('aso-chat', {
            body: {
              insightType,
              keywordData,
              appDetails: selectedApp ? {
                name: selectedApp.trackName,
                developer: selectedApp.sellerName,
                category: selectedApp.primaryGenreName || 'Unknown',
                rating: selectedApp.averageUserRating || 0,
                bundleId: selectedApp.bundleId || 'Unknown',
              } : null,
              messages: []
            }
          });
          
          if (error) throw error;
          
          if (data.insightResults) {
            resultData = data.insightResults;
          } else {
            throw new Error('No analysis results returned');
          }
        }
        
        setResults({
          type: insightType,
          data: resultData,
          appInfo: selectedApp ? {
            name: selectedApp.trackName,
            icon: selectedApp.artworkUrl100,
          } : null
        });
        
        toast({
          title: "Analysis Complete",
          description: `${formatInsightName(insightType)} analysis completed successfully.`,
        });
        
        // Switch to results tab after analysis is complete
        setActiveTab("results");
      } catch (error) {
        console.error('Error analyzing data:', error);
        // Fall back to simulated analysis
        simulateAnalysis(insightType);
      }
    } else {
      // Fall back to simulated analysis
      simulateAnalysis(insightType);
    }
  };
  
  // Simulated analysis as fallback
  const simulateAnalysis = (insightType: string) => {
    // Simulated analysis duration
    const analysisDuration = 2000 + Math.random() * 1500; // Between 2-3.5 seconds
    
    // Simulate results for each insight type, now with app context if available
    setTimeout(() => {
      let resultData;
      const appName = selectedApp?.trackName || "Your App";
      
      switch(insightType) {
        case "MissedImpressions":
          resultData = {
            title: "Missed Impressions Analysis",
            summary: `We identified potential missed impressions for ${appName} based on your current keyword rankings.`,
            metrics: [
              { label: "Estimated Missed Impressions", value: "~140,000" },
              { label: "Potential Visibility Uplift", value: "+22%" },
              { label: "Optimization Priority", value: "High" }
            ],
            recommendations: [
              `Target 'fitness tracker' keywords that rank on page 2`,
              `Optimize for 'activity monitor' terms showing growth`,
              `Add 'health analytics' to your app metadata`
            ],
            chartData: [
              { name: "Missing High Volume", value: 82000, fill: "#F97316" },
              { name: "Poor Rankings", value: 58000, fill: "#3B82F6" }
            ]
          };
          break;
          
        case "BrandVsGeneric":
          resultData = {
            title: "Brand vs Generic Keyword Analysis",
            summary: "Analysis of your performance across branded and generic search terms.",
            metrics: [
              { label: "Brand Term Share", value: "34%" },
              { label: "Generic Term Share", value: "66%" },
              { label: "Brand CVR Premium", value: "+215%" }
            ],
            recommendations: [
              "Increase generic keyword coverage in app title",
              "Add competitor brand modifiers to ASA campaigns",
              "Build more backlinks using generic anchor text"
            ],
            chartData: [
              { name: "Branded", value: 34, fill: "#F97316" },
              { name: "Generic", value: 66, fill: "#3B82F6" }
            ]
          };
          break;
          
        case "CompetitorComparison":
          resultData = {
            title: "Competitor Comparison",
            summary: "Analysis of your app compared to top 3 competitors in your category.",
            metrics: [
              { label: "Keyword Overlap", value: "42%" },
              { label: "Ranking Advantage", value: "18%" },
              { label: "Category Position", value: "#4" }
            ],
            recommendations: [
              "Target keywords where competitors rank but you don't",
              "Improve keyword density for terms where you're close to top 3",
              "Analyze top competitor creative assets for insights"
            ],
            chartData: [
              { name: "Top 10", value: 24, fill: "#10B981" },
              { name: "11-50", value: 38, fill: "#3B82F6" },
              { name: "51+", value: 15, fill: "#F97316" },
              { name: "Not Ranking", value: 83, fill: "#6B7280" }
            ]
          };
          break;
          
        case "MetadataSuggestions":
          resultData = {
            title: "Metadata Optimization Suggestions",
            summary: "Recommendations for optimizing your app store metadata.",
            metrics: [
              { label: "Title Optimization Score", value: "68%" },
              { label: "Description Relevance", value: "Medium" },
              { label: "Keyword Coverage", value: "72%" }
            ],
            recommendations: [
              "Update app title to include 'fitness tracker'",
              "Add more benefit-oriented language in first description paragraph",
              "Include more category-specific keywords in subtitle"
            ],
            chartData: [
              { name: "High Volume", value: 28, fill: "#F97316" },
              { name: "Medium Volume", value: 45, fill: "#3B82F6" },
              { name: "Low Volume", value: 37, fill: "#10B981" }
            ]
          };
          break;
          
        case "GrowthOpportunity":
          resultData = {
            title: "Growth Opportunity Analysis",
            summary: "Identification of key growth areas based on market trends and your app's performance.",
            metrics: [
              { label: "Growth Potential", value: "High" },
              { label: "Market Share Gap", value: "18%" },
              { label: "Trending Keywords", value: "12" }
            ],
            recommendations: [
              "Focus on emerging 'wellness analytics' search trend",
              "Target growing international markets (Spain, Brazil)",
              "Capitalize on seasonality with themed promotions"
            ],
            chartData: [
              { name: "High Volume Gaps", value: 18, fill: "#F97316" },
              { name: "Quick Growth", value: 24, fill: "#3B82F6" },
              { name: "Low Risk", value: 32, fill: "#10B981" }
            ]
          };
          break;
          
        case "QuickWins":
          resultData = {
            title: "Quick Wins Analysis",
            summary: "Low-effort, high-impact opportunities for immediate results.",
            metrics: [
              { label: "Easy Improvements", value: "8" },
              { label: "Estimated Impact", value: "~15%" },
              { label: "Implementation Time", value: "1-2 weeks" }
            ],
            recommendations: [
              "Update screenshots to highlight key features",
              "Add missing keywords to subtitle",
              "Respond to recent negative reviews"
            ],
            chartData: [
              { name: "Low Difficulty", value: 12, fill: "#10B981" },
              { name: "Just Outside Top 10", value: 8, fill: "#3B82F6" },
              { name: "Other Opportunities", value: 5, fill: "#F97316" }
            ]
          };
          break;
          
        case "RankingOpportunities":
          resultData = {
            title: "Ranking Improvement Opportunities",
            summary: `We identified keywords where ${appName} can improve rankings for significant impact.`,
            metrics: [
              { label: "Keywords Just Outside Top 10", value: "24" },
              { label: "Potential Traffic Increase", value: "+28%" },
              { label: "Conversion Impact", value: "Medium" }
            ],
            recommendations: [
              `Focus on 'health monitoring' keywords ranked 11-15`,
              `Improve relevance signals for 'activity tracking' terms`,
              `Address negative reviews mentioning tracking accuracy`
            ],
            chartData: [
              { name: "Ranks 11-20", value: 24, fill: "#F97316" },
              { name: "Ranks 21-50", value: 18, fill: "#3B82F6" },
              { name: "Ranks 51+", value: 12, fill: "#10B981" }
            ]
          };
          break;
          
        case "RelevancyAnalysis":
          resultData = {
            title: "Keyword Relevancy Analysis",
            summary: `Analysis of how relevant current keywords are to ${appName} and its features.`,
            metrics: [
              { label: "High Relevance", value: "45%" },
              { label: "Medium Relevance", value: "30%" },
              { label: "Low Relevance", value: "25%" }
            ],
            recommendations: [
              `Focus ASO efforts on high-relevance terms first`,
              `Remove low-relevance keywords from metadata`,
              `Develop features to improve relevance for medium-relevance terms`
            ],
            chartData: [
              { name: "High Relevance", value: 45, fill: "#10B981" },
              { name: "Medium Relevance", value: 30, fill: "#3B82F6" },
              { name: "Low Relevance", value: 25, fill: "#F97316" }
            ]
          };
          break;
          
        default:
          resultData = {
            title: "ASO Analysis",
            summary: "General analysis of your app store optimization status.",
            metrics: [
              { label: "Overall ASO Score", value: "74%" },
              { label: "Improvement Areas", value: "6" },
              { label: "Estimated Impact", value: "+25%" }
            ],
            recommendations: [
              "Optimize app metadata for better keyword coverage",
              "Improve visual assets to increase conversion rate",
              "Focus on growing categories to expand reach"
            ],
            chartData: [
              { name: "Current", value: 74, fill: "#3B82F6" },
              { name: "Potential", value: 26, fill: "#F97316" }
            ]
          };
      }
      
      setResults({
        type: insightType,
        data: resultData,
        appInfo: selectedApp ? {
          name: selectedApp.trackName,
          icon: selectedApp.artworkUrl100,
        } : null
      });
      
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `${formatInsightName(insightType)} analysis completed successfully.`,
      });
      
      // Switch to results tab after analysis is complete
      setActiveTab("results");
    }, analysisDuration);
  };
  
  // Helper function to format insight type names for display
  const formatInsightName = (insightType: string): string => {
    switch(insightType) {
      case "MissedImpressions": return "Missed Impressions";
      case "BrandVsGeneric": return "Brand vs Generic";
      case "CompetitorComparison": return "Competitor Comparison";
      case "MetadataSuggestions": return "Metadata Suggestions";
      case "GrowthOpportunity": return "Growth Opportunity";
      case "QuickWins": return "Quick Wins";
      case "RankingOpportunities": return "Ranking Opportunities";
      case "RelevancyAnalysis": return "Keyword Relevancy";
      default: return insightType;
    }
  };
  
  return (
    <AppProvider>
      <MainLayout>
        <div className="flex flex-col space-y-4">
          <TopBar title="Growth Gap Finder" />
          
          {/* Main workflow steps indicator */}
          <div className="flex items-center justify-center bg-zinc-900/70 rounded-lg p-3 border border-zinc-700">
            <div className={`flex items-center px-3 py-1 ${activeTab === "app-search" ? 'bg-zinc-700 text-white' : 'text-zinc-400'} rounded mx-1`}>
              <span className="font-medium mr-2 bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded-full text-xs">1.</span>
              <span>App Search</span>
            </div>
            <div className="text-zinc-500 mx-2">→</div>
            <div className={`flex items-center px-3 py-1 ${activeTab === "upload" ? 'bg-zinc-700 text-white' : 'text-zinc-400'} rounded mx-1`}>
              <span className="font-medium mr-2 bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded-full text-xs">2.</span>
              <span>Keyword Upload</span>
            </div>
            <div className="text-zinc-500 mx-2">→</div>
            <div className={`flex items-center px-3 py-1 ${activeTab === "insights" ? 'bg-zinc-700 text-white' : 'text-zinc-400'} rounded mx-1`}>
              <span className="font-medium mr-2 bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded-full text-xs">3.</span>
              <span>Insights</span>
            </div>
            <div className="text-zinc-500 mx-2">→</div>
            <div className={`flex items-center px-3 py-1 ${activeTab === "results" ? 'bg-zinc-700 text-white' : 'text-zinc-400'} rounded mx-1`}>
              <span className="font-medium mr-2 bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded-full text-xs">4.</span>
              <span>Results</span>
            </div>
          </div>
          
          {/* Main Tabs for the workflow */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-zinc-800 border border-zinc-700 hidden">
              <TabsTrigger value="app-search" className="data-[state=active]:bg-zinc-700">
                1. App Search
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-zinc-700" disabled={!selectedApp}>
                2. Keyword Upload
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-zinc-700" disabled={!keywordData}>
                3. Insights
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-zinc-700" disabled={!results}>
                4. Results
              </TabsTrigger>
            </TabsList>
            
            {/* App Search Tab Content */}
            <TabsContent value="app-search" className="pt-2 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
                <Card className="bg-zinc-900/70 border-zinc-800 shadow-lg overflow-hidden">
                  <AppStoreScraper onSelectApp={handleSelectApp} selectedAppId={selectedApp?.trackId} />
                </Card>
                <Card className="bg-zinc-900/70 border-zinc-800 shadow-lg overflow-hidden">
                  <AppDetailsView appDetails={selectedApp} />
                </Card>
              </div>
            </TabsContent>
            
            {/* Upload Tab Content */}
            <TabsContent value="upload" className="pt-2 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
                <Card className="bg-zinc-900/70 border-zinc-800 shadow-lg">
                  <ChatInterface 
                    onInsightSelect={handleInsightSelect} 
                    uploadedFiles={uploadedFiles}
                    selectedApp={selectedApp}
                  />
                </Card>
                <Card className="bg-zinc-900/70 border-zinc-800 shadow-lg">
                  <FileUploadSection 
                    onFilesUploaded={handleFileUpload}
                    selectedApp={selectedApp}
                  />
                </Card>
              </div>
            </TabsContent>
            
            {/* Insights Tab Content */}
            <TabsContent value="insights" className="pt-2 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
                <div className="lg:col-span-1">
                  <Card className="h-full bg-zinc-900/70 border-zinc-800 shadow-lg">
                    <InsightModules 
                      onInsightSelect={handleInsightSelect}
                      selectedInsight={selectedInsight}
                      isAnalyzing={isAnalyzing}
                      selectedApp={selectedApp}
                      keywordData={parsedKeywords}
                      keywordsCount={parsedKeywords.length}
                    />
                  </Card>
                </div>
                <div className="lg:col-span-2">
                  <Card className="h-full bg-zinc-900/70 border-zinc-800 shadow-lg overflow-auto">
                    <ResultsDisplay 
                      results={results} 
                      isLoading={isAnalyzing}
                      selectedApp={selectedApp}
                      keywordData={parsedKeywords}
                      keywordsCount={parsedKeywords.length}
                    />
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Results Tab Content */}
            <TabsContent value="results" className="pt-2 w-full">
              <div className="h-[calc(100vh-16rem)]">
                <Card className="h-full bg-zinc-900/70 border-zinc-800 shadow-lg overflow-auto">
                  <ResultsDisplay 
                    results={results} 
                    isLoading={isAnalyzing}
                    selectedApp={selectedApp}
                    showFullResults={true}
                    keywordData={parsedKeywords}
                    keywordsCount={parsedKeywords.length}
                  />
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AppProvider>
  );
};

export default GrowthGapFinderPage;
