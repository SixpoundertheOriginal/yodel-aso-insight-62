
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppDetails } from "./AppStoreScraper";

interface AppDetailsViewProps {
  appDetails: AppDetails | null;
}

export const AppDetailsView: React.FC<AppDetailsViewProps> = ({ appDetails }) => {
  if (!appDetails) {
    return (
      <Card className="border-none shadow-none bg-transparent flex items-center justify-center h-full">
        <CardContent className="p-6 text-center">
          <div className="text-zinc-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-1">No App Selected</h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">
            Search for and select an app from the App Store to see details here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format metadata
  const formatSize = (bytes?: string) => {
    if (!bytes) return "N/A";
    return `${(parseInt(bytes) / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Generate initial insights
  const generateInitialInsights = () => {
    const insights = [];
    
    if (appDetails.userRatingCount) {
      if (appDetails.userRatingCount < 100) {
        insights.push("Low rating volume - consider implementing a rating prompt");
      } else if (appDetails.averageUserRating && appDetails.averageUserRating < 4.0) {
        insights.push("Below-average rating - focus on addressing user feedback");
      } else if (appDetails.averageUserRating && appDetails.averageUserRating >= 4.5) {
        insights.push("Strong user rating - leverage this in your ASO strategy");
      }
    }
    
    if (appDetails.description) {
      if (appDetails.description.length < 500) {
        insights.push("Short app description - consider expanding to improve discoverability");
      }
      if (!appDetails.description.includes("privacy") && !appDetails.description.includes("Privacy")) {
        insights.push("Privacy messaging missing - consider addressing user privacy concerns");
      }
    }
    
    if (appDetails.screenshotUrls && appDetails.screenshotUrls.length < 5) {
      insights.push("Limited screenshot count - consider adding more visual assets");
    }
    
    // Add a generic insight if no specific ones were identified
    if (insights.length === 0) {
      insights.push("Upload keyword data to get detailed growth opportunities");
    }
    
    return insights;
  };
  
  const initialInsights = generateInitialInsights();

  return (
    <Card className="border-none shadow-none bg-transparent h-full overflow-auto">
      <CardHeader className="p-4 flex items-center">
        <div className="flex items-center space-x-3">
          <img 
            src={appDetails.artworkUrl100} 
            alt={appDetails.trackName} 
            className="w-12 h-12 rounded-lg" 
          />
          <div>
            <CardTitle className="text-lg text-white">{appDetails.trackName}</CardTitle>
            <p className="text-sm text-zinc-400">{appDetails.sellerName}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-6">
        {/* App Summary */}
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-2 bg-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400">Category</p>
              <p className="text-sm text-white">{appDetails.primaryGenreName || "Unknown"}</p>
            </div>
            <div className="text-center p-2 bg-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400">Rating</p>
              <p className="text-sm text-white">
                <span className="text-yellow-400">{appDetails.averageUserRating?.toFixed(1) || "N/A"} ★</span>
                <span className="text-xs text-zinc-500 ml-1">
                  ({appDetails.userRatingCount?.toLocaleString() || 0})
                </span>
              </p>
            </div>
            <div className="text-center p-2 bg-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400">Size</p>
              <p className="text-sm text-white">{formatSize(appDetails.fileSizeBytes)}</p>
            </div>
            <div className="text-center p-2 bg-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400">Bundle ID</p>
              <p className="text-sm text-white text-ellipsis overflow-hidden">{appDetails.bundleId}</p>
            </div>
            <div className="text-center p-2 bg-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400">iOS Version</p>
              <p className="text-sm text-white">{appDetails.minimumOsVersion || "N/A"}</p>
            </div>
            <div className="text-center p-2 bg-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400">Last Updated</p>
              <p className="text-sm text-white">{formatDate(appDetails.currentVersionReleaseDate)}</p>
            </div>
          </div>
        </div>
        
        {/* Initial Insights */}
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-md font-medium text-white mb-3">Preliminary Insights</h3>
          <ul className="space-y-2">
            {initialInsights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <div className="text-yodel-orange mr-2">•</div>
                <span className="text-sm text-zinc-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* App Description */}
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-md font-medium text-white mb-2">Description</h3>
          <div className="max-h-32 overflow-auto pr-2">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{appDetails.description}</p>
          </div>
        </div>
        
        {/* Screenshots */}
        {appDetails.screenshotUrls && appDetails.screenshotUrls.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-md font-medium text-white mb-3">Screenshots</h3>
            <div className="grid grid-cols-3 gap-2">
              {appDetails.screenshotUrls.slice(0, 3).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Screenshot ${idx + 1}`}
                  className="rounded-md w-full h-auto border border-zinc-600"
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Next Steps */}
        <div className="bg-zinc-800/50 border-2 border-dashed border-yodel-orange/30 rounded-lg p-4 text-center">
          <h3 className="text-md font-medium text-yodel-orange mb-2">Next Steps</h3>
          <p className="text-sm text-zinc-300 mb-3">
            Upload keyword data to analyze growth opportunities for {appDetails.trackName}
          </p>
          <div className="flex justify-center space-x-2">
            <Badge variant="outline" className="bg-zinc-700/50 text-zinc-300">Brand vs Generic</Badge>
            <Badge variant="outline" className="bg-zinc-700/50 text-zinc-300">Competitor Analysis</Badge>
            <Badge variant="outline" className="bg-zinc-700/50 text-zinc-300">Metadata Suggestions</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
