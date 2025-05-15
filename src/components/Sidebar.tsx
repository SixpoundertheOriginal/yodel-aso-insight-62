
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart, TrendingUp, ArrowDown, LayoutDashboard } from "lucide-react";

const Sidebar: React.FC = React.memo(() => {
  const location = useLocation();
  
  return (
    <aside className="w-64 bg-zinc-800 border-r border-zinc-700 min-h-0 h-full">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-6">Dashboard</h2>
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
          ? "bg-zinc-700 text-white" 
          : "text-zinc-400 hover:bg-zinc-700 hover:text-white"
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

Sidebar.displayName = "Sidebar";
export default Sidebar;
