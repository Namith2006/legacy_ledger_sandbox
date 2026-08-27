import React from 'react';
import type { CashFlowItem, Milestone, AssetClass, MarketReturns } from '../App';

interface ScenarioControlsProps {
  currentSavings: number; setCurrentSavings: (val: number) => void;
  monthlyIncome: number; setMonthlyIncome: (val: number) => void;
  annualIncomeGrowth: number; setAnnualIncomeGrowth: (val: number) => void;
  expenses: CashFlowItem[]; setExpenses: (val: CashFlowItem[]) => void;
  investments: CashFlowItem[]; setInvestments: (val: CashFlowItem[]) => void;
  totalExpenses: number; totalInvestments: number;
  availableCash: number; actualInvested: number;
  marketReturns: MarketReturns; setMarketReturns: (val: MarketReturns) => void;
  milestones: Milestone[]; setMilestones: (val: Milestone[]) => void;
  inflationAdjusted: boolean; setInflationAdjusted: (val: boolean) => void;
}

const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  currentSavings, setCurrentSavings, monthlyIncome, setMonthlyIncome,
  annualIncomeGrowth, setAnnualIncomeGrowth,
  expenses, setExpenses, investments, setInvestments,
  totalExpenses, totalInvestments, availableCash, actualInvested,
  marketReturns, setMarketReturns, milestones, setMilestones,
  inflationAdjusted, setInflationAdjusted
}) => {

  const handleUpdate = (type: 'expense' | 'investment', id: string, field: keyof CashFlowItem, value: any) => {
    const list = type === 'expense' ? expenses : investments;
    const setList = type === 'expense' ? setExpenses : setInvestments;
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAdd = (type: 'expense' | 'investment' | 'milestone') => {
    if (type === 'milestone') {
      setMilestones([...milestones, { id: Date.now().toString(), name: 'New Goal', target: 0 }]);
    } else {
      const list = type === 'expense' ? expenses : investments;
      const setList = type === 'expense' ? setExpenses : setInvestments;
      setList([...list, { id: Date.now().toString(), name: 'New Item', amount: 0, frequency: 'monthly', assetClass: 'equity' }]);
    }
  };

  const handleRemove = (type: 'expense' | 'investment' | 'milestone', id: string) => {
    if (type === 'milestone') {
      setMilestones(milestones.filter(m => m.id !== id));
    } else {
      const list = type === 'expense' ? expenses : investments;
      const setList = type === 'expense' ? setExpenses : setInvestments;
      setList(list.filter(item => item.id !== id));
    }
  };

  const inputClasses = "bg-[#0F1216] border border-[#2C3E50] text-[#E2E8F0] px-2 py-1.5 focus:border-[#4A6572] focus:outline-none transition-colors w-full text-sm min-w-0";
  const selectClasses = "bg-[#0F1216] border border-[#2C3E50] text-[#4A6572] px-1 py-1.5 focus:border-[#4A6572] focus:outline-none text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer min-w-0";
  const labelClasses = "text-[#4A6572] text-xs uppercase tracking-wider mb-2 block";
  const cardClasses = "bg-[#181C28] border border-[#2C3E50] p-6";
  const btnClasses = "border border-[#2C3E50] hover:bg-[#2C3E50] text-[#E2E8F0] text-xs uppercase tracking-wider px-4 py-2 transition-colors flex justify-center w-full mt-2";

  return (
    <div className="flex flex-col gap-6 w-full text-[#E2E8F0]">
      
      <div className={cardClasses}>
        <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest mb-6 border-b border-[#2C3E50] pb-2">Foundation</h3>
        <div className="mb-5">
          <label className={labelClasses}>Current Savings (₹)</label>
          <input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} className={inputClasses} />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClasses}>Monthly Income (₹)</label>
            <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} className={inputClasses} />
          </div>
          <div className="w-24">
            <label className={labelClasses}>Hike (%)</label>
            <input type="number" value={annualIncomeGrowth} onChange={(e) => setAnnualIncomeGrowth(Number(e.target.value))} className={inputClasses} title="Yearly Salary Hike" />
          </div>
        </div>
      </div>

      <div className={cardClasses}>
        <div className="flex justify-between items-end mb-6 border-b border-[#2C3E50] pb-2">
          <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest">Expenses</h3>
          <span className="text-[#E2E8F0] text-sm">₹{Math.round(totalExpenses).toLocaleString('en-IN')}/mo</span>
        </div>
        <div className="flex flex-col gap-4">
          {expenses.map(exp => (
            <div key={exp.id} className="flex flex-col gap-2 bg-[#0F1216]/40 p-3 border border-[#2C3E50]/50">
              <input type="text" value={exp.name} onChange={(e) => handleUpdate('expense', exp.id, 'name', e.target.value)} placeholder="Expense Name" className={inputClasses} />
              <div className="flex gap-2">
                <input type="number" value={exp.amount || ''} onChange={(e) => handleUpdate('expense', exp.id, 'amount', Number(e.target.value))} placeholder="Amount" className={`${inputClasses} flex-1 text-right`} />
                <select value={exp.frequency} onChange={(e) => handleUpdate('expense', exp.id, 'frequency', e.target.value)} className={`${selectClasses} flex-1`}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
                <button onClick={() => handleRemove('expense', exp.id)} className="bg-[#0F1216] border border-[#2C3E50] hover:border-[#8B3A3A] text-[#4A6572] px-3">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => handleAdd('expense')} className={btnClasses}>+ Add Expense</button>
      </div>

      <div className={cardClasses}>
        <div className="flex justify-between items-end mb-2 border-b border-[#2C3E50] pb-2">
          <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest">Investments</h3>
          <span className="text-[#E2E8F0] text-sm">₹{Math.round(totalInvestments).toLocaleString('en-IN')}/mo</span>
        </div>
        <div className="flex justify-between items-center mb-6 text-xs border-b border-[#2C3E50] pb-4">
          <span className="text-[#4A6572]">Available: ₹{Math.round(availableCash).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex flex-col gap-4">
          {investments.map(inv => (
            <div key={inv.id} className="flex flex-col gap-2 bg-[#0F1216]/40 p-3 border border-[#2C3E50]/50">
              <input type="text" value={inv.name} onChange={(e) => handleUpdate('investment', inv.id, 'name', e.target.value)} placeholder="Investment Name" className={inputClasses} />
              <div className="flex gap-2">
                <input type="number" value={inv.amount || ''} onChange={(e) => handleUpdate('investment', inv.id, 'amount', Number(e.target.value))} placeholder="Amt" className={`${inputClasses} flex-1 text-right`} />
                <select value={inv.frequency} onChange={(e) => handleUpdate('investment', inv.id, 'frequency', e.target.value)} className={`${selectClasses} flex-1`}>
                  <option value="monthly">Mo</option>
                  <option value="annual">Yr</option>
                </select>
                <select value={inv.assetClass} onChange={(e) => handleUpdate('investment', inv.id, 'assetClass', e.target.value as AssetClass)} className={`${selectClasses} flex-1`}>
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                  <option value="gold">Gold</option>
                  <option value="liquid">Cash</option>
                </select>
                <button onClick={() => handleRemove('investment', inv.id)} className="bg-[#0F1216] border border-[#2C3E50] hover:border-[#8B3A3A] text-[#4A6572] px-3">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => handleAdd('investment')} className={btnClasses}>+ Add Investment</button>
      </div>

      <div className={cardClasses}>
        <div className="flex justify-between items-center mb-6 border-b border-[#2C3E50] pb-2">
          <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest">Market & Goals</h3>
          <button 
            onClick={() => setInflationAdjusted(!inflationAdjusted)}
            className={`text-[10px] px-2 py-1 uppercase tracking-widest border transition-colors ${inflationAdjusted ? 'bg-[#8B3A3A]/20 border-[#8B3A3A] text-[#8B3A3A]' : 'border-[#2C3E50] text-[#4A6572]'}`}
          >
            {inflationAdjusted ? 'Inflation: ON (6%)' : 'Inflation: OFF'}
          </button>
        </div>
        
        {/* NEW: 2x2 Grid for Specific Asset Class Returns */}
        <div className="mb-6">
          <label className={labelClasses}>Expected Returns (%)</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#4A6572] w-10 uppercase tracking-widest">Eqty</span>
              <input type="number" value={marketReturns.equity} onChange={(e) => setMarketReturns({...marketReturns, equity: Number(e.target.value)})} className={inputClasses} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#4A6572] w-10 uppercase tracking-widest">Debt</span>
              <input type="number" value={marketReturns.debt} onChange={(e) => setMarketReturns({...marketReturns, debt: Number(e.target.value)})} className={inputClasses} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#4A6572] w-10 uppercase tracking-widest">Gold</span>
              <input type="number" value={marketReturns.gold} onChange={(e) => setMarketReturns({...marketReturns, gold: Number(e.target.value)})} className={inputClasses} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#4A6572] w-10 uppercase tracking-widest">Cash</span>
              <input type="number" value={marketReturns.liquid} onChange={(e) => setMarketReturns({...marketReturns, liquid: Number(e.target.value)})} className={inputClasses} />
            </div>
          </div>
        </div>
        
        <label className={labelClasses}>Custom Milestones (₹)</label>
        <div className="flex flex-col gap-4">
          {milestones.map(m => (
            <div key={m.id} className="flex flex-col gap-2 bg-[#0F1216]/40 p-3 border border-[#2C3E50]/50">
              <input type="text" value={m.name} onChange={(e) => setMilestones(milestones.map(mi => mi.id === m.id ? { ...mi, name: e.target.value } : mi))} placeholder="Milestone Name" className={inputClasses} />
              <div className="flex gap-2">
                <input type="number" value={m.target || ''} onChange={(e) => setMilestones(milestones.map(mi => mi.id === m.id ? { ...mi, target: Number(e.target.value) } : mi))} placeholder="Target Amount" className={`${inputClasses} flex-1 text-right`} />
                <button onClick={() => handleRemove('milestone', m.id)} className="bg-[#0F1216] border border-[#2C3E50] hover:border-[#8B3A3A] text-[#4A6572] px-3">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => handleAdd('milestone')} className={btnClasses}>+ Add Milestone</button>
      </div>
      
    </div>
  );
};

export default ScenarioControls;