import React, { useState, useEffect } from 'react';

interface Vault {
  id: string;
  name: string;
  target: number;
  current: number;
  deadlineMonths: number;
}

const SinkingFunds: React.FC = () => {
  // Load initial state from LocalStorage so your adjustments persist
  const [vaults, setVaults] = useState<Vault[]>(() => {
    const saved = localStorage.getItem('legacyMilestone_vaults');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Parental Spoil Fund', target: 200000, current: 45000, deadlineMonths: 13 },
      { id: '2', name: 'Hardware Refresh', target: 150000, current: 150000, deadlineMonths: 3 },
      { id: '3', name: 'Emergency Liquid', target: 300000, current: 120000, deadlineMonths: 6 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('legacyMilestone_vaults', JSON.stringify(vaults));
  }, [vaults]);

  // Handle deposits or emergency withdrawals
  const handleUpdateBalance = (id: string, newBalance: number) => {
    setVaults(vaults.map(v => v.id === id ? { ...v, current: Math.max(0, newBalance) } : v));
  };

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] overflow-hidden mt-8">
      <div className="p-6 border-b border-[#2C3E50] bg-[#181C28]">
        <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-2">
          <span>💡</span> Liquid Sinking Funds
        </h3>
        <p className="text-[#4A6572] text-[11px] leading-relaxed">
          Instead of relying on unpredictable stock market returns for large, upcoming expenses, "sink" money into dedicated cash vaults. 
          Use the <strong>Adjust Balance</strong> inputs below to record deposits or log emergency cash withdrawals.
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {vaults.map((vault) => {
          const isComplete = vault.current >= vault.target;
          const percentage = Math.min(100, (vault.current / vault.target) * 100);
          const remaining = Math.max(0, vault.target - vault.current);
          const requiredPerMonth = vault.deadlineMonths > 0 ? remaining / vault.deadlineMonths : 0;

          // Determine specific colors based on status and ID
          let themeColor = 'bg-blue-500';
          let textColor = 'text-blue-400';
          if (isComplete) {
            themeColor = 'bg-blue-600';
            textColor = 'text-blue-400';
          } else if (vault.id === '1') {
            themeColor = 'bg-purple-500';
            textColor = 'text-purple-400';
          } else if (vault.id === '3') {
            themeColor = 'bg-[#10b981]';
            textColor = 'text-[#10b981]';
          }

          return (
            <div key={vault.id} className="bg-[#181C28] border border-[#2C3E50] p-5 flex flex-col justify-between transition-all">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-[#E2E8F0] font-bold text-[10px] uppercase tracking-widest">
                    {vault.name}
                  </h4>
                  {isComplete && <span className="text-blue-400 text-sm">✓</span>}
                </div>

                <div className="mb-1">
                  <span className="text-2xl font-bold text-[#E2E8F0] font-mono">
                    ₹{vault.current.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[9px] text-[#4A6572] uppercase tracking-widest font-mono mb-4">
                  Of ₹{vault.target.toLocaleString('en-IN')} Goal
                </div>

                {/* Interactive Balance Adjustment */}
                <div className="flex gap-2 items-center mb-5 bg-[#0F1216] p-2 border border-[#2C3E50]/50 rounded">
                  <span className="text-[9px] text-[#4A6572] uppercase tracking-widest">Adjust Balance:</span>
                  <input
                    type="number"
                    value={vault.current || ''}
                    onChange={(e) => handleUpdateBalance(vault.id, Number(e.target.value))}
                    className="bg-transparent text-[#E2E8F0] font-mono text-xs focus:outline-none w-full border-b border-[#4A6572] focus:border-[#10b981] transition-colors pb-1"
                    placeholder="Enter current cash"
                  />
                </div>

                <div className="w-full h-1 bg-[#0F1216] rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full ${themeColor} transition-all duration-500 ease-out`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[9px] text-[#4A6572] uppercase tracking-widest font-mono">
                  <span>{percentage.toFixed(1)}% Funded</span>
                  <span>{vault.deadlineMonths} Months Left</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#2C3E50]/40">
                {isComplete ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded">
                    <span className="text-blue-400 text-[9px] font-bold uppercase tracking-widest block mb-1">
                      Status: Ready
                    </span>
                    <span className="text-blue-400/80 text-xs">
                      Target achieved. Funds are ready for deployment.
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#0F1216] p-2.5 rounded border border-[#2C3E50]/50">
                    <span className="text-[#4A6572] text-[9px] uppercase tracking-widest block mb-1">
                      Action Required
                    </span>
                    <span className="text-[#E2E8F0] text-xs">
                      Save <strong className={textColor}>₹{Math.round(requiredPerMonth).toLocaleString('en-IN')}/mo</strong> to hit your target on time.
                    </span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SinkingFunds;