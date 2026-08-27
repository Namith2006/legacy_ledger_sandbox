import React, { useState } from 'react';
import type { CashFlowItem } from '../App';

interface StrategyEngineProps {
  currentSavings: number;
  availableCash: number;
  targetGoal: number;
  investments: CashFlowItem[];
  setInvestments: React.Dispatch<React.SetStateAction<CashFlowItem[]>>;
}

const StrategyEngine: React.FC<StrategyEngineProps> = ({ 
  currentSavings, 
  availableCash, 
  targetGoal,
  investments,
  setInvestments 
}) => {
  
  const getMonthlyEquivalent = (items: CashFlowItem[]) => items.reduce((sum, item) => sum + (item.frequency === 'annual' ? item.amount / 12 : item.amount), 0);
  const currentTotalInvestments = getMonthlyEquivalent(investments);
  const unallocatedCash = Math.max(0, availableCash - currentTotalInvestments);

  const calculateTimeline = (annualRate: number) => {
    // Goal already met
    if (targetGoal <= currentSavings) {
      return { years: 0, months: 0, totalMonths: 0, totalPrincipal: 0, estimatedInterest: 0, finalBalance: currentSavings, possible: true };
    }
    
    // Impossible (No cash available)
    if (currentSavings === 0 && availableCash <= 0) {
      return { years: 0, months: 0, totalMonths: 0, totalPrincipal: 0, estimatedInterest: 0, finalBalance: 0, possible: false };
    }

    let balance = currentSavings;
    let months = 0;
    const monthlyRate = annualRate / 100 / 12;
    let totalPrincipal = 0;

    while (balance < targetGoal) {
      balance += availableCash;
      totalPrincipal += availableCash;
      balance += balance * monthlyRate;
      months++;
      
      // Impossible (Takes over 50 years)
      if (months > 600) {
        return { years: 0, months: 0, totalMonths: 0, totalPrincipal: 0, estimatedInterest: 0, finalBalance: 0, possible: false };
      }
    }

    // Success!
    return {
      years: Math.floor(months / 12),
      months: months % 12,
      totalMonths: months,
      totalPrincipal,
      estimatedInterest: balance - currentSavings - totalPrincipal,
      finalBalance: balance,
      possible: true
    };
  };

  const strategies = [
    { 
      name: "Safe & Steady", 
      rate: 8, 
      desc: "FDs & Debt Funds", 
      color: "border-blue-500/50 text-blue-400 hover:bg-blue-500/10", 
      assetClass: "debt",
      details: "This strategy prioritizes capital preservation above all else. By allocating funds into Fixed Deposits, Provident Funds, and high-grade Debt Mutual Funds, you are protecting your wealth from market volatility. The stoic trade-off: you accept slower growth in exchange for absolute peace of mind.",
      instruments: [
        "Public Provident Fund (PPF) via your primary bank (Guaranteed tax-free returns)",
        "High-Yield Fixed Deposits via top-tier banks (HDFC, SBI, ICICI)",
        "Target Maturity Debt Mutual Funds (e.g., Bharat Bond ETF)",
        "RBI Retail Direct portal for Government Treasury Bills (T-Bills)"
      ],
      pros: ["Zero to very low volatility", "Guaranteed or highly predictable returns", "Zero anxiety during stock market crashes"],
      cons: ["Barely beats inflation", "Wealth accumulation is strictly linear, not exponential"]
    },
    { 
      name: "Balanced", 
      rate: 12, 
      desc: "Nifty 50 Index Funds", 
      color: "border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/10", 
      assetClass: "equity",
      details: "This is the pragmatic middle path. By investing in Broad Market Index Funds (like the Nifty 50), you are betting on the long-term growth of the entire economy. You do not try to beat the market; you simply become the market.",
      instruments: [
        "UTI Nifty 50 Index Fund (Direct Growth) via platforms like Zerodha Coin or Groww",
        "Navi Nifty 50 Index Fund (Known for extremely low expense ratios)",
        "NiftyBeES Exchange Traded Fund (ETF) bought directly via a Demat account",
        "Parag Parikh Flexi Cap Fund (For globally diversified, balanced equity exposure)"
      ],
      pros: ["Historically proven to outpace inflation", "Low management fees (Expense Ratios)", "No need to pick individual stocks"],
      cons: ["Requires discipline to hold during 10-20% market corrections", "Moderate short-term volatility"]
    },
    { 
      name: "Aggressive", 
      rate: 15, 
      desc: "Small Cap / High Growth", 
      color: "border-amber-500/50 text-amber-400 hover:bg-amber-500/10", 
      assetClass: "equity",
      details: "This strategy is designed for aggressive wealth acceleration. By targeting Small-Cap Funds, Mid-Cap Funds, and direct growth equities, you are seeking alpha. This requires extreme emotional control—you must be prepared to see your portfolio temporarily drop by 30-40% during bear markets without panicking.",
      instruments: [
        "Quant Small Cap Fund (Direct Growth) - High momentum, aggressive rebalancing",
        "Nippon India Small Cap Fund (Direct Growth) - Large AUM, proven track record",
        "Motilal Oswal Midcap Fund (Direct Growth) - High-conviction mid-sized companies",
        "Direct equity investing in fundamentally strong small-cap stocks via Demat"
      ],
      pros: ["Highest potential for massive compounding", "Can shave decades off your retirement timeline"],
      cons: ["Extreme volatility", "High psychological tax during market downturns", "Higher risk of prolonged stagnation if timed poorly"]
    }
  ];

  const [selectedStrategy, setSelectedStrategy] = useState<typeof strategies[0] | null>(null);

  const applyStrategy = () => {
    if (!selectedStrategy) return;

    if (availableCash <= 0) {
      alert("❌ You have no available cash flow! Reduce your expenses first.");
      return;
    }

    if (unallocatedCash <= 0) {
      alert("⚠️ You have already allocated 100% of your available cash into existing investments! Remove or reduce an existing investment on the left to free up cash for this strategy.");
      return;
    }

    const newSip: CashFlowItem = {
      id: Date.now().toString(),
      name: `${selectedStrategy.name} Auto-SIP (${selectedStrategy.rate}%)`,
      amount: Math.round(unallocatedCash),
      frequency: 'monthly',
      assetClass: selectedStrategy.assetClass as 'equity' | 'debt' | 'gold' | 'liquid'
    };

    setInvestments(prev => {
      const cleanInvestments = prev.filter(inv => !inv.name.includes('Auto-SIP'));
      return [...cleanInvestments, newSip];
    });

    setSelectedStrategy(null);
  };

  if (targetGoal === 0) return null;

  return (
    <>
      <div className="bg-[#0F1216] border border-[#2C3E50] p-6 mt-6 relative">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide">Time-to-Target Analysis</h2>
            <p className="text-[#4A6572] text-sm mt-1">
              Select a strategy below to view a detailed execution plan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategies.map((strat) => {
            const timeline = calculateTimeline(strat.rate);
            
            return (
              <div 
                key={strat.name} 
                onClick={() => timeline.possible && setSelectedStrategy(strat)}
                className={`bg-[#181C28] border ${strat.color} p-4 flex flex-col justify-between group transition-all duration-200 
                  ${timeline.possible ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#E2E8F0] font-medium">{strat.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 bg-[#0F1216] border ${strat.color}`}>
                      {strat.rate}% CAGR
                    </span>
                  </div>
                  <p className="text-[#4A6572] text-xs mb-4">{strat.desc}</p>
                </div>
                
                <div className="pt-4 border-t border-[#2C3E50] flex justify-between items-end">
                  {timeline.possible ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#E2E8F0]">{timeline.years}</span>
                        <span className="text-[#4A6572] text-sm">yrs</span>
                        {timeline.months > 0 && (
                          <>
                            <span className="text-xl font-bold text-[#E2E8F0] ml-2">{timeline.months}</span>
                            <span className="text-[#4A6572] text-sm">mos</span>
                          </>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs tracking-wider uppercase font-semibold text-right">
                        View Plan
                      </div>
                    </>
                  ) : (
                    <span className="text-[#8B3A3A] text-sm font-semibold">Insufficient Cash</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- DETAILED ELABORATION MODAL --- */}
      {selectedStrategy && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`bg-[#0F1216] border ${selectedStrategy.color.split(' ')[0]} p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
            <button onClick={() => setSelectedStrategy(null)} className="absolute top-4 right-4 text-[#4A6572] hover:text-[#E2E8F0] transition-colors">✕</button>
            
            <div className="mb-6 border-b border-[#2C3E50] pb-4">
              <h2 className="text-2xl font-light text-[#E2E8F0] uppercase tracking-widest">{selectedStrategy.name} Protocol</h2>
              <p className={`text-sm mt-1 ${selectedStrategy.color.split(' ')[1]}`}>
                Projected Growth: {selectedStrategy.rate}% CAGR | Asset Class: {selectedStrategy.assetClass.toUpperCase()}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[#E2E8F0] text-xs uppercase tracking-widest font-semibold mb-2">Strategy Overview</h3>
                <p className="text-[#4A6572] text-sm leading-relaxed">{selectedStrategy.details}</p>
              </div>

              {/* --- ACTIONABLE INSTRUMENTS (WHERE TO INVEST) --- */}
              <div className="bg-[#181C28] border border-[#2C3E50]/50 p-4">
                <h3 className="text-[#E2E8F0] text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center bg-[#2C3E50] text-[#E2E8F0] rounded-full text-[10px]">📍</span> 
                  Where to Invest
                </h3>
                <ul className="space-y-3">
                  {selectedStrategy.instruments.map((instrument, i) => (
                    <li key={i} className="text-[#E2E8F0] text-sm flex items-start gap-3 bg-[#0F1216] p-3 border border-[#2C3E50]/30 rounded-sm">
                      <span className={`mt-0.5 ${selectedStrategy.color.split(' ')[1]}`}>⬢</span> 
                      <span className="leading-snug">{instrument}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* --- CAPITAL ALLOTMENT & PREDICTION --- */}
              {(() => {
                const tl = calculateTimeline(selectedStrategy.rate);
                const principalPercent = ((tl.totalPrincipal + currentSavings) / tl.finalBalance) * 100;
                const marketPercent = (tl.estimatedInterest / tl.finalBalance) * 100;

                return (
                  <div className="bg-[#181C28] border border-[#2C3E50]/50 p-4">
                    <h3 className="text-[#E2E8F0] text-xs uppercase tracking-widest font-semibold mb-4">Capital Allotment & Prediction</h3>
                    
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#4A6572]">Base Starting Capital</span>
                        <span className="text-[#E2E8F0]">₹{currentSavings.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4A6572]">Monthly Allotment (₹{availableCash.toLocaleString('en-IN')} × {tl.totalMonths} mos)</span>
                        <span className="text-[#E2E8F0]">+ ₹{tl.totalPrincipal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[#10b981]">
                        <span>Predicted Market Growth ({selectedStrategy.rate}%)</span>
                        <span>+ ₹{Math.round(tl.estimatedInterest).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="pt-3 border-t border-[#2C3E50] flex justify-between font-bold text-[#E2E8F0]">
                        <span>Projected Final Wealth</span>
                        <span>₹{Math.round(tl.finalBalance).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-[#0F1216] border border-[#2C3E50]/50 text-xs text-[#4A6572] leading-relaxed">
                      <strong className="text-[#E2E8F0]">Prediction Analysis:</strong> By dedicating your cash flow into this protocol, only 
                      <span className="text-[#E2E8F0]"> {Math.round(principalPercent)}%</span> of your final wealth will come from your actual wallet. 
                      The remaining <span className="text-[#10b981] font-semibold">{Math.round(marketPercent)}%</span> is generated entirely by the 
                      market compounding your money over the next {tl.years} years.
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181C28] p-4 border border-[#2C3E50]/50">
                  <h3 className="text-[#10b981] text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {selectedStrategy.pros.map((pro, i) => (
                      <li key={i} className="text-[#E2E8F0] text-sm flex items-start gap-2">
                        <span className="text-[#4A6572] mt-0.5">▹</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#181C28] p-4 border border-[#2C3E50]/50">
                  <h3 className="text-[#8B3A3A] text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8B3A3A]"></span> Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {selectedStrategy.cons.map((con, i) => (
                      <li key={i} className="text-[#E2E8F0] text-sm flex items-start gap-2">
                        <span className="text-[#4A6572] mt-0.5">▹</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#181C28] border border-[#2C3E50] p-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-[#E2E8F0] text-sm font-semibold tracking-wide">Execution Ready</h3>
                    <p className="text-[#4A6572] text-xs mt-1">Deploy ₹{unallocatedCash.toLocaleString('en-IN')} unallocated cash into this protocol.</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const tl = calculateTimeline(selectedStrategy.rate);
                      return (
                        <div className="text-[#E2E8F0] font-bold text-xl">
                          {tl.years}y {tl.months > 0 && `${tl.months}m`}
                        </div>
                      );
                    })()}
                    <div className="text-[#4A6572] text-[10px] uppercase tracking-widest">Time to Target</div>
                  </div>
                </div>
                
                <button 
                  onClick={applyStrategy}
                  className={`w-full p-3 text-xs uppercase tracking-widest font-semibold transition-colors border ${selectedStrategy.color.split(' ')[0]} ${selectedStrategy.color.split(' ')[1]} hover:bg-[#2C3E50]/50`}
                >
                  Execute Strategy & Setup Auto-SIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StrategyEngine;