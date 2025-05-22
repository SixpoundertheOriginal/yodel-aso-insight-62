
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
    
    // Simulate results for demo purposes
    setTimeout(() => {
      setResults({
        type: insightType,
        data: {
          title: `${insightType} Analysis Results`,
          summary: "Here are the key insights we've found based on your data.",
          metrics: [
            { label: "Missed Impressions", value: "~140,000" },
            { label: "Potential Uplift", value: "+22%" },
            { label: "Priority Keywords", value: "15" }
          ]
        }
      });
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `${formatInsightName(insightType)} analysis completed successfully.`,
      });
    }, 2500);
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
