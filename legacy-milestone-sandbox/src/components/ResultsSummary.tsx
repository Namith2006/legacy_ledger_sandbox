import React from 'react';

interface ResultsSummaryProps {
  currentSavings: number;
  lifetimeInvested: number;
  lifetimeIncome: number;
  finalWealth: number;
  targetYear: string;
  totalExpenses?: number;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  lifetimeInvested,
  lifetimeIncome,
  finalWealth,
  targetYear
}) => {
  
  // THE FIX: Calculate deterministic total returns here without protective Math.max bounds
  const totalReturns = finalWealth - lifetimeInvested;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0F1216] border border-[#2C3E50] p-6 flex flex-col justify-center items-center text-center shadow-sm">
          <span className="text-[10px] text-[#4A6572] uppercase tracking-widest block mb-3 font-sans">
            10-Year Final Wealth
          </span>
          <span className="text-3xl font-mono text-[#E2E8F0] mb-3">
            ₹{Math.round(finalWealth).toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-[#4A6572] uppercase tracking-widest hover:text-[#E2E8F0] cursor-pointer transition-colors">
            View Breakdown →
          </span>
        </div>
        
        <div className="bg-[#0F1216] border border-[#2C3E50] p-6 flex flex-col justify-center items-center text-center shadow-sm">
          <span className="text-[10px] text-[#4A6572] uppercase tracking-widest block mb-3 font-sans">
            Target Milestone Reached
          </span>
          <span className="text-2xl font-sans text-[#E2E8F0]">
            {targetYear}
          </span>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F1216] border border-[#2C3E50] p-5 flex flex-col justify-center items-center text-center shadow-sm">
          <span className="text-[10px] text-[#4A6572] uppercase tracking-widest block mb-3 font-sans">
            10-Yr Total Income
          </span>
          <span className="text-xl font-mono text-[#E2E8F0]">
            ₹{Math.round(lifetimeIncome).toLocaleString('en-IN')}
          </span>
        </div>
        
        <div className="bg-[#0F1216] border border-[#2C3E50] p-5 flex flex-col justify-center items-center text-center shadow-sm">
          <span className="text-[10px] text-[#4A6572] uppercase tracking-widest block mb-3 font-sans">
            10-Yr Total Invested
          </span>
          <span className="text-xl font-mono text-[#E2E8F0]">
            ₹{Math.round(lifetimeInvested).toLocaleString('en-IN')}
          </span>
        </div>
        
        <div className="bg-[#0F1216] border border-[#2C3E50] p-5 flex flex-col justify-center items-center text-center shadow-sm">
          <span className="text-[10px] text-[#4A6572] uppercase tracking-widest block mb-3 font-sans">
            10-Yr Total Returns
          </span>
          <span className={`text-xl font-mono ${totalReturns < 0 ? 'text-[#8B3A3A]' : 'text-[#10b981]'}`}>
            {totalReturns < 0 ? '-' : '+'}₹{Math.abs(Math.round(totalReturns)).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary;