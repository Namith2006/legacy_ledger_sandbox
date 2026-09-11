import React, { useState, useMemo } from 'react';

// Using the same Milestone interface from your App
export interface Milestone {
  id: string;
  name: string;
  target: number;
}

interface MilestoneBucketsProps {
  currentSavings: number;
  finalWealth?: number;
  milestones: Milestone[];
}

type PriorityLevel = 'High' | 'Medium' | 'Low';

const MilestoneBuckets: React.FC<MilestoneBucketsProps> = ({ currentSavings, finalWealth = currentSavings, milestones }) => {
  // Allow users to set priority for each goal. Defaulting to 'Medium' for new goals.
  const [priorities, setPriorities] = useState<Record<string, PriorityLevel>>(() => {
    const initial: Record<string, PriorityLevel> = {};
    milestones.forEach((m, idx) => {
      initial[m.id] = idx === 0 ? 'High' : 'Medium'; 
    });
    return initial;
  });

  const handlePriorityChange = (id: string, level: PriorityLevel) => {
    setPriorities(prev => ({ ...prev, [id]: level }));
  };

  // The pool now calculates Current Savings + Future Annual Profits & Investments
  const totalPool = finalWealth;
  const projectedGrowth = Math.max(0, finalWealth - currentSavings);

  const allocation = useMemo(() => {
    let remainingPool = totalPool;
    const alloc: Record<string, number> = {};

    const groups: Record<PriorityLevel, Milestone[]> = { High: [], Medium: [], Low: [] };
    
    milestones.forEach(m => {
      groups[priorities[m.id] || 'Medium'].push(m);
    });

    const processGroup = (level: PriorityLevel) => {
      const group = groups[level];
      const targetSum = group.reduce((sum, m) => sum + m.target, 0);

      if (targetSum === 0) return;

      if (remainingPool >= targetSum) {
        // We have enough to fully fund every goal in this priority bracket
        group.forEach(m => { alloc[m.id] = m.target; });
        remainingPool -= targetSum;
      } else {
        // We don't have enough, so we distribute the remaining pool proportionally based on goal size
        group.forEach(m => {
          const weight = m.target / targetSum;
          alloc[m.id] = remainingPool * weight;
        });
        remainingPool = 0;
      }
    };

    // Strict Allocation Order
    processGroup('High');
    processGroup('Medium');
    processGroup('Low');

    return alloc;
  }, [milestones, priorities, totalPool]);

  // Sort the UI so High priority goals visually cascade down to Low priority goals
  const sortedMilestones = [...milestones].sort((a, b) => {
    const ranks = { High: 1, Medium: 2, Low: 3 };
    return ranks[priorities[a.id] || 'Medium'] - ranks[priorities[b.id] || 'Medium'];
  });

  if (milestones.length === 0) return null;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
            <span>🎯</span> Priority-Based Goal Allocation
          </h2>
          <p className="text-[#4A6572] text-sm mt-1">
            Your projected wealth (including future investments and annual profits) is allocated intelligently based on goal priority.
          </p>
        </div>
      </div>
      
      {/* Pool Breakdown Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-[#181C28] border border-[#2C3E50]/50 p-4 rounded flex flex-col justify-center">
           <span className="text-[10px] text-[#4A6572] uppercase tracking-widest mb-1">Current Liquid Savings</span>
           <span className="text-xl font-mono text-[#E2E8F0]">₹{Math.round(currentSavings).toLocaleString('en-IN')}</span>
         </div>
         <div className="bg-[#181C28] border border-[#2C3E50]/50 p-4 rounded flex flex-col justify-center relative overflow-hidden">
           <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 rounded-bl-full blur-xl"></div>
           <span className="text-[10px] text-[#4A6572] uppercase tracking-widest mb-1">Projected Annual Growth</span>
           <span className="text-xl font-mono text-blue-400">+₹{Math.round(projectedGrowth).toLocaleString('en-IN')}</span>
         </div>
         <div className="bg-[#181C28] border border-[#10b981]/30 p-4 rounded flex flex-col justify-center shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden">
           <div className="absolute right-0 top-0 w-24 h-24 bg-[#10b981]/10 rounded-bl-full blur-xl"></div>
           <span className="text-[10px] text-[#10b981] uppercase tracking-widest mb-1">Total Future Pool</span>
           <span className="text-2xl font-bold font-mono text-[#10b981]">₹{Math.round(totalPool).toLocaleString('en-IN')}</span>
         </div>
      </div>

      <div className="space-y-4">
         {sortedMilestones.map(m => {
           const allocAmount = allocation[m.id] || 0;
           const pct = Math.min(100, (allocAmount / m.target) * 100);
           const isFunded = allocAmount >= m.target;
           const priority = priorities[m.id] || 'Medium';
           
           const pBg = priority === 'High' ? 'bg-[#10b981]' : (priority === 'Medium' ? 'bg-blue-500' : 'bg-purple-500');

           return (
             <div key={m.id} className={`bg-[#181C28] border p-5 transition-all duration-300 ${isFunded ? 'border-[#10b981]/50 shadow-[0_0_10px_rgba(16,185,129,0.05)]' : 'border-[#2C3E50]'}`}>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                   <div>
                     <h3 className="text-[#E2E8F0] font-bold text-sm tracking-wide flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${pBg} shadow-[0_0_8px_currentColor]`}></span> {m.name}
                     </h3>
                     <div className="text-[10px] text-[#4A6572] uppercase tracking-widest mt-1">
                       Target Requirement: ₹{m.target.toLocaleString('en-IN')}
                     </div>
                   </div>
                   
                   {/* Priority Selector Tabs */}
                   <div className="flex bg-[#0F1216] rounded border border-[#2C3E50]/50 p-1">
                      {(['High', 'Medium', 'Low'] as PriorityLevel[]).map(level => (
                         <button 
                           key={level} 
                           onClick={() => handlePriorityChange(m.id, level)}
                           className={`text-[10px] uppercase tracking-widest px-4 py-1.5 rounded transition-all duration-200 ${priority === level ? (level === 'High' ? 'bg-[#10b981]/20 text-[#10b981] font-bold' : level === 'Medium' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'bg-purple-500/20 text-purple-400 font-bold') : 'text-[#4A6572] hover:text-[#E2E8F0]'}`}
                         >
                           {level}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="flex justify-between items-end mb-2">
                   <span className={`text-xl font-bold font-mono ${isFunded ? 'text-[#10b981]' : 'text-[#E2E8F0]'}`}>
                     ₹{Math.round(allocAmount).toLocaleString('en-IN')}
                   </span>
                   <span className="text-[10px] text-[#4A6572] uppercase tracking-widest font-mono">
                     {pct.toFixed(1)}% Secured
                   </span>
                </div>

                <div className="h-1.5 w-full bg-[#0F1216] rounded-full overflow-hidden border border-[#2C3E50]/50">
                   <div 
                     className={`h-full ${pBg} transition-all duration-1000`} 
                     style={{ width: `${pct}%` }}
                   ></div>
                </div>
             </div>
           )
         })}
      </div>
    </div>
  );
};

export default MilestoneBuckets;