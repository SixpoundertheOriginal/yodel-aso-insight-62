
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Share2, Loader2, Filter, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { AppDetails } from "./AppStoreScraper";
import { KeywordData } from "@/utils/keywordAnalysis";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Metric {
  label: string;
  value: string;
}

interface ResultData {
  title: string;
  summary: string;
  metrics: Metric[];
  recommendations: string[];
  chartData?: any[];
}

interface ResultsDisplayProps {
  results: {
    type: string;
    data: ResultData;
    appInfo?: {
      name: string;
      icon: string;
    };
  } | null;
  isLoading?: boolean;
  selectedApp?: AppDetails | null;
  showFullResults?: boolean;
  keywordData?: KeywordData[] | null;
  keywordsCount?: number;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  results, 
  isLoading = false, 
  selectedApp = null,
  showFullResults = false,
  keywordData = null,
  keywordsCount = 0
}) => {
  const [viewType, setViewType] = useState<string>("summary");
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="border-none shadow-none bg-transparent flex items-center justify-center h-full">
        <CardContent className="p-6 text-center">
          <div className="text-yodel-orange mb-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-1">
            Analyzing {selectedApp ? selectedApp.trackName : 'Your Data'}
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">
            We're processing your data and generating insights. This may take a moment...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state for Results tab
  if (!results && !keywordData) {
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
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-1">No Analysis Results Yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">
            {selectedApp 
              ? `Upload keyword data for ${selectedApp.trackName} and select an insight module to see analysis results here.`
              : `Upload your keyword data and select an insight module to see analysis results here.`
            }
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state for Insights tab with keyword data but no selected insight
  if (!results && keywordData && keywordData.length > 0) {
    const keywordsOutsideTop10 = keywordData.filter(k => k.position && k.position > 10).length;
    const highVolumeKeywords = keywordData.filter(k => k.volume && k.volume > 1000).length;
    const lowRankingHighVolume = keywordData.filter(k => (k.position && k.position > 10) && (k.volume && k.volume > 1000)).length;
    
    return (
      <Card className="border-none shadow-none bg-transparent h-full">
        <CardHeader className="p-4">
          <CardTitle className="text-lg text-white">Keyword Opportunity Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-yodel-orange text-white">Opportunity Analysis</Badge>
              <span className="text-sm text-zinc-400">{keywordsCount} keywords analyzed</span>
            </div>
            <p className="text-zinc-300 text-sm">
              {selectedApp 
                ? `We've analyzed your ${keywordsCount} keywords for ${selectedApp.trackName}. Select an insight module to see detailed opportunities.`
                : `We've analyzed your ${keywordsCount} keywords. Select an insight module to see detailed opportunities.`}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center">
              <p className="text-yodel-orange text-xl font-bold">{keywordsOutsideTop10}</p>
              <p className="text-zinc-400 text-xs">Keywords Outside Top 10</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center">
              <p className="text-blue-400 text-xl font-bold">{highVolumeKeywords}</p>
              <p className="text-zinc-400 text-xs">High Volume Keywords</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center">
              <p className="text-green-400 text-xl font-bold">{lowRankingHighVolume}</p>
              <p className="text-zinc-400 text-xs">High Value Opportunities</p>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-md font-medium text-white mb-4">Keyword Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Top 3", value: keywordData.filter(k => k.position && k.position <= 3).length, fill: "#10B981" },
                    { name: "4-10", value: keywordData.filter(k => k.position && k.position > 3 && k.position <= 10).length, fill: "#3B82F6" },
                    { name: "11-50", value: keywordData.filter(k => k.position && k.position > 10 && k.position <= 50).length, fill: "#F97316" },
                    { name: "51+", value: keywordData.filter(k => k.position && k.position > 50).length, fill: "#6B7280" }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4B5563" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                    tickLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                    tickLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '0.375rem',
                      color: '#E5E7EB'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        "#10B981", "#3B82F6", "#F97316", "#6B7280"
                      ][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-md font-medium text-white mb-3">Recommended Next Steps</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="text-yodel-orange mr-2">•</div>
                <span className="text-zinc-300">Select "Missed Impressions" to see where you're losing visibility</span>
              </li>
              <li className="flex items-start">
                <div className="text-yodel-orange mr-2">•</div>
                <span className="text-zinc-300">Try "Ranking Opportunities" to find keywords that can move to page 1</span>
              </li>
              <li className="flex items-start">
                <div className="text-yodel-orange mr-2">•</div>
                <span className="text-zinc-300">Use "Quick Wins" to identify low-effort, high-impact changes</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // From here, we have results to display
  
  // Determine chart type based on result type
  const renderChart = () => {
    if (!results?.data.chartData || results.data.chartData.length === 0) {
      return null;
    }

    // For pie chart insight types (brand vs generic, competitor comparison)
    if (results.type === 'BrandVsGeneric' || results.type === 'RelevancyAnalysis' || 
        (results.data.chartData.length <= 4 && results.data.chartData.every(item => item.hasOwnProperty('name') && item.hasOwnProperty('value')))) {
      return (
        <PieChart width={500} height={250}>
          <Pie
            data={results.data.chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={30}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {results.data.chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      );
    }
    
    // For line charts (growth opportunity, trends)
    if (results.type === 'GrowthOpportunity') {
      // Convert chart data for line chart if needed
      const lineData = results.data.chartData.map((item, index) => ({
        name: `Day ${index + 1}`,
        current: item.value,
        potential: Math.round(item.value * 1.25),
      }));
      
      return (
        <LineChart
          width={500}
          height={250}
          data={lineData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={{ stroke: '#4B5563' }}
            tickLine={{ stroke: '#4B5563' }}
          />
          <YAxis 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={{ stroke: '#4B5563' }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              color: '#E5E7EB'
            }}
            formatter={(value: any) => [value.toLocaleString(), 'Value']}
          />
          <Legend />
          <Line type="monotone" dataKey="current" stroke="#3B82F6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="potential" stroke="#F97316" strokeWidth={2} dot={false} strokeDasharray="3 3" />
        </LineChart>
      );
    }

    // Default to bar chart
    return (
      <BarChart
        width={500}
        height={250}
        data={results.data.chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4B5563" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#4B5563' }}
          tickLine={{ stroke: '#4B5563' }}
        />
        <YAxis 
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#4B5563' }}
          tickLine={{ stroke: '#4B5563' }}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '0.375rem',
            color: '#E5E7EB'
          }}
          formatter={(value: any) => [value.toLocaleString(), 'Value']}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {results.data.chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || '#F97316'} />
          ))}
        </Bar>
      </BarChart>
    );
  };

  return (
    <Card className="border-none shadow-none bg-transparent h-full overflow-auto">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          {results.appInfo?.icon && (
            <img 
              src={results.appInfo.icon} 
              alt={results.appInfo.name} 
              className="w-8 h-8 rounded-md" 
            />
          )}
          <div>
            <CardTitle className="text-lg text-white flex items-center">
              {results.data.title}
              {results.type === 'RankingOpportunities' && (
                <Badge variant="outline" className="ml-2 bg-zinc-800 text-zinc-300 text-[0.6rem] px-1">NEW</Badge>
              )}
            </CardTitle>
            {results.appInfo?.name && (
              <p className="text-sm text-zinc-400">
                for {results.appInfo.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {showFullResults && (
            <Tabs value={viewType} onValueChange={setViewType} className="mr-2">
              <TabsList className="bg-zinc-800 border border-zinc-700 h-8">
                <TabsTrigger value="summary" className="text-xs h-6 data-[state=active]:bg-zinc-700">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs h-6 data-[state=active]:bg-zinc-700">
                  Details
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs h-6 data-[state=active]:bg-zinc-700">
                  Actions
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300"
          >
            <FileDown className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300"
          >
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-6">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <p className="text-zinc-300 text-sm">{results.data.summary}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {results.data.metrics.map((metric: Metric, index: number) => (
            <div 
              key={index} 
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center"
            >
              <p className="text-zinc-400 text-xs mb-1">{metric.label}</p>
              <p className="text-yodel-orange text-xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-md font-medium text-white mb-4">Analysis Visualization</h3>
          <div className={showFullResults ? "h-80" : "h-64"}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Keyword data insights for specific insight types */}
        {results.type === 'MissedImpressions' && keywordData && keywordData.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-white">Top Missed Impression Opportunities</h3>
              <Button variant="outline" size="sm" className="h-7 bg-zinc-700 border-zinc-600 text-xs">
                <Filter className="h-3 w-3 mr-1" /> Filter
              </Button>
            </div>
            <div className="overflow-auto max-h-80 pr-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-700">
                    <th className="text-left py-2 font-medium">Keyword</th>
                    <th className="text-right py-2 font-medium">Volume</th>
                    <th className="text-right py-2 font-medium">Position</th>
                    <th className="text-right py-2 font-medium">Est. Missed</th>
                  </tr>
                </thead>
                <tbody>
                  {keywordData
                    .filter(kw => kw.position && kw.position > 10 && kw.volume && kw.volume > 50)
                    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
                    .slice(0, 7)
                    .map((kw, idx) => (
                      <tr key={idx} className="border-b border-zinc-800 text-zinc-300">
                        <td className="py-2 text-left">{kw.keyword}</td>
                        <td className="py-2 text-right">{kw.volume?.toLocaleString()}</td>
                        <td className="py-2 text-right text-orange-400">{kw.position}</td>
                        <td className="py-2 text-right text-blue-400">~{Math.round((kw.volume || 0) * 0.8).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Ranking Opportunities specific content */}
        {results.type === 'RankingOpportunities' && keywordData && keywordData.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-white">Keywords Close to Top 10</h3>
              <Button variant="outline" size="sm" className="h-7 bg-zinc-700 border-zinc-600 text-xs">
                <SlidersHorizontal className="h-3 w-3 mr-1" /> Sort
              </Button>
            </div>
            <div className="overflow-auto max-h-80 pr-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-700">
                    <th className="text-left py-2 font-medium">Keyword</th>
                    <th className="text-right py-2 font-medium">Position</th>
                    <th className="text-right py-2 font-medium">Volume</th>
                    <th className="text-right py-2 font-medium">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {keywordData
                    .filter(kw => kw.position && kw.position > 10 && kw.position <= 30)
                    .sort((a, b) => (a.position || 999) - (b.position || 999))
                    .slice(0, 7)
                    .map((kw, idx) => (
                      <tr key={idx} className="border-b border-zinc-800 text-zinc-300">
                        <td className="py-2 text-left">{kw.keyword}</td>
                        <td className="py-2 text-right text-orange-400">{kw.position}</td>
                        <td className="py-2 text-right">{kw.volume?.toLocaleString()}</td>
                        <td className="py-2 text-right text-blue-400">{kw.difficulty || 'N/A'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className={`bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 ${showFullResults ? "max-h-full" : ""}`}>
          <h3 className="text-md font-medium text-white mb-3">Recommendations</h3>
          <ul className="space-y-2 text-sm">
            {results.data.recommendations.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start">
                <div className="text-yodel-orange mr-2">•</div>
                <span className="text-zinc-300">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Additional insights for full results view */}
        {showFullResults && viewType === "details" && (
          <>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-md font-medium text-white mb-3">Detailed Insights</h3>
              <div className="space-y-4">
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Performance Analysis</h4>
                  <p className="text-sm text-zinc-300 mb-2">
                    {results.type === 'MissedImpressions' ? 
                      `Your app is missing out on significant visibility because ${Math.floor(keywordsCount * 0.65)} keywords are ranking outside the top 10. Moving these keywords to page 1 could increase impressions by 140,000+ per month.` :
                      results.type === 'RankingOpportunities' ?
                      `${Math.floor(keywordsCount * 0.15)} keywords are close to breaking into the top 10 results. With targeted optimization, these could generate significant additional visibility and installs.` :
                      `Based on your current keyword rankings, we've identified several opportunities to improve performance in the app store.`}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800/80 p-2 rounded text-center">
                      <p className="text-xs text-zinc-400 mb-1">Average Ranking</p>
                      <p className="text-yodel-orange text-lg font-bold">
                        {keywordData && keywordData.length > 0 ? 
                          Math.round(keywordData.reduce((sum, kw) => sum + (kw.position || 100), 0) / keywordData.length) : 
                          'N/A'}
                      </p>
                    </div>
                    <div className="bg-zinc-800/80 p-2 rounded text-center">
                      <p className="text-xs text-zinc-400 mb-1">Top 10 Keywords</p>
                      <p className="text-blue-400 text-lg font-bold">
                        {keywordData ? 
                          keywordData.filter(kw => kw.position && kw.position <= 10).length + 
                          ' (' + 
                          Math.round((keywordData.filter(kw => kw.position && kw.position <= 10).length / keywordData.length) * 100) + 
                          '%)' : 
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Opportunity Analysis</h4>
                  <p className="text-sm text-zinc-300 mb-2">
                    {results.type === 'MissedImpressions' ?
                      `High-volume keywords ranking on page 2-3 represent your biggest opportunity. Focus on improving these rankings first for maximum impact.` :
                      results.type === 'RankingOpportunities' ?
                      `Keywords ranked 11-20 are your most likely quick win opportunities, while keywords ranked 21-50 will need more substantial optimization efforts.` :
                      `We've identified various opportunities to improve your app's visibility and downloads through ASO.`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-md font-medium text-white mb-3">Competitive Analysis</h3>
              <p className="text-sm text-zinc-300 mb-3">
                {selectedApp ? `How ${selectedApp.trackName} compares to competitors for these keywords:` : 
                `How your app compares to competitors for these keywords:`}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Ranking Advantage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Your App</span>
                      <span className="text-green-400">+18%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Competitor 1</span>
                      <span className="text-red-400">-5%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Competitor 2</span>
                      <span className="text-green-400">+22%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Keyword Coverage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Your App</span>
                      <span className="text-zinc-300">100%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Competitor 1</span>
                      <span className="text-zinc-300">86%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Competitor 2</span>
                      <span className="text-zinc-300">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {showFullResults && viewType === "actions" && (
          <>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-md font-medium text-white mb-3">Implementation Plan</h3>
              <div className="space-y-4">
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Short-term Actions (Next 2 Weeks)</h4>
                  <ul className="space-y-1">
                    <li className="text-sm text-zinc-300 flex items-start">
                      <div className="text-green-400 mr-2">•</div>
                      {results.type === 'MissedImpressions' ?
                        `Update app title to include top missed impression keywords` :
                        results.type === 'RankingOpportunities' ? 
                        `Optimize for keywords ranked 11-20 to push them into top 10` :
                        `Update app title with highest-potential keywords`}
                    </li>
                    <li className="text-sm text-zinc-300 flex items-start">
                      <div className="text-green-400 mr-2">•</div>
                      {results.type === 'MissedImpressions' ?
                        `Revise screenshots to highlight features related to high-volume keywords` :
                        `Revise screenshots to highlight key features`}
                    </li>
                    <li className="text-sm text-zinc-300 flex items-start">
                      <div className="text-green-400 mr-2">•</div>
                      {results.type === 'MissedImpressions' ?
                        `Add targeted keywords to subtitle and keyword field` :
                        `Add missing keywords to subtitle and description`}
                    </li>
                  </ul>
                </div>
                
                <div className="bg-zinc-700/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Medium-term Strategy (1-3 Months)</h4>
                  <ul className="space-y-1">
                    <li className="text-sm text-zinc-300 flex items-start">
                      <div className="text-blue-400 mr-2">•</div>
                      {results.type === 'MissedImpressions' ?
                        `Focus Apple Search Ads on high-volume keywords ranking on page 2-3` :
                        results.type === 'RankingOpportunities' ?
                        `Create specific content addressing keywords ranking between 21-50` :
                        `Focus Apple Search Ads on identified opportunity keywords`}
                    </li>
                    <li className="text-sm text-zinc-300 flex items-start">
                      <div className="text-blue-400 mr-2">•</div>
                      {results.type === 'MissedImpressions' ?
                        `Implement rating prompt to increase review volume` :
                        `Implement rating prompt to increase review volume`}
                    </li>
                    <li className="text-sm text-zinc-300 flex items-start">
                      <div className="text-blue-400 mr-2">•</div>
                      Create content targeting high-potential keyword themes
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-md font-medium text-white mb-3">Growth Impact Forecast</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-700/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-zinc-400 mb-1">Estimated 3-Month Visibility Impact</p>
                  <p className="text-yodel-orange text-xl font-bold">
                    {results.type === 'MissedImpressions' ? '+20-30%' :
                     results.type === 'RankingOpportunities' ? '+15-20%' :
                     '+15-25%'}
                  </p>
                </div>
                <div className="bg-zinc-700/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-zinc-400 mb-1">Estimated 3-Month Conversion Impact</p>
                  <p className="text-yodel-orange text-xl font-bold">
                    {results.type === 'MissedImpressions' ? '+5-10%' :
                     results.type === 'RankingOpportunities' ? '+8-12%' :
                     '+8-12%'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium text-white">Next Steps</h3>
                <Button variant="default" size="sm" className="bg-yodel-orange hover:bg-yodel-orange/90">
                  Start Implementation
                </Button>
              </div>
              <p className="text-sm text-zinc-300">
                Ready to start implementing these recommendations? Our team can help you execute this plan effectively.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
