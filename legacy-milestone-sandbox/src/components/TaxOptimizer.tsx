import React, { useMemo, useState } from 'react';
import type { CashFlowItem } from '../App';

interface TaxOptimizerProps {
  monthlyIncome: number;
  investments: CashFlowItem[];
  totalMonthlyExpenses?: number;
}

interface TaxSlab {
  range: string;
  rate: string;
  taxableAmount: number;
  tax: number;
}

const TaxOptimizer: React.FC<TaxOptimizerProps> = ({ monthlyIncome, investments, totalMonthlyExpenses = 0 }) => {
  const { 
    annualIncome, 
    standardDeduction,
    deductions80C, 
    taxableOld,
    slabsOld,
    taxOld,
    cessOld,
    finalTaxOld, 
    rebateOld,
    taxableNew,
    slabsNew,
    taxNew,
    cessNew,
    finalTaxNew, 
    rebateNew,
    recommended, 
    savings,
    effectiveTaxRate,
    freeCashFlow,
    totalAnnualInvested,
    annualExpenses,
    potentialSavings80C,
    activeTax 
  } = useMemo(() => {
    const grossIncome = monthlyIncome * 12;
    const standardDeduction = Math.min(grossIncome, 50000); 
    
    const eligible80CKeywords = ['ppf', 'epf', 'elss', 'life insurance', 'lic', 'tax saver'];
    
    let totalAnnualInvested = 0;
    const total80CInvested = investments.reduce((sum, inv) => {
      const annualAmount = inv.frequency === 'annual' ? inv.amount : inv.amount * 12;
      totalAnnualInvested += annualAmount;
      const isEligible = eligible80CKeywords.some(keyword => inv.name.toLowerCase().includes(keyword));
      return isEligible ? sum + annualAmount : sum;
    }, 0);

    const deductions80C = Math.min(total80CInvested, 150000);

    // --- OLD REGIME MATH ---
    const calculateOldTax = (deduction: number) => {
      const taxable = Math.max(0, grossIncome - standardDeduction - deduction);
      if (taxable <= 500000) return 0;
      let tax = 0;
      if (taxable > 1000000) tax += (taxable - 1000000) * 0.30;
      if (taxable > 500000) tax += (Math.min(taxable, 1000000) - 500000) * 0.20;
      if (taxable > 250000) tax += (Math.min(taxable, 500000) - 250000) * 0.05;
      return tax * 1.04;
    };

    const taxableOld = Math.max(0, grossIncome - standardDeduction - deductions80C);
    const finalTaxOld = calculateOldTax(deductions80C);
    const optimalOldTax = calculateOldTax(150000);
    const potentialSavings80C = Math.max(0, finalTaxOld - optimalOldTax);

    let taxOldBase = 0;
    let rebateOld = false;
    const slabsOldData: TaxSlab[] = [];

    if (taxableOld <= 500000) {
      rebateOld = taxableOld > 250000;
    } else {
      if (taxableOld > 1000000) { slabsOldData.push({ range: 'Above ₹10L', rate: '30%', taxableAmount: taxableOld - 1000000, tax: (taxableOld - 1000000) * 0.30 }); }
      if (taxableOld > 500000) { slabsOldData.push({ range: '₹5L - ₹10L', rate: '20%', taxableAmount: Math.min(taxableOld, 1000000) - 500000, tax: (Math.min(taxableOld, 1000000) - 500000) * 0.20 }); }
      if (taxableOld > 250000) { slabsOldData.push({ range: '₹2.5L - ₹5L', rate: '5%', taxableAmount: Math.min(taxableOld, 500000) - 250000, tax: (Math.min(taxableOld, 500000) - 250000) * 0.05 }); }
      slabsOldData.reverse(); 
      taxOldBase = slabsOldData.reduce((sum, slab) => sum + slab.tax, 0);
    }
    const cessOld = taxOldBase * 0.04; 

    // --- NEW REGIME MATH ---
    const taxableNew = Math.max(0, grossIncome - standardDeduction); 
    let taxNewBase = 0;
    let rebateNew = false;
    const slabsNewData: TaxSlab[] = [];

    if (taxableNew <= 700000) {
      rebateNew = taxableNew > 300000;
    } else {
      if (taxableNew > 1500000) { slabsNewData.push({ range: 'Above ₹15L', rate: '30%', taxableAmount: taxableNew - 1500000, tax: (taxableNew - 1500000) * 0.30 }); }
      if (taxableNew > 1200000) { slabsNewData.push({ range: '₹12L - ₹15L', rate: '20%', taxableAmount: Math.min(taxableNew, 1500000) - 1200000, tax: (Math.min(taxableNew, 1500000) - 1200000) * 0.20 }); }
      if (taxableNew > 900000) { slabsNewData.push({ range: '₹9L - ₹12L', rate: '15%', taxableAmount: Math.min(taxableNew, 1200000) - 900000, tax: (Math.min(taxableNew, 1200000) - 900000) * 0.15 }); }
      if (taxableNew > 600000) { slabsNewData.push({ range: '₹6L - ₹9L', rate: '10%', taxableAmount: Math.min(taxableNew, 900000) - 600000, tax: (Math.min(taxableNew, 900000) - 600000) * 0.10 }); }
      if (taxableNew > 300000) { slabsNewData.push({ range: '₹3L - ₹6L', rate: '5%', taxableAmount: Math.min(taxableNew, 600000) - 300000, tax: (Math.min(taxableNew, 600000) - 300000) * 0.05 }); }
      slabsNewData.reverse(); 
      taxNewBase = slabsNewData.reduce((sum, slab) => sum + slab.tax, 0);
    }

    const cessNew = taxNewBase * 0.04;
    const finalTaxNew = taxNewBase + cessNew;

    const recommended = finalTaxNew < finalTaxOld ? 'New Regime' : (finalTaxOld < finalTaxNew ? 'Old Regime' : 'Either Regime');
    const savings = Math.abs(finalTaxOld - finalTaxNew);
    
    // Cash Flow & Optimization Metrics
    const activeTax = recommended === 'Old Regime' ? finalTaxOld : (recommended === 'New Regime' ? finalTaxNew : finalTaxOld);
    const effectiveTaxRate = grossIncome > 0 ? (activeTax / grossIncome) * 100 : 0;
    const annualExpenses = totalMonthlyExpenses * 12;
    const freeCashFlow = Math.max(0, grossIncome - annualExpenses - totalAnnualInvested - activeTax);

    return { 
      annualIncome: grossIncome, standardDeduction, deductions80C, 
      taxableOld, slabsOld: slabsOldData, taxOld: taxOldBase, cessOld, finalTaxOld, rebateOld,
      taxableNew, slabsNew: slabsNewData, taxNew: taxNewBase, cessNew, finalTaxNew, rebateNew,
      recommended, savings, effectiveTaxRate, freeCashFlow, totalAnnualInvested, annualExpenses, potentialSavings80C, activeTax
    };
  }, [monthlyIncome, investments, totalMonthlyExpenses]);

  const [showDetails, setShowDetails] = useState(true); 

  if (annualIncome === 0) return null;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] p-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
            <span>⚖️</span> Indian Tax Optimizer
          </h2>
          <p className="text-[#4A6572] text-sm mt-1">
            Comparing liabilities for a Gross Annual Income of ₹{annualIncome.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase tracking-widest text-[#4A6572] block">Recommendation</span>
          <span className="text-[#10b981] font-bold text-sm tracking-wider uppercase">{recommended}</span>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs uppercase tracking-widest text-[#4A6572] hover:text-[#E2E8F0] flex items-center gap-1 transition-colors"
        >
          {showDetails ? 'Hide Calculation Breakdown' : 'Show Calculation Breakdown'}
          <span className="text-[10px]">{showDetails ? '▲' : '▼'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Old Regime Card */}
        <div className={`p-4 border transition-all duration-300 ${recommended === 'Old Regime' || recommended === 'Either Regime' ? 'bg-[#181C28] border-[#10b981]' : 'bg-[#0F1216] border-[#2C3E50]/50 opacity-70'}`}>
          <h3 className="text-[#E2E8F0] font-medium mb-3 uppercase tracking-widest text-xs flex justify-between">
            Old Tax Regime
            {recommended === 'Old Regime' && <span className="text-[#10b981]">★</span>}
          </h3>
          
          <div className="flex justify-between mb-2">
            <span className="text-[#4A6572] text-sm">Est. Liability (incl. Cess)</span>
            <span className={`font-bold ${recommended === 'Old Regime' || recommended === 'Either Regime' ? 'text-[#E2E8F0]' : 'text-[#8B3A3A]'}`}>
              ₹{Math.round(finalTaxOld).toLocaleString('en-IN')}
            </span>
          </div>

          {showDetails && (
            <div className="mt-4 mb-4 space-y-2 text-xs font-mono border-t border-b border-[#2C3E50]/50 py-3">
              <div className="flex justify-between text-[#E2E8F0]">
                <span>Gross Income</span>
                <span>₹{annualIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#8B3A3A]">
                <span>Standard Deduction</span>
                <span>-₹{standardDeduction.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#8B3A3A]">
                <span>Sec 80C Deduction</span>
                <span>-₹{deductions80C.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#E2E8F0] pt-2 border-t border-[#2C3E50]/30 font-semibold">
                <span>Net Taxable Income</span>
                <span>₹{taxableOld.toLocaleString('en-IN')}</span>
              </div>
              
              {slabsOld.length > 0 && (
                <div className="pt-2 pb-2 pl-3 border-l border-[#2C3E50]/50 space-y-2 my-2 ml-1">
                  <div className="text-[9px] text-[#4A6572] uppercase tracking-widest mb-1.5">Cash Brackets Applied</div>
                  {slabsOld.map(slab => (
                    <div className="flex justify-between text-[#8B3A3A] text-[11px]" key={slab.range}>
                      <span className="flex flex-col">
                        <span className="text-[#E2E8F0]">{slab.range}</span>
                        <span className="text-[9px] text-[#4A6572]">{slab.rate} tax on chunk of ₹{slab.taxableAmount.toLocaleString('en-IN')}</span>
                      </span>
                      <span>+₹{Math.round(slab.tax).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#E2E8F0] text-[11px] pt-2 mt-2 border-t border-[#2C3E50]/30 font-semibold">
                    <span>Base Income Tax</span>
                    <span>₹{Math.round(taxOld).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#8B3A3A] text-[11px] pt-1">
                    <span>Health & Education Cess (4%)</span>
                    <span>+₹{Math.round(cessOld).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              {rebateOld && <div className="text-[#10b981] mt-2 italic flex items-center gap-1">✓ Full tax rebate applied under Sec 87A (Income ≤ 5L)</div>}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#2C3E50]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#4A6572]">Sec 80C Utilized</span>
              <span className="text-[#E2E8F0]">₹{deductions80C.toLocaleString('en-IN')} / ₹1.5L</span>
            </div>
            <div className="h-1 w-full bg-[#0F1216] rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981]" style={{ width: `${(deductions80C / 150000) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* New Regime Card */}
        <div className={`p-4 border transition-all duration-300 ${recommended === 'New Regime' || recommended === 'Either Regime' ? 'bg-[#181C28] border-[#10b981]' : 'bg-[#0F1216] border-[#2C3E50]/50 opacity-70'}`}>
          <h3 className="text-[#E2E8F0] font-medium mb-3 uppercase tracking-widest text-xs flex justify-between">
            New Tax Regime
            {recommended === 'New Regime' && <span className="text-[#10b981]">★</span>}
          </h3>

          <div className="flex justify-between mb-2">
            <span className="text-[#4A6572] text-sm">Est. Liability (incl. Cess)</span>
            <span className={`font-bold ${recommended === 'New Regime' || recommended === 'Either Regime' ? 'text-[#E2E8F0]' : 'text-[#8B3A3A]'}`}>
              ₹{Math.round(finalTaxNew).toLocaleString('en-IN')}
            </span>
          </div>

          {showDetails && (
            <div className="mt-4 mb-4 space-y-2 text-xs font-mono border-t border-b border-[#2C3E50]/50 py-3">
              <div className="flex justify-between text-[#E2E8F0]">
                <span>Gross Income</span>
                <span>₹{annualIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#8B3A3A]">
                <span>Standard Deduction</span>
                <span>-₹{standardDeduction.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#4A6572] opacity-70">
                <span>Sec 80C Deduction</span>
                <span>Not Allowed</span>
              </div>
              <div className="flex justify-between text-[#E2E8F0] pt-2 border-t border-[#2C3E50]/30 font-semibold">
                <span>Net Taxable Income</span>
                <span>₹{taxableNew.toLocaleString('en-IN')}</span>
              </div>

              {slabsNew.length > 0 && (
                <div className="pt-2 pb-2 pl-3 border-l border-[#2C3E50]/50 space-y-2 my-2 ml-1">
                  <div className="text-[9px] text-[#4A6572] uppercase tracking-widest mb-1.5">Cash Brackets Applied</div>
                  {slabsNew.map(slab => (
                    <div className="flex justify-between text-[#8B3A3A] text-[11px]" key={slab.range}>
                      <span className="flex flex-col">
                        <span className="text-[#E2E8F0]">{slab.range}</span>
                        <span className="text-[9px] text-[#4A6572]">{slab.rate} tax on chunk of ₹{slab.taxableAmount.toLocaleString('en-IN')}</span>
                      </span>
                      <span>+₹{Math.round(slab.tax).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#E2E8F0] text-[11px] pt-2 mt-2 border-t border-[#2C3E50]/30 font-semibold">
                    <span>Base Income Tax</span>
                    <span>₹{Math.round(taxNew).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#8B3A3A] text-[11px] pt-1">
                    <span>Health & Education Cess (4%)</span>
                    <span>+₹{Math.round(cessNew).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              {rebateNew && <div className="text-[#10b981] mt-2 italic flex items-center gap-1">✓ Full tax rebate applied under Sec 87A (Income ≤ 7L)</div>}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#2C3E50]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#4A6572]">Sec 80C Utilized</span>
              <span className="text-[#4A6572] line-through">Not Applicable</span>
            </div>
            <div className="h-1 w-full bg-[#0F1216] rounded-full overflow-hidden">
              <div className="h-full bg-[#2C3E50]" style={{ width: `0%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-2">
        {savings > 0 ? (
          <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-3 flex justify-between items-center text-sm">
            <span className="text-[#E2E8F0]">By choosing the <strong className="text-[#10b981]">{recommended}</strong>, you save:</span>
            <span className="text-[#10b981] font-bold">₹{Math.round(savings).toLocaleString('en-IN')} / year</span>
          </div>
        ) : (
          <div className="bg-[#2C3E50]/20 border border-[#2C3E50]/50 p-3 flex justify-between items-center text-sm">
            <span className="text-[#E2E8F0]">Both regimes result in the same tax liability.</span>
            <span className="text-[#4A6572] font-bold">₹0 Difference</span>
          </div>
        )}

        {/* --- SIMPLIFIED CASH FLOW & TAX EFFICIENCY DIAGNOSTICS --- */}
        <div className="bg-[#181C28] border border-[#2C3E50] overflow-hidden">
          <div className="p-4 border-b border-[#2C3E50] bg-[#0F1216]">
            <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
              <span>🔍</span> Cash Flow & Tax Efficiency Diagnostics
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2C3E50]">
            
            {/* Left Column: Flow Mapping */}
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="text-[10px] text-[#4A6572] uppercase tracking-widest mb-2 font-sans font-semibold">Annual Flow Mapping</div>
              
              <div className="flex justify-between items-center text-[#E2E8F0]">
                <span className="flex flex-col">
                  <span>Gross Inflow</span>
                  <span className="text-[9px] text-[#4A6572]">Source: Primary Salary/Income</span>
                </span>
                <span className="font-bold">₹{annualIncome.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center text-[#8B3A3A] pt-2 border-t border-[#2C3E50]/30">
                <span>Cost of Living (Expenses)</span>
                <span>-₹{annualExpenses.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center text-blue-400">
                <span>Capital Deployed (Investments)</span>
                <span>-₹{totalAnnualInvested.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-[#8B3A3A]">
                <span>Mandatory Outflow (Est. Taxes)</span>
                <span>-₹{Math.round(activeTax).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-[#10b981] pt-3 border-t border-[#2C3E50] font-bold text-sm">
                <span>Unallocated Free Cash Flow</span>
                <span>₹{Math.round(freeCashFlow).toLocaleString('en-IN')}</span>
              </div>
              
            </div>

            {/* Right Column: The Action Plan */}
            <div className="p-5">
              <div className="text-[10px] text-[#4A6572] uppercase tracking-widest mb-4 font-semibold">The Action Plan</div>

              {/* Step 1: Cash Flow Explanation */}
              <div className="mb-5">
                <h4 className="text-[#E2E8F0] font-bold text-xs mb-2 flex items-center gap-2"><span>1️⃣</span> What is your Cash Flow?</h4>
                <p className="text-xs text-[#4A6572] leading-relaxed">
                  Out of your total income of <strong className="text-[#E2E8F0]">₹{annualIncome.toLocaleString('en-IN')}</strong>, you spend <strong className="text-[#8B3A3A]">₹{annualExpenses.toLocaleString('en-IN')}</strong> on living, invest <strong className="text-blue-400">₹{totalAnnualInvested.toLocaleString('en-IN')}</strong>, and lose <strong className="text-[#8B3A3A]">₹{Math.round(activeTax).toLocaleString('en-IN')}</strong> to taxes.
                  The remaining <strong className="text-[#10b981]">₹{Math.round(freeCashFlow).toLocaleString('en-IN')}</strong> is your "Free Cash Flow"—this is your actual unspent wealth that can be directed toward your ultimate family goals.
                </p>
              </div>

              {/* Step 2: Tax Burden */}
              <div className="mb-5">
                <h4 className="text-[#E2E8F0] font-bold text-xs mb-2 flex items-center gap-2"><span>2️⃣</span> Your Tax Burden</h4>
                <p className="text-xs text-[#4A6572] leading-relaxed">
                  You are currently losing <strong className="text-[#E2E8F0]">{effectiveTaxRate.toFixed(1)}%</strong> of your total hard-earned money directly to the government.
                </p>
              </div>

              {/* Step 3: Actionable Advice */}
              <div>
                <h4 className="text-[#E2E8F0] font-bold text-xs mb-2 flex items-center gap-2"><span>3️⃣</span> How to stop wasting money:</h4>
                
                {freeCashFlow <= 0 ? (
                  <div className="text-xs text-amber-500 leading-relaxed bg-amber-500/5 p-4 border border-amber-500/20 rounded shadow-sm">
                    <strong className="flex items-center gap-2 mb-3 text-sm">
                      <span>⚠️</span> CRITICAL: Cash Flow Deficit Detected
                    </strong>
                    <p className="mb-4 text-[#4A6572]">
                      Your current layout leaves ₹0 (or negative) unallocated cash. Your expenses, active investments, and taxes are completely consuming your gross income. Before optimizing for tax, deploy this recovery protocol:
                    </p>
                    
                    <div className="space-y-3 mt-4 text-[#E2E8F0]">
                      <div className="p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                        <strong className="text-[#10b981] block mb-1">Strategy 1: The Expense Audit</strong>
                        <span className="text-[#4A6572]">Review recurring outflows. Temporarily pause premium software/AI subscriptions, delay high-ticket consumer electronics upgrades, and ensure you are utilizing all available student discounts for tuition and gym memberships.</span>
                      </div>
                      
                      <div className="p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                        <strong className="text-blue-400 block mb-1">Strategy 2: The Investment Pause</strong>
                        <span className="text-[#4A6572]">If your Capital Deployed is high, temporarily halt your active SIPs. Funneling money into markets while running a daily deficit often forces reliance on high-interest credit. Rebuild your liquid cash buffer first.</span>
                      </div>

                      <div className="p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                        <strong className="text-purple-400 block mb-1">Strategy 3: The Income Pivot</strong>
                        <span className="text-[#4A6572]">You cannot out-save a fundamental income deficit. Leverage your technical stack (React, FastAPI, Supabase) to take on freelance database management or UI development projects to inject immediate gross inflow into your ledger.</span>
                      </div>
                    </div>
                  </div>
                ) : recommended === 'Old Regime' && potentialSavings80C > 0 ? (
                  <div className="text-xs text-[#10b981] leading-relaxed bg-[#10b981]/10 p-3 border border-[#10b981]/20 rounded">
                    <strong>Action:</strong> You have uninvested cash! Move <strong className="text-[#E2E8F0]">₹{(150000 - deductions80C).toLocaleString('en-IN')}</strong> of your Free Cash Flow into "Section 80C" investments (like ELSS Mutual Funds or PPF). This legally hides that money from the government and saves you an extra <strong className="text-[#E2E8F0]">₹{Math.round(potentialSavings80C).toLocaleString('en-IN')}</strong> in taxes this year!
                  </div>
                ) : recommended === 'New Regime' ? (
                  <div className="text-xs text-[#10b981] leading-relaxed bg-[#10b981]/10 p-3 border border-[#10b981]/20 rounded">
                    <strong>Action:</strong> In the New Regime, standard tax-saving schemes (like 80C) do not work. If you leave your <strong className="text-[#E2E8F0]">₹{Math.round(freeCashFlow).toLocaleString('en-IN')}</strong> in a bank account, the interest is taxed heavily. Move this free cash into <strong>Equity Mutual Funds</strong>. The profit from equity is taxed at a much lower "Capital Gains" rate, protecting your wealth from your high income tax slab.
                  </div>
                ) : (
                  <div className="text-xs text-[#10b981] leading-relaxed bg-[#10b981]/10 p-3 border border-[#10b981]/20 rounded">
                    <strong>Action:</strong> You have completely maxed out your 80C tax benefits! To protect your remaining <strong className="text-[#E2E8F0]">₹{Math.round(freeCashFlow).toLocaleString('en-IN')}</strong> cash, look into the <strong>NPS (National Pension System)</strong>. Section 80CCD(1B) allows you to hide an extra ₹50,000 from taxes.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* --- INCOME TAX RETURNS (ITR) NOTICE --- */}
        <div className="bg-[#181C28] border border-[#2C3E50]/50 p-4 text-xs text-[#4A6572] leading-relaxed">
          <strong className="text-[#E2E8F0] flex items-center gap-2 mb-1">
            <span>📄</span> Income Tax Returns (ITR) Filing Requirement
          </strong>
          Regardless of the regime chosen, if your Gross Annual Income exceeds the basic exemption limit (₹2.5L under the Old Regime, ₹3L under the New Regime), you must file your Income Tax Return (ITR) by July 31st each assessment year. Filing your ITR is a legal mandate that helps you claim TDS refunds, carry forward investment losses, and serves as an official income proof document for major financial milestones.
        </div>
      </div>
    </div>
  );
};

export default TaxOptimizer;