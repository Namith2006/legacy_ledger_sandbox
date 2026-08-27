import React, { useState } from 'react';

interface Vault {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

const SinkingFunds: React.FC = () => {
  // Initializing with realistic short-term goals
  const [vaults] = useState<Vault[]>([
    { id: 'v1', name: 'Parental Spoil Fund', target: 200000, current: 45000, color: 'bg-purple-500' },
    { id: 'v2', name: 'Hardware Refresh', target: 150000, current: 150000, color: 'bg-blue-500' },
    { id: 'v3', name: 'Emergency Liquid', target: 300000, current: 120000, color: 'bg-[#10b981]' }
  ]);

  return (
    <div className="bg-[#181C28] border border-[#2C3E50] p-6 mt-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
            <span>🏦</span> Sinking Fund Vaults
          </h2>
          <p className="text-[#4A6572] text-sm mt-1">Short-term liquidity reserves</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vaults.map((vault) => {
          const progress = Math.min(100, (vault.current / vault.target) * 100);
          const isComplete = progress >= 100;

          return (
            <div key={vault.id} className="bg-[#0F1216] border border-[#2C3E50]/50 p-4 relative overflow-hidden">
              {/* Subtle background glow for completed vaults */}
              {isComplete && (
                <div className={`absolute -right-4 -top-4 w-16 h-16 ${vault.color} blur-2xl opacity-20`}></div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[#E2E8F0] font-medium text-xs uppercase tracking-widest z-10">
                  {vault.name}
                </h3>
                {isComplete && <span className="text-[#10b981] text-xs">✓</span>}
              </div>

              <div className="mb-4 z-10 relative">
                <div className="text-xl font-bold text-[#E2E8F0]">
                  ₹{vault.current.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#4A6572] uppercase tracking-widest mt-1">
                  of ₹{vault.target.toLocaleString('en-IN')} Goal
                </div>
              </div>

              <div className="relative h-1.5 w-full bg-[#181C28] rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${vault.color} transition-all duration-1000`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="mt-2 text-right text-[10px] text-[#4A6572] font-mono">
                {progress.toFixed(1)}% Funded
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SinkingFunds;