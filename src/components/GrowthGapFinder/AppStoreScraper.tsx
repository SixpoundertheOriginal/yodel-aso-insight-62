
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

export interface AppDetails {
  trackId: number;
  trackName: string;
  sellerName: string;
  bundleId: string;
  description: string;
  artworkUrl100: string;
  averageUserRating?: number;
  userRatingCount?: number;
  screenshotUrls?: string[];
  primaryGenreName?: string;
  fileSizeBytes?: string;
  minimumOsVersion?: string;
  currentVersionReleaseDate?: string;
  subtitle?: string;
}

interface AppStoreScraperProps {
  onSelectApp: (app: AppDetails) => void;
  selectedAppId?: number | null;
}

export const AppStoreScraper: React.FC<AppStoreScraperProps> = ({
  onSelectApp,
  selectedAppId = null,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter an app name or keyword to search.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          query
        )}&entity=software&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setResults(data.results || []);

      // Fetch detailed info for each app
      for (const app of data.results) {
        try {
          const lookupRes = await fetch(
            `https://itunes.apple.com/lookup?id=${app.trackId}`
          );

          if (!lookupRes.ok) {
            throw new Error("Lookup fetch failed");
          }

          const text = await lookupRes.text();
          let lookupData = {};
          
          try {
            lookupData = JSON.parse(text);
          } catch (jsonErr) {
            throw new Error("Invalid JSON in lookup response");
          }

          if (lookupData.results && lookupData.results.length > 0) {
            const enriched = {
              ...lookupData.results[0],
              subtitle: lookupData.results[0].subtitle || "(subtitle requires backend scraping)",
            };
            
            // Update the specific app with enriched data
            setResults((prev) =>
              prev.map((item) =>
                item.trackId === app.trackId ? enriched : item
              )
            );
          }
        } catch (innerErr) {
          console.error("Detail fetch error for app:", app.trackId, innerErr);
        }
      }

      toast({
        title: "Search Complete",
        description: `Found ${data.results?.length || 0} apps matching "${query}"`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (trackId: number) => {
    setExpandedAppId((prev) => (prev === trackId ? null : trackId));
  };

  const handleSelectApp = (app: AppDetails) => {
    onSelectApp(app);
    toast({
      title: "App Selected",
      description: `"${app.trackName}" has been selected for analysis`,
    });
  };

  const formatSize = (bytes?: string) => {
    if (!bytes) return "N/A";
    return `${(parseInt(bytes) / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="border-none shadow-none bg-transparent h-full overflow-auto">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-white">App Store Search</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Search for an app..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button 
            onClick={handleSearch}
            className="bg-yodel-orange hover:bg-yodel-orange/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-900/20 border border-red-800 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {results.length === 0 && !loading && (
              <div className="text-center py-8 text-zinc-500">
                {query ? "No results found" : "Search for an app to get started"}
              </div>
            )}
            
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-yodel-orange mb-2" />
                <p className="text-zinc-400">Searching App Store...</p>
              </div>
            )}
            
            {results.map((app) => (
              <div 
                key={app.trackId}
                className={`p-4 rounded-lg border ${
                  selectedAppId === app.trackId
                    ? "bg-zinc-700/50 border-yodel-orange"
                    : "bg-zinc-800/50 border-zinc-700/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <img 
                    src={app.artworkUrl100} 
                    alt={app.trackName} 
                    className="w-16 h-16 rounded-lg" 
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{app.trackName}</h3>
                    <p className="text-sm text-zinc-400">{app.sellerName}</p>
                    <div className="flex items-center mt-1 space-x-4">
                      {app.averageUserRating && (
                        <p className="text-sm">
                          <span className="text-yellow-400">{app.averageUserRating.toFixed(1)} ★</span>
                          <span className="text-zinc-500 ml-1">
                            ({app.userRatingCount?.toLocaleString() || 0})
                          </span>
                        </p>
                      )}
                      {app.primaryGenreName && (
                        <p className="text-sm text-zinc-400">{app.primaryGenreName}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <p className="text-xs text-zinc-500">
                        <span className="text-zinc-400">Size:</span> {formatSize(app.fileSizeBytes)}
                      </p>
                      {app.minimumOsVersion && (
                        <p className="text-xs text-zinc-500">
                          <span className="text-zinc-400">iOS:</span> {app.minimumOsVersion}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Button
                      variant={selectedAppId === app.trackId ? "default" : "outline"}
                      size="sm"
                      className={`mb-2 ${
                        selectedAppId === app.trackId
                          ? "bg-yodel-orange hover:bg-yodel-orange/90"
                          : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      }`}
                      onClick={() => handleSelectApp(app)}
                    >
                      {selectedAppId === app.trackId ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {app.description}
                  </p>
                  <button
                    onClick={() => handleViewDetails(app.trackId)}
                    className="text-xs text-yodel-orange hover:text-yodel-orange/80 mt-1"
                  >
                    {expandedAppId === app.trackId ? "Hide Details" : "View Details"}
                  </button>
                </div>
                
                {expandedAppId === app.trackId && (
                  <div className="mt-3 p-3 bg-zinc-700/30 border border-zinc-600 rounded-lg animate-fade-in">
                    <p className="text-sm text-zinc-300 mb-3">
                      {app.description}
                    </p>
                    
                    {app.screenshotUrls && app.screenshotUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {app.screenshotUrls.slice(0, 3).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Screenshot ${idx + 1}`}
                            className="rounded-md w-full h-auto border border-zinc-600"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
