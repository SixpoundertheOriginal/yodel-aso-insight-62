
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keyword data interface
interface KeywordData {
  keyword: string;
  volume: number;
  maxReach: number;
  results: number;
  difficulty: number;
  chance: number;
  kei: number;
  relevancy: number;
  rank: number | null;
}

// Parse tab-delimited keyword data
const parseKeywordData = (rawData: string): KeywordData[] => {
  try {
    const lines = rawData.trim().split('\n');
    const headers = lines[0].split('\t');
    
    const keywordIndex = headers.findIndex(h => h.toLowerCase().includes('keyword'));
    const volumeIndex = headers.findIndex(h => h.toLowerCase().includes('volume'));
    const maxReachIndex = headers.findIndex(h => h.toLowerCase() === 'max reach');
    const resultsIndex = headers.findIndex(h => h.toLowerCase() === 'results');
    const difficultyIndex = headers.findIndex(h => h.toLowerCase() === 'difficulty');
    const chanceIndex = headers.findIndex(h => h.toLowerCase() === 'chance');
    const keiIndex = headers.findIndex(h => h.toLowerCase() === 'kei');
    const relevancyIndex = headers.findIndex(h => h.toLowerCase() === 'relevancy');
    const rankIndex = headers.findIndex(h => h.toLowerCase().includes('rank'));
    
    const data: KeywordData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      if (cols.length < 3) continue; // Skip invalid lines
      
      data.push({
        keyword: cols[keywordIndex] || '',
        volume: parseInt(cols[volumeIndex]) || 0,
        maxReach: parseInt(cols[maxReachIndex]) || 0,
        results: parseInt(cols[resultsIndex]) || 0,
        difficulty: parseInt(cols[difficultyIndex]) || 0,
        chance: parseInt(cols[chanceIndex]) || 0,
        kei: parseInt(cols[keiIndex]) || 0,
        relevancy: parseInt(cols[relevancyIndex]) || 0,
        rank: cols[rankIndex] === 'null' ? null : parseInt(cols[rankIndex])
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing keyword data:', error);
    return [];
  }
};

// Helper function for basic keyword analysis
const analyzeKeywords = (keywords: KeywordData[], appName = 'Jodel') => {
  // Basic metrics
  const totalKeywords = keywords.length;
  const rankedKeywords = keywords.filter(k => k.rank !== null);
  const rankPercentage = Math.round((rankedKeywords.length / totalKeywords) * 100);
  
  // Volume breakdown
  const highVolumeKeywords = keywords.filter(k => k.volume > 80);
  const mediumVolumeKeywords = keywords.filter(k => k.volume <= 80 && k.volume > 60);
  const lowVolumeKeywords = keywords.filter(k => k.volume <= 60);
  
  // Difficulty breakdown
  const highDifficultyKeywords = keywords.filter(k => k.difficulty > 80);
  const mediumDifficultyKeywords = keywords.filter(k => k.difficulty <= 80 && k.difficulty > 50);
  const lowDifficultyKeywords = keywords.filter(k => k.difficulty <= 50);
  
  // Branded vs generic
  const appNameLower = appName.toLowerCase();
  const brandedKeywords = keywords.filter(k => 
    k.keyword.toLowerCase().includes(appNameLower) || k.relevancy > 30
  );
  const genericKeywords = keywords.filter(k => 
    !k.keyword.toLowerCase().includes(appNameLower) && k.relevancy <= 30
  );
  
  // Opportunities
  const quickWinKeywords = keywords.filter(k => 
    k.volume > 60 && k.difficulty < 50 && (k.rank === null || k.rank > 10)
  ).slice(0, 5);
  
  const competitorKeywords = keywords.filter(k => 
    k.relevancy > 25 && k.rank === null
  ).slice(0, 5);
  
  return {
    totalKeywords,
    rankedKeywords: rankedKeywords.length,
    rankPercentage,
    volumeBreakdown: {
      high: highVolumeKeywords.length,
      medium: mediumVolumeKeywords.length,
      low: lowVolumeKeywords.length
    },
    difficultyBreakdown: {
      high: highDifficultyKeywords.length,
      medium: mediumDifficultyKeywords.length,
      low: lowDifficultyKeywords.length
    },
    brandedKeywords: brandedKeywords.length,
    genericKeywords: genericKeywords.length,
    quickWinOpportunities: quickWinKeywords.map(k => k.keyword),
    competitorOpportunities: competitorKeywords.map(k => k.keyword)
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, uploadedFiles, insightType, keywordData } = await req.json();
    
    // Validate the API key
    if (!openAIApiKey || openAIApiKey.trim() === '') {
      throw new Error('OpenAI API key is missing');
    }
    
    // Parse keyword data if available
    let parsedKeywords: KeywordData[] = [];
    if (keywordData && typeof keywordData === 'string' && keywordData.trim() !== '') {
      parsedKeywords = parseKeywordData(keywordData);
      console.log(`Parsed ${parsedKeywords.length} keywords from data`);
    }
    
    // Create a system prompt focused on ASO and growth gap finding
    let systemPrompt = {
      role: 'system',
      content: `You are an ASO (App Store Optimization) expert assistant called YodelAI, specialized in finding growth gaps and optimization opportunities for mobile apps. 
      
      Your expertise includes:
      - Keyword optimization and rankings
      - App metadata analysis
      - Conversion rate optimization
      - Competitor analysis
      - Visibility improvement strategies
      
      When users upload keyword data files, reference them in your analysis. Focus on being specific, actionable, and data-driven in your responses. If users ask about insight modules (Missed Impressions, Brand vs. Generic, Competitor Comparison, etc.), explain what insights they provide.
      
      Always maintain a helpful, professional tone while providing strategic app store optimization advice.`
    };
    
    // Add keyword analysis to system prompt if available
    if (parsedKeywords.length > 0) {
      const keywordAnalysis = analyzeKeywords(parsedKeywords);
      systemPrompt.content += `\n\nI have analyzed the keyword data provided. Here's a summary of the data:\n
- Total keywords: ${keywordAnalysis.totalKeywords}
- Keywords with rankings: ${keywordAnalysis.rankedKeywords} (${keywordAnalysis.rankPercentage}%)
- Volume breakdown: ${keywordAnalysis.volumeBreakdown.high} high volume, ${keywordAnalysis.volumeBreakdown.medium} medium volume, ${keywordAnalysis.volumeBreakdown.low} low volume keywords
- Difficulty breakdown: ${keywordAnalysis.difficultyBreakdown.high} high difficulty, ${keywordAnalysis.difficultyBreakdown.medium} medium difficulty, ${keywordAnalysis.difficultyBreakdown.low} low difficulty keywords
- ${keywordAnalysis.brandedKeywords} branded keywords and ${keywordAnalysis.genericKeywords} generic keywords

Some quick win opportunities include: ${keywordAnalysis.quickWinOpportunities.join(', ')}
Some competitor-focused opportunities include: ${keywordAnalysis.competitorOpportunities.join(', ')}

Please reference this data in your recommendations.`;
    }
    
    // If there's a specific insight type requested, customize the system prompt
    if (insightType) {
      let insightPromptAddition = "";
      
      switch(insightType) {
        case "MissedImpressions":
          insightPromptAddition = `
          You're now focusing specifically on missed impression opportunities. Analyze:
          - Keywords where the app ranks on page 2-5 that could be moved to page 1
          - High-volume keywords with sub-optimal rankings
          - Visibility gaps compared to competitors
          - Specific recommendations for improving rankings on high-potential keywords
          
          Provide estimates of potential impression gains where possible.`;
          break;
          
        case "BrandVsGeneric":
          insightPromptAddition = `
          You're now focusing specifically on the balance between branded and generic keywords. Analyze:
          - Current performance across branded vs. generic terms
          - Conversion rate differences between branded/generic traffic
          - Opportunities to expand generic keyword coverage
          - Strategic approach to branded keyword defense
          
          Provide specific recommendations for optimizing both branded and generic keyword strategies.`;
          break;
          
        case "CompetitorComparison":
          insightPromptAddition = `
          You're now focusing specifically on competitive analysis. Analyze:
          - Keyword overlap with top 3 competitors
          - Ranking advantages and disadvantages vs. competitors
          - Metadata and visual asset differences
          - Opportunities to target competitor weaknesses
          
          Provide specific recommendations for gaining competitive advantage in the app stores.`;
          break;
          
        case "MetadataSuggestions":
          insightPromptAddition = `
          You're now focusing specifically on metadata optimization. Analyze:
          - Current title, subtitle, and description effectiveness
          - Keyword density and placement optimization
          - Visual asset improvement opportunities
          - Category and in-app purchase keyword optimization
          
          Provide specific recommendations for metadata changes that could improve visibility and conversion.`;
          break;
          
        case "GrowthOpportunity":
          insightPromptAddition = `
          You're now focusing specifically on growth opportunities. Analyze:
          - Emerging search trends relevant to the app
          - Untapped geographic markets or languages
          - Seasonal opportunities for promotion
          - Category expansion possibilities
          
          Provide specific recommendations for capitalizing on growth opportunities in the near term.`;
          break;
          
        case "QuickWins":
          insightPromptAddition = `
          You're now focusing specifically on quick, high-impact optimizations. Analyze:
          - Low-effort metadata changes with high potential impact
          - Simple visual asset updates to improve conversion
          - Review response strategies for immediate reputation improvement
          - Keyword adjustments that could yield fast ranking improvements
          
          Provide specific, actionable recommendations that can be implemented within 1-2 weeks.`;
          break;
      }
      
      // Add the insight-specific guidance to the system prompt
      if (insightPromptAddition) {
        systemPrompt.content += "\n\n" + insightPromptAddition;
      }
    }
    
    // Add context about uploaded files if any
    let fileContext = "";
    if (uploadedFiles && uploadedFiles.length > 0) {
      fileContext = `\n\nThe user has uploaded ${uploadedFiles.length} file(s): ${uploadedFiles.map(file => file.name).join(", ")}. Refer to these files when providing insights.`;
      
      // Add fileContext to the latest user message if it exists
      if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
        messages[messages.length - 1].content += fileContext;
      }
    }
    
    // Create the final messages array with the system prompt
    const completeMessages = [systemPrompt, ...messages];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: completeMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error response:', errorData);
        
        // Check for common OpenAI errors
        if (errorData.error?.type === 'invalid_request_error') {
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Invalid request'}`);
        } else if (errorData.error?.type === 'authentication_error') {
          throw new Error('OpenAI API error: Authentication failed. The API key may be invalid.');
        } else if (errorData.error?.message?.includes('billing')) {
          throw new Error('OpenAI API error: There appears to be a billing issue with your OpenAI account.');
        } else {
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      
      // Generate insight results if we have keywords and an insight type
      let insightResults = null;
      if (parsedKeywords.length > 0 && insightType) {
        // This would normally come from our keyword analysis functions
        insightResults = generateInsightResults(parsedKeywords, insightType);
      }
      
      // If this was an insight-specific analysis, recommend related insights
      let recommendedInsight = null;
      if (insightType) {
        // Recommend a related insight based on the current one
        switch(insightType) {
          case "MissedImpressions":
            recommendedInsight = "MetadataSuggestions";
            break;
          case "BrandVsGeneric":
            recommendedInsight = "CompetitorComparison";
            break;
          case "CompetitorComparison":
            recommendedInsight = "GrowthOpportunity";
            break;
          case "MetadataSuggestions":
            recommendedInsight = "QuickWins";
            break;
          case "GrowthOpportunity":
            recommendedInsight = "MissedImpressions";
            break;
          case "QuickWins":
            recommendedInsight = "BrandVsGeneric";
            break;
          default:
            recommendedInsight = detectInsightRecommendation(assistantMessage);
        }
      } else {
        // For regular chat, detect insight from message
        recommendedInsight = detectInsightRecommendation(assistantMessage);
      }

      return new Response(JSON.stringify({ 
        message: assistantMessage,
        insight: recommendedInsight,
        insightResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openAIError) {
      console.error('Error calling OpenAI API:', openAIError);
      
      // Provide a fallback response
      return new Response(JSON.stringify({ 
        message: "I'm currently experiencing technical difficulties connecting to my knowledge base. Please try again later or try one of our pre-built insight modules for ASO analysis.",
        insight: null,
        error: openAIError.message
      }), {
        status: 200, // Return 200 status to prevent cascading errors in the frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in aso-chat function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm sorry, I encountered an error processing your request. Please try again or use one of our pre-built insight modules." 
    }), {
      status: 200, // Return 200 status to prevent cascading errors in the frontend
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to detect if the message suggests a specific insight module
function detectInsightRecommendation(message) {
  const insightTypes = {
    "MissedImpressions": ["missed impressions", "impression gap", "visibility gap", "rankings improvement"],
    "BrandVsGeneric": ["brand vs generic", "branded keywords", "brand terms", "generic terms"],
    "CompetitorComparison": ["competitor", "competition", "compare with", "compared to", "versus"],
    "MetadataSuggestions": ["metadata", "app store listing", "app description", "title optimization", "subtitle"],
    "GrowthOpportunity": ["growth opportunity", "potential growth", "growth area", "uplift potential"],
    "QuickWins": ["quick win", "low-hanging fruit", "easy optimization", "immediate improvement"]
  };
  
  let recommendedInsight = null;
  let highestMatchCount = 0;
  
  // Check each insight type for keywords in the message
  for (const [insightType, keywords] of Object.entries(insightTypes)) {
    const matchCount = keywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      recommendedInsight = insightType;
    }
  }
  
  // Only recommend if we have strong confidence
  return highestMatchCount >= 2 ? recommendedInsight : null;
}

// Generate insight results based on the insight type and keyword data
function generateInsightResults(keywords: KeywordData[], insightType: string) {
  let resultData;
  
  switch(insightType) {
    case "MissedImpressions": {
      // Find missing high-volume keywords
      const missingHighVolume = keywords
        .filter(k => k.rank === null && k.volume > 70)
        .sort((a, b) => b.volume - a.volume);
      
      // Find poorly ranked high-volume keywords
      const poorlyRankedHighVolume = keywords
        .filter(k => k.rank !== null && k.rank > 10 && k.volume > 70)
        .sort((a, b) => b.volume - a.volume);
      
      // Calculate potential impressions
      const potentialImpressions = [...missingHighVolume, ...poorlyRankedHighVolume]
        .reduce((sum, k) => sum + k.maxReach, 0);
      
      const recommendations = [];
      if (missingHighVolume.length > 0) {
        recommendations.push(`Target high-volume keywords: ${missingHighVolume.slice(0, 3).map(k => `"${k.keyword}"`).join(', ')}`);
      }
      
      if (poorlyRankedHighVolume.length > 0) {
        recommendations.push(`Improve rankings for: ${poorlyRankedHighVolume.slice(0, 3).map(k => `"${k.keyword}" (#${k.rank})`).join(', ')}`);
      }
      
      if (recommendations.length < 3) {
        recommendations.push("Add high-volume keywords to your app title and subtitle for better rankings");
      }
      
      resultData = {
        title: "Missed Impressions Analysis",
        summary: `We identified potential missed impressions based on ${missingHighVolume.length + poorlyRankedHighVolume.length} keywords with optimization potential.`,
        metrics: [
          { label: "Estimated Missed Impressions", value: potentialImpressions.toLocaleString() },
          { label: "Missing High-Volume Keywords", value: missingHighVolume.length.toString() },
          { label: "Poor-Ranking Keywords", value: poorlyRankedHighVolume.length.toString() }
        ],
        recommendations: recommendations.slice(0, 3),
        chartData: [
          { name: "Missing High Volume", value: missingHighVolume.reduce((sum, k) => sum + k.maxReach, 0), fill: "#F97316" },
          { name: "Poor Rankings", value: poorlyRankedHighVolume.reduce((sum, k) => sum + k.maxReach, 0), fill: "#3B82F6" }
        ]
      };
      break;
    }
    
    case "BrandVsGeneric": {
      // Simple branded vs generic classification
      const appName = 'Jodel'; // Could be parameterized
      const appNameLower = appName.toLowerCase();
      const branded = keywords.filter(k => k.keyword.toLowerCase().includes(appNameLower) || k.relevancy > 30);
      const generic = keywords.filter(k => !k.keyword.toLowerCase().includes(appNameLower) && k.relevancy <= 30);
      
      const brandedPercentage = Math.round((branded.length / keywords.length) * 100);
      const genericPercentage = Math.round((generic.length / keywords.length) * 100);
      
      resultData = {
        title: "Brand vs Generic Keyword Analysis",
        summary: `Analysis of ${keywords.length} keywords shows a ${brandedPercentage}% branded vs ${genericPercentage}% generic keyword distribution.`,
        metrics: [
          { label: "Brand Term Share", value: `${brandedPercentage}%` },
          { label: "Generic Term Share", value: `${genericPercentage}%` },
          { label: "Total Keywords", value: keywords.length.toString() }
        ],
        recommendations: [
          `${brandedPercentage > 50 ? "Diversify" : "Maintain"} your keyword strategy with more generic terms`,
          "Optimize title and subtitle with a mix of branded and generic keywords",
          `Focus on ${brandedPercentage < 30 ? "strengthening brand visibility" : "expanding generic reach"}`
        ],
        chartData: [
          { name: "Branded", value: branded.length, fill: "#F97316" },
          { name: "Generic", value: generic.length, fill: "#3B82F6" }
        ]
      };
      break;
    }
    
    case "CompetitorComparison": {
      // Calculate ranking metrics
      const rankedKeywords = keywords.filter(k => k.rank !== null);
      const unrankedKeywords = keywords.filter(k => k.rank === null);
      const keywordsInTop10 = rankedKeywords.filter(k => k.rank! <= 10);
      const keywordsInTop50 = rankedKeywords.filter(k => k.rank! <= 50);
      
      // Find high-volume keywords where app isn't ranking
      const missedHighVolumeKeywords = unrankedKeywords
        .filter(k => k.volume > 70)
        .sort((a, b) => b.volume - a.volume);
      
      const rankPercentage = Math.round((rankedKeywords.length / keywords.length) * 100);
      
      resultData = {
        title: "Competitor Comparison",
        summary: `Your app is ranking for ${rankPercentage}% of analyzed keywords, with ${keywordsInTop10.length} in the top 10 positions.`,
        metrics: [
          { label: "Keyword Coverage", value: `${rankPercentage}%` },
          { label: "Top 10 Rankings", value: keywordsInTop10.length.toString() },
          { label: "Opportunity Keywords", value: missedHighVolumeKeywords.length.toString() }
        ],
        recommendations: [
          `Target ${missedHighVolumeKeywords.slice(0, 3).map(k => `"${k.keyword}"`).join(', ')}`,
          "Improve keyword density for terms where you're close to top 3",
          "Analyze top competitor creative assets for insights"
        ],
        chartData: [
          { name: "Top 10", value: keywordsInTop10.length, fill: "#10B981" },
          { name: "11-50", value: keywordsInTop50.length - keywordsInTop10.length, fill: "#3B82F6" },
          { name: "51+", value: rankedKeywords.length - keywordsInTop50.length, fill: "#F97316" },
          { name: "Not Ranking", value: unrankedKeywords.length, fill: "#6B7280" }
        ]
      };
      break;
    }
    
    // Add other insight types following similar patterns...
    case "MetadataSuggestions": {
      // Find high-potential keywords for metadata
      const titleKeywords = keywords
        .filter(k => k.volume > 70 && k.keyword.length < 20 && (k.rank === null || k.rank > 10))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
      
      // Calculate overall metadata optimization score
      const highPotentialKeywords = keywords.filter(k => k.volume > 60 && k.difficulty < 70);
      const metadataScore = Math.min(100, Math.round((highPotentialKeywords.length / (keywords.length * 0.2)) * 100));
      
      resultData = {
        title: "Metadata Optimization Suggestions",
        summary: `Analysis reveals ${highPotentialKeywords.length} high-potential terms that could improve your app's visibility.`,
        metrics: [
          { label: "Title Optimization Score", value: `${metadataScore}%` },
          { label: "High-Potential Keywords", value: highPotentialKeywords.length.toString() },
          { label: "Recommended Title Keywords", value: titleKeywords.length.toString() }
        ],
        recommendations: [
          `Update app title to include: ${titleKeywords.slice(0, 3).map(k => `"${k.keyword}"`).join(', ')}`,
          "Add more benefit-oriented language in first description paragraph",
          "Include more category-specific keywords in subtitle"
        ],
        chartData: [
          { name: "High Volume", value: keywords.filter(k => k.volume > 80).length, fill: "#F97316" },
          { name: "Medium Volume", value: keywords.filter(k => k.volume <= 80 && k.volume > 60).length, fill: "#3B82F6" },
          { name: "Low Volume", value: keywords.filter(k => k.volume <= 60).length, fill: "#10B981" }
        ]
      };
      break;
    }
    
    case "GrowthOpportunity": {
      // Find high-volume keywords app isn't ranking for
      const highVolumeGaps = keywords
        .filter(k => k.rank === null && k.volume > 70)
        .sort((a, b) => b.volume - a.volume);
      
      // Find low difficulty, high volume opportunities
      const quickGrowthOpp = keywords
        .filter(k => k.volume > 60 && k.difficulty < 60)
        .sort((a, b) => (b.volume / a.difficulty) - (a.volume / b.difficulty));
      
      // Calculate total potential volume
      const potentialImpressionIncrease = highVolumeGaps
        .reduce((sum, k) => sum + k.maxReach, 0);
      
      // Calculate growth opportunity score
      const growthScore = Math.min(100, Math.round((quickGrowthOpp.length / keywords.length) * 100));
      
      resultData = {
        title: "Growth Opportunity Analysis",
        summary: `Your app has significant growth potential with ${highVolumeGaps.length} high-volume keywords you're not currently ranking for.`,
        metrics: [
          { label: "Growth Potential", value: `${growthScore}%` },
          { label: "Potential Impression Increase", value: potentialImpressionIncrease.toLocaleString() },
          { label: "High-Value Keywords", value: highVolumeGaps.length.toString() }
        ],
        recommendations: [
          `Target growing keywords: ${quickGrowthOpp.slice(0, 3).map(k => `"${k.keyword}"`).join(', ')}`,
          "Focus on emerging search trends in your category",
          "Capitalize on seasonality with themed promotions"
        ],
        chartData: [
          { name: "High Volume Gaps", value: highVolumeGaps.length, fill: "#F97316" },
          { name: "Quick Growth", value: quickGrowthOpp.length, fill: "#3B82F6" },
          { name: "Low Risk", value: keywords.filter(k => k.difficulty < 50).length, fill: "#10B981" }
        ]
      };
      break;
    }
    
    case "QuickWins": {
      // Find low-hanging fruit (low difficulty, decent volume, not ranking)
      const lowHangingFruit = keywords
        .filter(k => k.difficulty < 50 && k.volume > 60 && (k.rank === null || k.rank > 10))
        .sort((a, b) => (b.volume / a.difficulty) - (a.volume / b.difficulty));
      
      // Find borderline rankings (just outside top 10)
      const borderlineRankings = keywords
        .filter(k => k.rank !== null && k.rank > 10 && k.rank <= 30)
        .sort((a, b) => a.rank! - b.rank!);
      
      // Calculate total potential quick wins
      const totalQuickWins = lowHangingFruit.length + Math.min(borderlineRankings.length, 10);
      
      resultData = {
        title: "Quick Wins Analysis",
        summary: `We identified ${totalQuickWins} quick win opportunities that could improve your visibility with minimal effort.`,
        metrics: [
          { label: "Easy Improvements", value: totalQuickWins.toString() },
          { label: "Low-Difficulty Keywords", value: lowHangingFruit.length.toString() },
          { label: "Borderline Rankings", value: borderlineRankings.length.toString() }
        ],
        recommendations: [
          `Target low-difficulty keywords: ${lowHangingFruit.slice(0, 3).map(k => `"${k.keyword}"`).join(', ')}`,
          `Push borderline rankings into top 10: ${borderlineRankings.slice(0, 3).map(k => `"${k.keyword}" (#${k.rank})`).join(', ')}`,
          "Update screenshots to highlight key features"
        ],
        chartData: [
          { name: "Low Difficulty", value: lowHangingFruit.length, fill: "#10B981" },
          { name: "Just Outside Top 10", value: borderlineRankings.length, fill: "#3B82F6" },
          { name: "Other Opportunities", value: totalQuickWins - lowHangingFruit.length - borderlineRankings.length, fill: "#F97316" }
        ]
      };
      break;
    }
    
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
  
  return resultData;
}
