
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;
  
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg z-40 transition-all duration-200 hover:scale-105"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
