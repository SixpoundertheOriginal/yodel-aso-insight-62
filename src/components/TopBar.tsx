
import React from "react";
import DatePicker from "./DatePicker";
import ResetButton from "./ResetButton";

const TopBar: React.FC = React.memo(() => {
  return (
    <div className="border-b border-zinc-700 bg-zinc-800 p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-white">Store Performance</h1>
      <div className="flex items-center space-x-4">
        <DatePicker />
        <ResetButton />
      </div>
    </div>
  );
});

TopBar.displayName = "TopBar";
export default TopBar;
