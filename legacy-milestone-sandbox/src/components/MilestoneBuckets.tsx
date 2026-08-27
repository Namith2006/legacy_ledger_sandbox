import React from 'react';
import type { Milestone } from '../App';

interface MilestoneBucketsProps {
  currentSavings: number;
  milestones: Milestone[];
}

const MilestoneBuckets: React.FC<MilestoneBucketsProps> = ({ currentSavings, milestones }) => {
  // We use a waterfall calculation: money fills the first bucket, 
  // and whatever is left spills over into the next one.
  let remainingSavings = currentSavings;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] p-6 mt-6">
      <div className="mb-6">
        <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide">Targeted Milestone Buckets</h2>
        <p className="text-[#4A6572] text-sm mt-1">
          Your current wealth cascades into your goals sequentially.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {milestones.length === 0 ? (
          <p className="text-[#4A6572] text-sm italic col-span-2">No milestones set. Add one in the controls.</p>
        ) : (
          milestones.map((milestone) => {
            // Calculate how much cash goes into this specific bucket
            const allocated = Math.min(remainingSavings, milestone.target);
            const progress = milestone.target > 0 ? (allocated / milestone.target) * 100 : 0;
            const isComplete = progress >= 100;
            
            // Deduct the cash used to fill this bucket from the total
            remainingSavings = Math.max(0, remainingSavings - milestone.target);

            return (
              <div key={milestone.id} className="bg-[#181C28] border border-[#2C3E50] p-4 flex flex-col gap-3 group hover:border-[#4A6572] transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]' : (progress > 0 ? 'bg-amber-500 animate-pulse' : 'bg-gray-700')}`}></span>
                    <h3 className="text-[#E2E8F0] font-medium truncate max-w-[200px]" title={milestone.name}>
                      {milestone.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[#E2E8F0] font-bold text-sm">₹{allocated.toLocaleString('en-IN')}</span>
                    <span className="text-[#4A6572] text-xs"> / {milestone.target >= 100000 ? `${milestone.target / 100000}L` : milestone.target}</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-[#0F1216] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isComplete ? 'bg-[#10b981]' : 'bg-amber-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#4A6572]">
                  <span>{isComplete ? 'Fully Secured' : (progress > 0 ? 'Funding in Progress' : 'Awaiting Spillover')}</span>
                  <span className={isComplete ? 'text-[#10b981]' : 'text-[#E2E8F0]'}>{progress.toFixed(1)}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MilestoneBuckets;