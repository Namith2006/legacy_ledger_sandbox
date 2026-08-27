import React from 'react';

interface FireTrackerProps {
  currentSavings: number;
  totalMonthlyExpenses: number;
}

const FireTracker: React.FC<FireTrackerProps> = ({ currentSavings, totalMonthlyExpenses }) => {
  const annualExpenses = totalMonthlyExpenses * 12;
  
  // Adapted multipliers for Indian inflation & retirement horizons
  const leanFire = annualExpenses * 25; 
  const standardFire = annualExpenses * 33; 
  const fatFire = annualExpenses * 50; 

  const progress = standardFire > 0 ? (currentSavings / standardFire) * 100 : 0;

  return (
    <div className="bg-[#181C28] border border-[#2C3E50] p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
            <span>🔥</span> F.I.R.E. Engine
          </h3>
          <p className="text-[#4A6572] text-xs mt-1">Financial Independence Tracker</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-[#E2E8F0]">{progress.toFixed(1)}%</div>
          <div className="text-[10px] text-[#10b981] uppercase tracking-widest mt-1">to Standard</div>
        </div>
      </div>

      <div className="relative h-2 w-full bg-[#0F1216] rounded-full overflow-hidden mb-6 mt-2">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-[#10b981] transition-all duration-1000"
          style={{ width: `${Math.min(100, progress)}%` }}
        ></div>
        {/* Progress Marker Line */}
        <div className="absolute top-0 left-[75%] w-[1px] h-full bg-[#2C3E50]"></div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs font-mono items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
            <span className="text-[#4A6572]">Lean (25x)</span>
          </div>
          <span className={currentSavings >= leanFire ? "text-[#10b981]" : "text-[#E2E8F0]"}>
            ₹{leanFire.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-xs font-mono items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[#4A6572]">Standard (33x)</span>
          </div>
          <span className={currentSavings >= standardFire ? "text-[#10b981]" : "text-[#E2E8F0]"}>
            ₹{standardFire.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-xs font-mono items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span className="text-[#4A6572]">Fat (50x)</span>
          </div>
          <span className={currentSavings >= fatFire ? "text-[#10b981]" : "text-[#E2E8F0]"}>
            ₹{fatFire.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FireTracker;