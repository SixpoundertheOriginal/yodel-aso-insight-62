
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, uploadedFiles } = await req.json();
    
    // Validate the API key
    if (!openAIApiKey || openAIApiKey.trim() === '') {
      throw new Error('OpenAI API key is missing');
    }
    
    // Create a system prompt focused on ASO and growth gap finding
    const systemPrompt = {
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
    
    // Add context about uploaded files if any
    let fileContext = "";
    if (uploadedFiles && uploadedFiles.length > 0) {
      fileContext = `\n\nNote: The user has uploaded ${uploadedFiles.length} file(s): ${uploadedFiles.map(file => file.name).join(", ")}. Refer to these files when providing insights.`;
      
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

      return new Response(JSON.stringify({ 
        message: assistantMessage,
        insight: detectInsightRecommendation(assistantMessage)
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
