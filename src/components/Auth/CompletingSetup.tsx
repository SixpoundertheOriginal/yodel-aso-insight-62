
import React from 'react';
import { RefreshCw } from 'lucide-react';

export const CompletingSetup: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4 text-white">
      <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Finalizing Your Account</h1>
      <p className="text-zinc-400 text-center">
        We're just setting things up for you. This might take a moment.
      </p>
    </div>
  );
};
