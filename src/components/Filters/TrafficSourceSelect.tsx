
import React from "react";
import { useAsoData } from "@/context/AsoDataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrafficSourceSelectProps {
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
}

const TrafficSourceSelect: React.FC<TrafficSourceSelectProps> = ({
  selectedSources,
  onSourceChange,
}) => {
  const { data } = useAsoData();
  
  if (!data?.trafficSources) return null;
  
  // Get unique traffic sources
  const sources = data.trafficSources.map(source => source.name);
  
  const handleSourceChange = (value: string) => {
    if (value === "all") {
      onSourceChange(sources);
    } else {
      onSourceChange([value]);
    }
  };
  
  return (
    <div className="w-full md:w-64">
      <Select 
        onValueChange={handleSourceChange} 
        defaultValue="all"
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select traffic source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TrafficSourceSelect;
