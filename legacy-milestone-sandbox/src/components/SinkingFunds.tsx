import React, { useState } from 'react';

interface Vault {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string; // YYYY-MM format
  color: string;
}

const SinkingFunds: React.FC = () => {
  // Initializing with the exact data from your screenshot, but adding the crucial 'targetDate' context
  const [vaults, setVaults] = useState<Vault[]>([
    { 
      id: '1', 
      name: 'Parental Spoil Fund', 
      currentAmount: 45000, 
      targetAmount: 200000, 
      targetDate: '2027-10', // Example future date
      color: 'bg-purple-500' 
    },
    { 
      id: '2', 
      name: 'Hardware Refresh', 
      currentAmount: 150000, 
      targetAmount: 150000, 
      targetDate: '2026-12', 
      color: 'bg-blue-500' 
    },
    { 
      id: '3', 
      name: 'Emergency Liquid', 
      currentAmount: 120000, 
      targetAmount: 300000, 
      targetDate: '2027-03', 
      color: 'bg-emerald-500' 
    }
  ]);

  // Helper function to calculate how many months are left until the target date
  const getMonthsRemaining = (targetDate: string) => {
    const now = new Date();
    const target = new Date(`${targetDate}-01`);
    const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] p-6">
      
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
          <span>🏦</span> Targeted Vaults (Sinking Funds)
        </h2>
        <p className="text-[#4A6572] text-sm mt-1">
          Predictable cash reserves for known future expenses.
        </p>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-[#2C3E50]/20 border border-[#2C3E50]/50 rounded p-4 mb-6 text-sm text-[#E2E8F0] leading-relaxed">
        <strong className="text-blue-400 font-semibold mb-1 block flex items-center gap-2">
          <span>💡</span> What is a Sinking Fund?
        </strong>
        <p className="text-[#4A6572]">
          Instead of relying on unpredictable stock market returns or credit cards for large, upcoming expenses, you "sink" a small amount of money into a dedicated cash vault every month. 
          For highly personal, non-negotiable goals—like securing the funds to properly take care of your parents—these vaults ensure the money is safe, liquid, and ready exactly when you need it.
        </p>
      </div>

      {/* Vaults Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vaults.map((vault) => {
          const percentage = Math.min(100, (vault.currentAmount / vault.targetAmount) * 100);
          const isFullyFunded = vault.currentAmount >= vault.targetAmount;
          const monthsLeft = getMonthsRemaining(vault.targetDate);
          
          // Calculate required monthly contribution
          const shortfall = vault.targetAmount - vault.currentAmount;
          const monthlyRequired = monthsLeft > 0 ? Math.ceil(shortfall / monthsLeft) : 0;

          return (
            <div key={vault.id} className={`bg-[#181C28] border p-5 transition-all duration-300 flex flex-col justify-between ${isFullyFunded ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-[#2C3E50]'}`}>
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[#E2E8F0] font-bold text-xs uppercase tracking-widest leading-tight pr-4">
                    {vault.name}
                  </h3>
                  {isFullyFunded && (
                    <span className="text-blue-400 text-sm" title="Fully Funded">✓</span>
                  )}
                </div>

                <div className="mb-1">
                  <span className="text-2xl font-bold text-[#E2E8F0]">
                    ₹{vault.currentAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#4A6572] mb-5">
                  of ₹{vault.targetAmount.toLocaleString('en-IN')} Goal
                </div>
              </div>

              <div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[#0F1216] rounded-full overflow-hidden border border-[#2C3E50]/50 mb-2">
                  <div 
                    className={`h-full ${vault.color} transition-all duration-1000`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#4A6572] uppercase tracking-widest font-mono mb-4">
                  <span>{percentage.toFixed(1)}% Funded</span>
                  {monthsLeft > 0 && (
                    <span>{monthsLeft} Months Left</span>
                  )}
                </div>

                {/* Actionable Insights */}
                <div className={`p-3 rounded text-xs border ${isFullyFunded ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-[#0F1216] border-[#2C3E50]/50 text-[#E2E8F0]'}`}>
                  {isFullyFunded ? (
                    <div className="flex flex-col">
                      <span className="font-semibold uppercase tracking-widest text-[10px] mb-1">Status: Ready</span>
                      <span>Target achieved. Funds are ready for deployment.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[#4A6572] uppercase tracking-widest text-[10px] mb-1">Action Required</span>
                      <span>Save <strong className={vault.color.replace('bg-', 'text-')}>₹{monthlyRequired.toLocaleString('en-IN')}/mo</strong> to hit your target on time.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SinkingFunds;