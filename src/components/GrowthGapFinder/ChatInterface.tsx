
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Upload, BarChart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onInsightSelect: (insightType: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onInsightSelect }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "👋 Hi there! I'm your ASO Growth Gap Finder. Upload your keyword data or ask me about missed visibility opportunities.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const examplePrompts = [
    {
      text: "Upload your keyword export to analyze missed visibility",
      icon: <Upload className="h-4 w-4" />,
      insight: "MissedImpressions"
    },
    {
      text: "Find gaps in our branded keyword coverage",
      icon: <BarChart className="h-4 w-4" />,
      insight: "BrandVsGeneric"
    },
    {
      text: "Compare our rankings with top 3 competitors",
      icon: <TrendingUp className="h-4 w-4" />,
      insight: "CompetitorComparison"
    },
  ];

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "I'll help you analyze that. For best results, please upload your keyword data or select one of the insight modules below.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleExamplePrompt = (prompt: typeof examplePrompts[0]) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: prompt.text,
        timestamp: new Date(),
      },
    ]);

    // Trigger the insight selection
    onInsightSelect(prompt.insight);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `I'll help you with that. Let me run a ${prompt.insight} analysis for you.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  };

  return (
    <Card className="border-none shadow-none bg-transparent flex flex-col h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-white">
          Opportunity Strategist
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 pt-0 overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-col space-y-4">
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
                      ? "bg-yodel-orange text-white"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {messages.length === 1 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-zinc-400 mb-2">Try asking about:</p>
            <div className="flex flex-col space-y-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-left text-zinc-200"
                  onClick={() => handleExamplePrompt(prompt)}
                >
                  <div className="mr-2">{prompt.icon}</div>
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Ask about missed opportunities..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <Button 
            size="icon" 
            className="bg-yodel-orange hover:bg-yodel-orange/90"
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
