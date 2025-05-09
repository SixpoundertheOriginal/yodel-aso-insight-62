
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, User } from "lucide-react";

const Header = React.memo(() => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-white">ASO Tool</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/apps" className="text-zinc-400 hover:text-white transition-colors">
              Apps
            </Link>
            <Link to="/keywords" className="text-zinc-400 hover:text-white transition-colors">
              Keywords
            </Link>
            <Link to="/reports" className="text-zinc-400 hover:text-white transition-colors">
              Reports
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-zinc-400">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="md:hidden text-zinc-400">
            <Menu className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-zinc-400">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
