
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart, TrendingUp, ArrowDown, LayoutDashboard, Lightbulb, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Sidebar: React.FC = React.memo(() => {
  const location = useLocation();
  
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-700 min-h-0 h-full">
      <div className="py-6 px-4">
        <div className="flex items-center mb-8 px-2">
          <div className="w-10 h-10 rounded-md bg-gradient-to-r from-yodel-orange to-yodel-orange/90 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">Y</span>
          </div>
          <div className="ml-3">
            <h2 className="text-xl font-semibold text-white">Yodel</h2>
            <p className="text-xs text-zinc-400">App Store Optimization</p>
          </div>
        </div>
        <nav className="space-y-1">
          <SidebarItem 
            href="/overview" 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Overview" 
            isActive={location.pathname === '/overview'}
          />
          <SidebarItem 
            href="/dashboard" 
            icon={<BarChart className="w-5 h-5" />} 
            label="Store Performance" 
            isActive={location.pathname === '/dashboard'}
          />
          <SidebarItem 
            href="/traffic-sources" 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Traffic Sources" 
            isActive={location.pathname === '/traffic-sources'}
          />
          <SidebarItem 
            href="/conversion-analysis" 
            icon={<ArrowDown className="w-5 h-5" />} 
            label="Conversion Analysis" 
            isActive={location.pathname === '/conversion-analysis'}
          />
          <SidebarItem 
            href="/growth-gap-finder" 
            icon={<Lightbulb className="w-5 h-5" />} 
            label="Growth Gap Finder" 
            isActive={location.pathname === '/growth-gap-finder'}
          />
          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-zinc-700 mt-4">
              <div className="flex items-center justify-between mb-2 px-3">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                  Development
                </span>
                <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                  Dev Only
                </Badge>
              </div>
              <SidebarItem 
                href="/admin/setup" 
                icon={<Shield className="w-5 h-5" />} 
                label="Admin Setup" 
                isActive={location.pathname === '/admin/setup'}
              />
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
});

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, label, isActive }) => {
  return (
    <Link
      to={href}
      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? "bg-yodel-orange text-white" 
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      <span className={`mr-3 ${isActive ? "text-white" : "text-zinc-400"}`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

Sidebar.displayName = "Sidebar";
export default Sidebar;
