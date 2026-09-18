import React, { useState, useMemo } from 'react';
import type { CashFlowItem, AssetClass } from '../App';

interface StrategyEngineProps {
  currentSavings: number;
  availableCash: number;
  targetGoal: number;
  investments: CashFlowItem[];
  setInvestments: (val: CashFlowItem[]) => void;
}

interface Allocation {
  class: AssetClass;
  name: string;
  share: number;
}

interface Strategy {
  id: string;
  name: string;
  cagr: number;
  allocations: Allocation[];
  strengths: string[];
  weaknesses: string[];
}

const strategies: Strategy[] = [
  {
    id: 'aggressive',
    name: 'Aggressive Growth (12.5%)',
    cagr: 12.5,
    allocations: [
      { class: 'equity', name: 'Nifty 50 Index Fund', share: 0.70 },
      { class: 'equity', name: 'Small/Midcap Equity', share: 0.15 },
      { class: 'debt', name: 'PPF / EPF', share: 0.15 }
    ],
    strengths: ['Maximum long-term wealth generation', 'Significantly beats 6% inflation', 'Exponential compounding curve'],
    weaknesses: ['High short-term portfolio volatility', 'Requires strong discipline during market crashes']
  },
  {
    id: 'balanced',
    name: 'Balanced Wealth (10.0%)',
    cagr: 10.0,
    allocations: [
      { class: 'equity', name: 'Nifty 50 Index Fund', share: 0.50 },
      { class: 'debt', name: 'Target Maturity Debt Funds', share: 0.30 },
      { class: 'gold', name: 'Sovereign Gold Bonds (SGB)', share: 0.20 }
    ],
    strengths: ['Smoother ride during stock market dips', 'Gold acts as a currency hedge', 'Steady, predictable compounding'],
    weaknesses: ['Leaves potential equity profits on the table', 'Moderate lock-in periods for SGBs']
  },
  {
    id: 'conservative',
    name: 'Capital Preservation (7.5%)',
    cagr: 7.5,
    allocations: [
      { class: 'debt', name: 'Govt Treasury Bills (T-Bills)', share: 0.70 },
      { class: 'gold', name: 'Physical / Digital Gold', share: 0.15 },
      { class: 'equity', name: 'Large Cap Bluechip Fund', share: 0.15 }
    ],
    strengths: ['Zero to very low volatility', 'Guaranteed or highly predictable returns', 'Zero anxiety during stock market crashes'],
    weaknesses: ['Barely beats inflation', 'Wealth accumulation is strictly linear, not exponential']
  }
];

const StrategyEngine: React.FC<StrategyEngineProps> = ({ currentSavings, availableCash, targetGoal, investments, setInvestments }) => {
  const [activeStrategyIndex, setActiveStrategyIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  const strategy = strategies[activeStrategyIndex];

  const currentMonthlyInvested = investments.reduce((sum, inv) => sum + (inv.frequency === 'annual' ? inv.amount / 12 : inv.amount), 0);
  const totalDeployablePool = availableCash + currentMonthlyInvested;

  const { months, balance, marketGrowth, principalAdded, walletPct, marketPct } = useMemo(() => {
    let m = 0;
    let b = currentSavings;
    const r = (strategy.cagr / 100) / 12;
    const pmt = totalDeployablePool;
    
    if (targetGoal > currentSavings && pmt > 0) {
      while (b < targetGoal && m < 600) {
        b = b * (1 + r) + pmt;
        m++;
      }
    } else {
      m = 120; // Default to 10-year view if no goal set
      for(let i = 0; i < m; i++) {
         b = b * (1 + r) + pmt;
      }
    }

    const added = pmt * m;
    const growth = b - currentSavings - added;
    const mPct = b > 0 ? (growth / b) * 100 : 0;
    const wPct = 100 - mPct;

    return { months: m, balance: b, marketGrowth: growth, principalAdded: added, walletPct: wPct, marketPct: mPct };
  }, [currentSavings, strategy.cagr, totalDeployablePool, targetGoal]);

  const y = Math.floor(months / 12);
  const m = months % 12;

  const newAllocations = strategy.allocations.map(alloc => ({
    name: alloc.name,
    class: alloc.class,
    amount: Math.round(totalDeployablePool * alloc.share)
  })).filter(a => a.amount > 0);

  const confirmExecution = () => {
    const newInvestments: CashFlowItem[] = newAllocations.map((alloc, idx) => ({
      id: `strat-${Date.now()}-${idx}`,
      name: alloc.name,
      amount: alloc.amount,
      frequency: 'monthly',
      assetClass: alloc.class
    }));
    setInvestments(newInvestments);
    setIsExecuting(false);
  };

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] p-6 mt-8">
      <div className="mb-6 border-b border-[#2C3E50] pb-4">
        <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
          <span>♟️</span> Strategy Engine
        </h2>
        <p className="text-[#4A6572] text-sm mt-1">
          Automated allocation models based on your total deployable liquidity (₹{Math.round(totalDeployablePool).toLocaleString('en-IN')}/mo).
        </p>
      </div>

      {/* Strategy Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {strategies.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => { setActiveStrategyIndex(idx); setIsExecuting(false); }}
            className={`p-4 border text-left transition-all duration-300 ${activeStrategyIndex === idx ? 'bg-[#181C28] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#0F1216] border-[#2C3E50] hover:border-[#4A6572]'}`}
          >
            <div className={`text-xs uppercase tracking-widest font-bold mb-1 ${activeStrategyIndex === idx ? 'text-blue-400' : 'text-[#4A6572]'}`}>
              {s.name}
            </div>
            <div className="text-[10px] text-[#4A6572]">Target CAGR: {s.cagr}%</div>
          </button>
        ))}
      </div>

      {/* Recommended Portfolio Details */}
      <div className="mb-8 space-y-2">
        {strategy.allocations.map((alloc, i) => (
          <div key={i} className="bg-[#181C28] border border-[#2C3E50]/50 p-3 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${alloc.class === 'equity' ? 'bg-blue-500' : alloc.class === 'debt' ? 'bg-purple-500' : 'bg-amber-500'}`}></div>
            <span className="text-[#E2E8F0] text-sm flex-1">{alloc.name}</span>
            <span className="text-[#4A6572] font-mono text-xs">{(alloc.share * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Math & Predictions */}
      <div className="bg-[#181C28] border border-[#2C3E50] p-6 mb-8">
        <h4 className="text-[#E2E8F0] font-bold text-xs uppercase tracking-widest mb-6">Capital Allotment & Prediction</h4>
        
        <div className="space-y-4 font-mono text-sm mb-6 pb-6 border-b border-[#2C3E50]">
          <div className="flex justify-between text-[#4A6572]">
            <span>Base Starting Capital</span>
            <span>₹{currentSavings.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#4A6572]">
            <span>Monthly Allotment (₹{Math.round(totalDeployablePool).toLocaleString('en-IN')} × {months} mos)</span>
            <span>+ ₹{Math.round(principalAdded).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#10b981]">
            <span>Predicted Market Growth ({strategy.cagr}%)</span>
            <span>+ ₹{Math.round(marketGrowth).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#E2E8F0] font-bold pt-2 border-t border-[#2C3E50]/30 text-lg">
            <span>Projected Final Wealth</span>
            <span>₹{Math.round(balance).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-[#0F1216] border border-[#2C3E50]/50 p-4 text-xs text-[#4A6572] leading-relaxed">
          <strong className="text-[#E2E8F0]">Prediction Analysis:</strong> By dedicating your cash flow into this protocol, only <strong className="text-[#E2E8F0]">{walletPct.toFixed(0)}%</strong> of your final wealth will come from your actual wallet. The remaining <strong className="text-[#10b981]">{marketPct.toFixed(0)}%</strong> is generated entirely by the market compounding your money over the next {y} years.
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#181C28] border border-[#2C3E50] p-6">
          <h4 className="text-[#10b981] font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Strengths
          </h4>
          <ul className="space-y-3">
            {strategy.strengths.map((s, i) => (
              <li key={i} className="text-[#E2E8F0] text-sm flex gap-2">
                <span className="text-[#4A6572]">▹</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#181C28] border border-[#2C3E50] p-6">
          <h4 className="text-[#8B3A3A] font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B3A3A]"></span> Weaknesses
          </h4>
          <ul className="space-y-3">
            {strategy.weaknesses.map((w, i) => (
              <li key={i} className="text-[#E2E8F0] text-sm flex gap-2">
                <span className="text-[#4A6572]">▹</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Execution Trigger & Transition Plan */}
      <div className="bg-[#181C28] border border-[#2C3E50] p-6">
        
        {!isExecuting ? (
          <>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="text-[#E2E8F0] font-bold text-lg">Execution Ready</h4>
                <p className="text-[#4A6572] text-xs mt-1">
                  Deploy ₹{Math.round(totalDeployablePool).toLocaleString('en-IN')} total pool into this protocol.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#E2E8F0]">{y}y {m}m</div>
                <div className="text-[10px] uppercase tracking-widest text-[#4A6572]">Time to Target</div>
              </div>
            </div>
            <button 
              onClick={() => setIsExecuting(true)} 
              disabled={totalDeployablePool <= 0}
              className={`w-full py-4 text-xs uppercase tracking-widest transition-colors font-bold ${totalDeployablePool > 0 ? 'bg-[#2C3E50] hover:bg-blue-600 text-[#E2E8F0]' : 'bg-[#0F1216] border border-[#2C3E50] text-[#4A6572] cursor-not-allowed'}`}
            >
              Execute Strategy & Setup Auto-SIP
            </button>
          </>
        ) : (
          <div className="animate-fade-in">
            <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-sm">
              <span>⚠️</span> Portfolio Restructuring Plan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               {/* STOP SECTION */}
               <div>
                 <h4 className="text-[#8B3A3A] font-bold text-[10px] uppercase tracking-widest border-b border-[#8B3A3A]/30 pb-2 mb-3">
                   1. Stop Current Allocations
                 </h4>
                 {investments.length === 0 ? (
                   <div className="text-[#4A6572] text-xs italic p-3 bg-[#0F1216] border border-[#2C3E50]/30">No active SIPs to cancel. Proceeding with unallocated cash.</div>
                 ) : (
                   <ul className="space-y-2">
                     {investments.map(inv => (
                        <li key={inv.id} className="text-xs text-[#E2E8F0] flex justify-between items-center bg-[#8B3A3A]/10 p-3 border border-[#8B3A3A]/20">
                          <span className="flex items-center gap-2"><span className="text-[#8B3A3A] text-lg leading-none">×</span> Cancel {inv.name}</span>
                          <span className="text-[#8B3A3A] font-mono font-bold">₹{inv.amount.toLocaleString('en-IN')}/{inv.frequency === 'annual' ? 'yr' : 'mo'}</span>
                        </li>
                     ))}
                   </ul>
                 )}
               </div>

               {/* START SECTION */}
               <div>
                 <h4 className="text-[#10b981] font-bold text-[10px] uppercase tracking-widest border-b border-[#10b981]/30 pb-2 mb-3">
                   2. Setup New Auto-SIPs
                 </h4>
                 <ul className="space-y-2">
                   {newAllocations.map((alloc, i) => (
                      <li key={i} className="text-xs text-[#E2E8F0] flex justify-between items-center bg-[#10b981]/10 p-3 border border-[#10b981]/20">
                        <span className="flex items-center gap-2"><span className="text-[#10b981] text-lg leading-none">+</span> Start {alloc.name}</span>
                        <span className="text-[#10b981] font-mono font-bold">₹{alloc.amount.toLocaleString('en-IN')}/mo</span>
                      </li>
                   ))}
                 </ul>
               </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 text-xs text-[#E2E8F0] leading-relaxed mb-6">
               <strong>Note:</strong> Clicking confirm will instantly wipe your current investment entries and replace them with these new optimized allocations. Your total monthly cash outflow (₹{Math.round(totalDeployablePool).toLocaleString('en-IN')}) will remain exactly the same.
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4">
               <button onClick={() => setIsExecuting(false)} className="border border-[#2C3E50] text-[#4A6572] text-xs uppercase tracking-widest hover:text-[#E2E8F0] hover:bg-[#2C3E50] px-6 py-3 transition-colors">
                 Cancel Transition
               </button>
               <button onClick={confirmExecution} className="bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase tracking-widest font-bold px-6 py-3 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                 Confirm & Overwrite Portfolio
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StrategyEngine;