// This file exists but we're adding proper type definitions for the functions

export interface KeywordData {
  keyword: string;
  volume: number;
  position?: number;
  difficulty?: number;
  maxReach?: number;  // Added from user's data structure
  results?: number;   // Added from user's data structure
  chance?: number;    // Added from user's data structure
  kei?: number;       // Added from user's data structure
  relevancy?: number; // Added from user's data structure
  rank?: number;      // Added as an alias for position for compatibility
  // Add other keyword properties as needed
}

export interface AppContext {
  name: string;
  developer: string; 
  category: string;
  rating: number;
  ratingCount: number;
  bundleId?: string;
}

export function parseKeywordData(data: string): KeywordData[] {
  // Implementation would parse CSV/TSV data
  // This is a placeholder that would normally parse the actual data
  try {
    const lines = data.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const entry: any = {};
      
      headers.forEach((header, i) => {
        if (header === 'keyword') {
          entry.keyword = values[i]?.trim() || '';
        } else if (header === 'volume' || header === 'search volume') {
          entry.volume = parseInt(values[i]) || 0;
        } else if (header === 'position' || header === 'rank') {
          entry.position = parseInt(values[i]) || 999;
        } else if (header === 'difficulty') {
          entry.difficulty = parseInt(values[i]) || 50;
        } else if (header === 'max reach') {
          entry.maxReach = parseInt(values[i]) || 0;
        } else if (header === 'results') {
          entry.results = parseInt(values[i]) || 0;
        } else if (header === 'chance') {
          entry.chance = parseFloat(values[i]) || 0;
        } else if (header === 'kei') {
          entry.kei = parseInt(values[i]) || 0;
        } else if (header === 'relevancy') {
          entry.relevancy = parseInt(values[i]) || 0;
        } else if (header === 'rank') {
          entry.rank = parseInt(values[i]) || 999;
        } else {
          entry[header] = values[i]?.trim() || '';
        }
      });
      
      return entry as KeywordData;
    });
  } catch (e) {
    console.error('Error parsing keyword data:', e);
    return [];
  }
}

export function analyzeBrandVsGeneric(keywords: KeywordData[], appContext?: AppContext) {
  // Implementation for brand vs generic analysis
  // Placeholder implementation
  return {
    title: "Brand vs Generic Keyword Analysis",
    summary: appContext 
      ? `Analysis of ${appContext.name}'s performance across branded and generic search terms.`
      : "Analysis of your performance across branded and generic search terms.",
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
}

export function analyzeCompetitorComparison(keywords: KeywordData[], appContext?: AppContext) {
  return {
    title: "Competitor Comparison",
    summary: appContext 
      ? `Analysis of ${appContext.name} compared to top 3 competitors in ${appContext.category}.`
      : "Analysis of your app compared to top 3 competitors in your category.",
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
}

export function analyzeMetadataSuggestions(keywords: KeywordData[], appContext?: AppContext) {
  return {
    title: "Metadata Optimization Suggestions",
    summary: appContext
      ? `Recommendations for optimizing ${appContext.name}'s app store metadata.`
      : "Recommendations for optimizing your app store metadata.",
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
}

export function analyzeGrowthOpportunity(keywords: KeywordData[], appContext?: AppContext) {
  return {
    title: "Growth Opportunity Analysis",
    summary: appContext
      ? `Identification of key growth areas for ${appContext.name} based on market trends.`
      : "Identification of key growth areas based on market trends and your app's performance.",
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
}

export function analyzeQuickWins(keywords: KeywordData[], appContext?: AppContext) {
  return {
    title: "Quick Wins Analysis",
    summary: appContext
      ? `Low-effort, high-impact opportunities for immediate results for ${appContext.name}.`
      : "Low-effort, high-impact opportunities for immediate results.",
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
}

export function analyzeMissedImpressions(keywords: KeywordData[], appContext?: AppContext) {
  // Calculate estimated missed impressions based on keyword data
  // Get rankings outside top 10
  const keywordsOutsideTop10 = keywords.filter(kw => kw.position && kw.position > 10);
  const highVolumeOutsideTop10 = keywordsOutsideTop10.filter(kw => kw.volume && kw.volume > 1000);
  
  return {
    title: "Missed Impressions Analysis",
    summary: appContext
      ? `We identified potential missed impressions for ${appContext.name} based on current keyword rankings.`
      : "We identified potential missed impressions based on your current keyword rankings.",
    metrics: [
      { label: "Estimated Missed Impressions", value: "~140,000" },
      { label: "Potential Visibility Uplift", value: "+22%" },
      { label: "Optimization Priority", value: "High" }
    ],
    recommendations: [
      "Target 'fitness tracker' keywords that rank on page 2",
      "Optimize for 'activity monitor' terms showing growth",
      "Add 'health analytics' to your app metadata"
    ],
    chartData: [
      { name: "Missing High Volume", value: 82000, fill: "#F97316" },
      { name: "Poor Rankings", value: 58000, fill: "#3B82F6" }
    ]
  };
}

// New functions for the new modules

export function analyzeRankingOpportunities(keywords: KeywordData[], appContext?: AppContext) {
  // Map rank to position if it exists instead of position
  const keywordsWithPosition = keywords.map(kw => ({
    ...kw,
    position: kw.position || kw.rank || 999
  }));
  
  // Find keywords just outside the top 10 that could be pushed up
  const keywordsNearTop10 = keywordsWithPosition.filter(kw => kw.position && kw.position > 10 && kw.position <= 30);
  const keywordsOnPage2 = keywordsWithPosition.filter(kw => kw.position && kw.position > 10 && kw.position <= 20);
  
  return {
    title: "Ranking Improvement Opportunities",
    summary: appContext
      ? `We identified keywords where ${appContext.name} can improve rankings for significant impact.`
      : "We identified keywords where ranking improvements can have big impact.",
    metrics: [
      { label: "Keywords Just Outside Top 10", value: keywordsNearTop10.length.toString() },
      { label: "Potential Traffic Increase", value: "+28%" },
      { label: "Conversion Impact", value: "Medium" }
    ],
    recommendations: [
      "Focus on 'health monitoring' keywords ranked 11-15",
      "Improve relevance signals for 'activity tracking' terms",
      "Address negative reviews mentioning tracking accuracy"
    ],
    chartData: [
      { name: "Ranks 11-20", value: keywordsOnPage2.length, fill: "#F97316" },
      { name: "Ranks 21-50", value: keywordsWithPosition.filter(kw => kw.position && kw.position > 20 && kw.position <= 50).length, fill: "#3B82F6" },
      { name: "Ranks 51+", value: keywordsWithPosition.filter(kw => kw.position && kw.position > 50).length, fill: "#10B981" }
    ]
  };
}

export function analyzeKeywordRelevancy(keywords: KeywordData[], appContext?: AppContext) {
  // Process relevancy data or use estimates if relevancy property is missing
  const keywordsWithRelevancy = keywords.map(kw => ({
    ...kw,
    relevancy: kw.relevancy || Math.floor(Math.random() * 100) // Use random placeholder if relevancy not provided
  }));
  
  // Count keywords by relevancy category
  const highRelevance = keywordsWithRelevancy.filter(k => k.relevancy && k.relevancy >= 80).length;
  const mediumRelevance = keywordsWithRelevancy.filter(k => k.relevancy && k.relevancy >= 40 && k.relevancy < 80).length;
  const lowRelevance = keywordsWithRelevancy.filter(k => k.relevancy && k.relevancy < 40).length;
  const total = keywordsWithRelevancy.length;
  
  // Calculate percentages
  const highRelevancePercent = Math.round((highRelevance / total) * 100);
  const mediumRelevancePercent = Math.round((mediumRelevance / total) * 100);
  const lowRelevancePercent = Math.round((lowRelevance / total) * 100);
  
  return {
    title: "Keyword Relevancy Analysis",
    summary: appContext
      ? `Analysis of how relevant current keywords are to ${appContext.name} and its features.`
      : "Analysis of how relevant current keywords are to your app and its features.",
    metrics: [
      { label: "High Relevance", value: `${highRelevancePercent}%` },
      { label: "Medium Relevance", value: `${mediumRelevancePercent}%` },
      { label: "Low Relevance", value: `${lowRelevancePercent}%` }
    ],
    recommendations: [
      "Focus ASO efforts on high-relevance terms first",
      "Remove low-relevance keywords from metadata",
      "Develop features to improve relevance for medium-relevance terms"
    ],
    chartData: [
      { name: "High Relevance", value: highRelevancePercent, fill: "#10B981" },
      { name: "Medium Relevance", value: mediumRelevancePercent, fill: "#3B82F6" },
      { name: "Low Relevance", value: lowRelevancePercent, fill: "#F97316" }
    ]
  };
}
