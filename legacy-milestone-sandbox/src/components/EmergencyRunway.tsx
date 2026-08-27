import React from 'react';

interface EmergencyRunwayProps {
  currentSavings: number;
  totalMonthlyExpenses: number;
}

const EmergencyRunway: React.FC<EmergencyRunwayProps> = ({ currentSavings, totalMonthlyExpenses }) => {
  const runwayMonths = totalMonthlyExpenses > 0 ? currentSavings / totalMonthlyExpenses : 0;
  const isHealthy = runwayMonths >= 6;

  return (
    <div className="bg-[#181C28] border border-[#2C3E50] p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
            <span>🛡️</span> Emergency Runway
          </h3>
          <p className="text-[#4A6572] text-xs mt-1">Survival time with zero income</p>
        </div>
        <div className={`text-2xl font-black italic ${isHealthy ? 'text-[#10b981]' : 'text-amber-500'}`}>
          {runwayMonths.toFixed(1)} <span className="text-sm font-normal text-[#4A6572] not-italic">mo</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#4A6572]">Liquid Cash</span>
          <span className="text-[#E2E8F0]">₹{currentSavings.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#4A6572]">Burn Rate</span>
          <span className="text-[#8B3A3A]">-₹{totalMonthlyExpenses.toLocaleString('en-IN')}/mo</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#2C3E50]/50 text-xs text-[#4A6572]">
        {isHealthy 
          ? "Your emergency fund is fully fortified (>6 months)." 
          : "Warning: Your runway is critically short. Consider boosting liquid reserves."}
      </div>
    </div>
  );
};

export default EmergencyRunway;