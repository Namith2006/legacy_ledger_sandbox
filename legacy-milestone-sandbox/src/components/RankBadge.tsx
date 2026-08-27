import React from 'react';

interface RankBadgeProps {
  currentSavings: number;
  availableCash: number;
  monthlyIncome: number;
}

const RankBadge: React.FC<RankBadgeProps> = ({ currentSavings, availableCash, monthlyIncome }) => {
  // Calculate savings rate (Cash left over vs Total Income)
  const savingsRate = monthlyIncome > 0 ? (availableCash / monthlyIncome) * 100 : 0;

  // Dynamic Rank Logic
  let rank = 'E';
  let title = 'Novice Earner';
  let color = 'text-gray-400 border-gray-400/50 shadow-gray-400/20';

  if (currentSavings >= 5000000) {
    rank = 'S'; title = 'National Level'; color = 'text-purple-500 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
  } else if (currentSavings >= 2500000) {
    rank = 'A'; title = 'Elite Wealth Builder'; color = 'text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
  } else if (currentSavings >= 1000000) {
    rank = 'B'; title = 'Veteran Saver'; color = 'text-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
  } else if (currentSavings >= 500000) {
    rank = 'C'; title = 'Adept Investor'; color = 'text-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
  } else if (currentSavings >= 100000 || savingsRate > 20) {
    rank = 'D'; title = 'Apprentice'; color = 'text-[#10b981] border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.4)]';
  }

  return (
    <div className="flex items-center gap-4 bg-[#181C28] border border-[#2C3E50] p-4 mb-6">
      <div className={`w-16 h-16 shrink-0 flex items-center justify-center border-2 bg-[#0F1216] rounded-sm text-3xl font-black italic ${color}`}>
        {rank}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#4A6572] mb-1">Current Status</div>
            <div className={`text-sm font-bold tracking-widest uppercase ${color.split(' ')[0]}`}>{title}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-[#4A6572] mb-1">Discipline</div>
            <div className={`text-sm font-bold tracking-wider ${savingsRate >= 20 ? 'text-[#10b981]' : 'text-amber-500'}`}>
              {savingsRate.toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* XP Bar to next rank */}
        <div className="mt-3 h-1 w-full bg-[#0F1216] rounded-full overflow-hidden">
          <div 
            className={`h-full ${color.split(' ')[0].replace('text', 'bg')}`} 
            style={{ width: `${Math.min(100, savingsRate)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default RankBadge;