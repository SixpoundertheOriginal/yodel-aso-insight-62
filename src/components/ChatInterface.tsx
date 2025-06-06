
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, X, Bot, User, Loader2, BarChart, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  dashboardData?: any;
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  dashboardData, 
  isOpen, 
  onToggle 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your ASO data analyst. Ask me anything about your dashboard metrics, trends, or performance insights!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const exampleQuestions = [
    {
      text: "What's driving my CVR changes?",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      text: "Compare this period vs last period",
      icon: <BarChart className="h-4 w-4" />,
    },
    {
      text: "Should I be concerned about any metrics?",
      icon: <TrendingDown className="h-4 w-4" />,
    },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateInsight = (question: string) => {
    if (!dashboardData?.summary) {
      return "I don't have access to your current dashboard data. Please make sure the data is loaded.";
    }

    const { impressions, downloads, pageViews, cvr } = dashboardData.summary;
    
    // Simple keyword-based responses (in real implementation, this would be an AI service)
    if (question.toLowerCase().includes("cvr") || question.toLowerCase().includes("conversion")) {
      const cvrTrend = cvr?.delta > 0 ? "increasing" : "decreasing";
      const cvrStatus = Math.abs(cvr?.delta) > 10 ? "significantly" : "moderately";
      return `Your conversion rate is currently ${cvr?.value?.toFixed(2)}% and is ${cvrStatus} ${cvrTrend} by ${Math.abs(cvr?.delta)?.toFixed(1)}%. ${cvr?.delta > 0 ? "This is a positive trend indicating better listing optimization or improved product-market fit." : "Consider optimizing your app icon, screenshots, or description to improve conversions."}`;
    }
    
    if (question.toLowerCase().includes("download") || question.toLowerCase().includes("install")) {
      const downloadTrend = downloads?.delta > 0 ? "growing" : "declining";
      return `Downloads are ${downloadTrend} by ${Math.abs(downloads?.delta)?.toFixed(1)}% with ${downloads?.value?.toLocaleString()} total downloads. ${downloads?.delta > 0 ? "Great momentum! Consider scaling successful acquisition channels." : "Focus on improving visibility through ASO and reviewing competitor strategies."}`;
    }
    
    if (question.toLowerCase().includes("impression") || question.toLowerCase().includes("visibility")) {
      const impressionTrend = impressions?.delta > 0 ? "increasing" : "decreasing";
      return `Impressions are ${impressionTrend} by ${Math.abs(impressions?.delta)?.toFixed(1)}% with ${impressions?.value?.toLocaleString()} total impressions. ${impressions?.delta > 0 ? "Good visibility growth - make sure your conversion funnel is optimized to capitalize on this." : "Consider keyword optimization and category positioning to improve discoverability."}`;
    }
    
    if (question.toLowerCase().includes("compare") || question.toLowerCase().includes("period")) {
      const metrics = [
        { name: "Downloads", value: downloads?.delta, symbol: downloads?.delta > 0 ? "↗️" : "↘️" },
        { name: "Impressions", value: impressions?.delta, symbol: impressions?.delta > 0 ? "↗️" : "↘️" },
        { name: "CVR", value: cvr?.delta, symbol: cvr?.delta > 0 ? "↗️" : "↘️" },
        { name: "Page Views", value: pageViews?.delta, symbol: pageViews?.delta > 0 ? "↗️" : "↘️" }
      ];
      
      const bestPerformer = metrics.reduce((best, current) => 
        Math.abs(current.value || 0) > Math.abs(best.value || 0) ? current : best
      );
      
      return `Period comparison shows ${bestPerformer.name} had the biggest change at ${bestPerformer.value?.toFixed(1)}% ${bestPerformer.symbol}. Overall trends: Downloads ${downloads?.delta?.toFixed(1)}%, Impressions ${impressions?.delta?.toFixed(1)}%, CVR ${cvr?.delta?.toFixed(1)}%, Page Views ${pageViews?.delta?.toFixed(1)}%.`;
    }
    
    if (question.toLowerCase().includes("concern") || question.toLowerCase().includes("problem") || question.toLowerCase().includes("issue")) {
      const concerns = [];
      if (cvr?.delta < -10) concerns.push("CVR declining significantly");
      if (downloads?.delta < -15) concerns.push("Downloads dropping notably");
      if (impressions?.delta < -20) concerns.push("Visibility decreasing");
      
      if (concerns.length > 0) {
        return `⚠️ Areas of concern: ${concerns.join(", ")}. I recommend immediate attention to ASO elements and competitive analysis.`;
      } else {
        return `✅ No major concerns detected. All metrics are performing within acceptable ranges. Keep monitoring trends and consider optimization opportunities.`;
      }
    }
    
    // Default response with summary
    return `Based on your current metrics: Downloads ${downloads?.value?.toLocaleString()} (${downloads?.delta > 0 ? '+' : ''}${downloads?.delta?.toFixed(1)}%), CVR ${cvr?.value?.toFixed(2)}% (${cvr?.delta > 0 ? '+' : ''}${cvr?.delta?.toFixed(1)}%), Impressions ${impressions?.value?.toLocaleString()} (${impressions?.delta > 0 ? '+' : ''}${impressions?.delta?.toFixed(1)}%). Feel free to ask more specific questions about trends, comparisons, or optimization strategies!`;
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI processing time
    setTimeout(() => {
      const insight = generateInsight(inputValue);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: insight,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleExampleQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] z-50">
      <Card className="h-full bg-zinc-900 border-orange-500/20 shadow-2xl flex flex-col">
        <CardHeader className="p-4 flex flex-row items-center justify-between bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-b border-orange-500/20">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-lg text-white">Data Insights Chat</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-orange-500 text-white"
                        : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === "assistant" && (
                        <Bot className="h-4 w-4 mt-0.5 text-orange-400 flex-shrink-0" />
                      )}
                      {message.role === "user" && (
                        <User className="h-4 w-4 mt-0.5 text-white flex-shrink-0" />
                      )}
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 text-zinc-100 max-w-[80%] rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-orange-400" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Example questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 mb-2">Try asking:</p>
              <div className="space-y-2">
                {exampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-left text-zinc-200"
                    onClick={() => handleExampleQuestion(question.text)}
                  >
                    <div className="mr-2">{question.icon}</div>
                    {question.text}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input area */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask about your data..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
