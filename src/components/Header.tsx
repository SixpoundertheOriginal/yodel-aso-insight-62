
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Menu, User, Shield, Fingerprint } from "lucide-react";
import { useDevMode } from "@/hooks/useDevMode";
import { useEnvironmentConfig } from "@/hooks/useEnvironmentConfig";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Header = React.memo(() => {
  const { canBypass, isBypassEnabled, toggleBypass } = useDevMode();
  const { data: environmentConfig } = useEnvironmentConfig();

  return (
    <header className="border-b border-zinc-800 bg-gradient-to-r from-yodel-orange/90 to-yodel-orange/80 sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-yodel-orange font-bold text-xl">Y</div>
            <span className="font-bold text-xl text-white">Yodel ASO</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/dashboard" className="text-white hover:text-zinc-200 transition-colors">
              Dashboard
            </Link>
            <Link to="/apps" className="text-white hover:text-zinc-200 transition-colors">
              Apps
            </Link>
            <Link to="/keywords" className="text-white hover:text-zinc-200 transition-colors">
              Keywords
            </Link>
            <Link to="/reports" className="text-white hover:text-zinc-200 transition-colors">
              Reports
            </Link>
            {environmentConfig?.features?.adminControls && (
              <div className="flex items-center space-x-1">
                <Link 
                  to="/admin/setup" 
                  className="text-white hover:text-zinc-200 transition-colors flex items-center space-x-1"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Setup</span>
                </Link>
                <Badge variant="secondary" className="text-xs bg-amber-200 text-amber-800">
                  Dev Only
                </Badge>
              </div>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {canBypass && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleBypass}
                >
                  <Fingerprint className={`h-5 w-5 transition-colors ${isBypassEnabled ? 'text-yellow-400' : 'text-white'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-white">
                <p>{isBypassEnabled ? "Auth Bypass ON (Click to disable)" : "Auth Bypass OFF (Click to enable)"}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20">
            <Menu className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
