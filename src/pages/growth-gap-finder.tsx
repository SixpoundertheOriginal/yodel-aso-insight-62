
import React, { useState } from "react";
import { MainLayout } from "@/layouts";
import { ChatInterface } from "@/components/GrowthGapFinder/ChatInterface";
import { FileUploadSection } from "@/components/GrowthGapFinder/FileUploadSection";
import { InsightModules } from "@/components/GrowthGapFinder/InsightModules";
import { ResultsDisplay } from "@/components/GrowthGapFinder/ResultsDisplay";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const GrowthGapFinderPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  const handleFileUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
    setUploadedFiles(files);
    
    if (files.length > 0 && !uploadedFiles.length) {
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully. You can now ask the assistant about your data.`,
      });
    }
  };
  
  const handleInsightSelect = (insightType: string) => {
    console.log("Insight selected:", insightType);
    setSelectedInsight(insightType);
    setIsAnalyzing(true);
    
    // Simulated analysis duration
    const analysisDuration = 2000 + Math.random() * 1500; // Between 2-3.5 seconds
    
    // Simulate results for each insight type
    setTimeout(() => {
      let resultData;
      
      switch(insightType) {
        case "MissedImpressions":
          resultData = {
            title: "Missed Impressions Analysis",
            summary: "We identified potential missed impressions based on your current keyword rankings.",
            metrics: [
              { label: "Estimated Missed Impressions", value: "~140,000" },
              { label: "Potential Visibility Uplift", value: "+22%" },
              { label: "Optimization Priority", value: "High" }
            ],
            recommendations: [
              "Target 'fitness tracker' keywords that rank on page 2",
              "Optimize for 'activity monitor' terms showing growth",
              "Add 'health analytics' to your app metadata"
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
            ]
          };
      }
      
      setResults({
        type: insightType,
        data: resultData
      });
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `${formatInsightName(insightType)} analysis completed successfully.`,
      });
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
      default: return insightType;
    }
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-yodel-orange mr-2">•</span>
            Growth Gap Finder
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Column - Chat & File Upload */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            <Card className="flex-1 bg-zinc-900/70 border-zinc-800 shadow-lg">
              <ChatInterface 
                onInsightSelect={handleInsightSelect} 
                uploadedFiles={uploadedFiles}
              />
            </Card>
            
            <Card className="bg-zinc-900/70 border-zinc-800 shadow-lg">
              <FileUploadSection onFilesUploaded={handleFileUpload} />
            </Card>
          </div>
          
          {/* Middle Column - Insight Modules */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-zinc-900/70 border-zinc-800 shadow-lg">
              <InsightModules 
                onInsightSelect={handleInsightSelect}
                selectedInsight={selectedInsight}
                isAnalyzing={isAnalyzing}
              />
            </Card>
          </div>
          
          {/* Right Column - Results Display */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-zinc-900/70 border-zinc-800 shadow-lg overflow-auto">
              <ResultsDisplay 
                results={results} 
                isLoading={isAnalyzing} 
              />
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default GrowthGapFinderPage;
