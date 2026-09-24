import React, { useMemo, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { CashFlowItem } from '../App';

interface TaxOptimizerProps {
  monthlyIncome: number;
  investments: CashFlowItem[];
  totalMonthlyExpenses?: number;
  expenses?: CashFlowItem[];
}

interface TaxSlab {
  range: string;
  rate: string;
  taxableAmount: number;
  tax: number;
}

const TaxOptimizer: React.FC<TaxOptimizerProps> = ({ monthlyIncome, investments, totalMonthlyExpenses = 0, expenses = [] }) => {
  const taxReportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  
  // --- NEW INTERACTIVE STATE ---
  const [incomeBoost, setIncomeBoost] = useState<number>(0);
  const [custom80C, setCustom80C] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const { 
    annualIncome, 
    stdDedOld,
    stdDedNew,
    deductions80C, 
    taxableOld,
    slabsOld,
    cessOld,
    finalTaxOld, 
    taxableNew,
    slabsNew,
    cessNew,
    finalTaxNew, 
    recommended, 
    savings,
    effectiveTaxRate,
    freeCashFlow,
    totalAnnualInvested,
    annualExpenses,
    activeTax,
    highestExpense,
    highestInvestment,
    annualDeficit,
    chartPointsData,
    calcOldTax,
    calcNewTax,
    potentialSavings80C
  } = useMemo(() => {
    const grossIncome = monthlyIncome * 12;
    
    const stdDedOld = Math.min(grossIncome, 50000); 
    const stdDedNew = Math.min(grossIncome, 75000); 
    
    const eligible80CKeywords = ['ppf', 'epf', 'elss', 'life insurance', 'lic', 'tax saver'];
    
    let totalAnnualInvested = 0;
    const total80CInvested = investments.reduce((sum, inv) => {
      const annualAmount = inv.frequency === 'annual' ? inv.amount : inv.amount * 12;
      totalAnnualInvested += annualAmount;
      const isEligible = eligible80CKeywords.some(keyword => inv.name.toLowerCase().includes(keyword));
      return isEligible ? sum + annualAmount : sum;
    }, 0);

    const deductions80C = Math.min(total80CInvested, 150000);

    // --- REUSABLE TAX CALCULATORS ---
    const calcOldTax = (gross: number, ded80C: number) => {
      const taxable = Math.max(0, gross - Math.min(gross, 50000) - ded80C);
      if (taxable <= 500000) return 0;
      let t = 0;
      if (taxable > 1000000) t += (taxable - 1000000) * 0.30;
      if (taxable > 500000) t += (Math.min(taxable, 1000000) - 500000) * 0.20;
      if (taxable > 250000) t += (Math.min(taxable, 500000) - 250000) * 0.05;
      return t * 1.04;
    };

    const calcNewTax = (gross: number) => {
      const taxable = Math.max(0, gross - Math.min(gross, 75000));
      if (taxable <= 1200000) return 0;
      let t = 0;
      if (taxable > 2400000) t += (taxable - 2400000) * 0.30;
      if (taxable > 2000000) t += (Math.min(taxable, 2400000) - 2000000) * 0.25;
      if (taxable > 1600000) t += (Math.min(taxable, 2000000) - 1600000) * 0.20;
      if (taxable > 1200000) t += (Math.min(taxable, 1600000) - 1200000) * 0.15;
      if (taxable > 800000) t += (Math.min(taxable, 1200000) - 800000) * 0.10;
      if (taxable > 400000) t += (Math.min(taxable, 800000) - 400000) * 0.05;
      return t * 1.04;
    };

    // --- CHART GENERATOR ---
    const chartPointsData = [0.8, 0.9, 1.0, 1.1, 1.2].map(multiplier => {
      const inc = Math.max(0, grossIncome * multiplier);
      return { income: inc, oldTax: calcOldTax(inc, deductions80C), newTax: calcNewTax(inc) };
    });

    const finalTaxOld = calcOldTax(grossIncome, deductions80C);
    const optimalOldTax = calcOldTax(grossIncome, 150000);
    const potentialSavings80C = Math.max(0, finalTaxOld - optimalOldTax);
    
    // --- UI BREAKDOWN CARDS ---
    const taxableOld = Math.max(0, grossIncome - stdDedOld - deductions80C);
    let taxOldBase = 0;
    const slabsOldData: TaxSlab[] = [];

    if (taxableOld > 500000) {
      if (taxableOld > 1000000) { slabsOldData.push({ range: 'Above ₹10L', rate: '30%', taxableAmount: taxableOld - 1000000, tax: (taxableOld - 1000000) * 0.30 }); }
      if (taxableOld > 500000) { slabsOldData.push({ range: '₹5L - ₹10L', rate: '20%', taxableAmount: Math.min(taxableOld, 1000000) - 500000, tax: (Math.min(taxableOld, 1000000) - 500000) * 0.20 }); }
      if (taxableOld > 250000) { slabsOldData.push({ range: '₹2.5L - ₹5L', rate: '5%', taxableAmount: Math.min(taxableOld, 500000) - 250000, tax: (Math.min(taxableOld, 500000) - 250000) * 0.05 }); }
      slabsOldData.reverse(); 
      taxOldBase = slabsOldData.reduce((sum, slab) => sum + slab.tax, 0);
    }
    const cessOld = taxOldBase * 0.04; 

    const taxableNew = Math.max(0, grossIncome - stdDedNew); 
    let taxNewBase = 0;
    const slabsNewData: TaxSlab[] = [];

    if (taxableNew > 1200000) {
      if (taxableNew > 2400000) { slabsNewData.push({ range: 'Above ₹24L', rate: '30%', taxableAmount: taxableNew - 2400000, tax: (taxableNew - 2400000) * 0.30 }); }
      if (taxableNew > 2000000) { slabsNewData.push({ range: '₹20L - ₹24L', rate: '25%', taxableAmount: Math.min(taxableNew, 2400000) - 2000000, tax: (Math.min(taxableNew, 2400000) - 2000000) * 0.25 }); }
      if (taxableNew > 1600000) { slabsNewData.push({ range: '₹16L - ₹20L', rate: '20%', taxableAmount: Math.min(taxableNew, 2000000) - 1600000, tax: (Math.min(taxableNew, 2000000) - 1600000) * 0.20 }); }
      if (taxableNew > 1200000) { slabsNewData.push({ range: '₹12L - ₹16L', rate: '15%', taxableAmount: Math.min(taxableNew, 1600000) - 1200000, tax: (Math.min(taxableNew, 1600000) - 1200000) * 0.15 }); }
      if (taxableNew > 800000) { slabsNewData.push({ range: '₹8L - ₹12L', rate: '10%', taxableAmount: Math.min(taxableNew, 1200000) - 800000, tax: (Math.min(taxableNew, 1200000) - 800000) * 0.10 }); }
      if (taxableNew > 400000) { slabsNewData.push({ range: '₹4L - ₹8L', rate: '5%', taxableAmount: Math.min(taxableNew, 800000) - 400000, tax: (Math.min(taxableNew, 800000) - 400000) * 0.05 }); }
      slabsNewData.reverse(); 
      taxNewBase = slabsNewData.reduce((sum, slab) => sum + slab.tax, 0);
    }

    const cessNew = taxNewBase * 0.04;
    const finalTaxNew = taxNewBase + cessNew;

    const recommended = finalTaxNew < finalTaxOld ? 'New Regime' : (finalTaxOld < finalTaxNew ? 'Old Regime' : 'Either Regime');
    const savings = Math.abs(finalTaxOld - finalTaxNew);
    
    const activeTax = recommended === 'Old Regime' ? finalTaxOld : (recommended === 'New Regime' ? finalTaxNew : finalTaxOld);
    const effectiveTaxRate = grossIncome > 0 ? (activeTax / grossIncome) * 100 : 0;
    const annualExpenses = totalMonthlyExpenses * 12;
    const unadjustedCashFlow = grossIncome - annualExpenses - totalAnnualInvested - activeTax;
    const freeCashFlow = Math.max(0, unadjustedCashFlow);
    const annualDeficit = unadjustedCashFlow < 0 ? Math.abs(unadjustedCashFlow) : 0;

    const highestExpense = expenses.length > 0 
      ? expenses.reduce((max, e) => {
          const eMonthly = e.frequency === 'annual' ? e.amount / 12 : e.amount;
          const maxMonthly = max.frequency === 'annual' ? max.amount / 12 : max.amount;
          return eMonthly > maxMonthly ? e : max;
        }, expenses[0]) 
      : null;

    const highestInvestment = investments.length > 0
      ? investments.reduce((max, i) => {
          const iMonthly = i.frequency === 'annual' ? i.amount / 12 : i.amount;
          const maxMonthly = max.frequency === 'annual' ? max.amount / 12 : max.amount;
          return iMonthly > maxMonthly ? i : max;
        }, investments[0])
      : null;

    return { 
      annualIncome: grossIncome, stdDedOld, stdDedNew, deductions80C, 
      taxableOld, slabsOld: slabsOldData, cessOld, finalTaxOld, 
      taxableNew, slabsNew: slabsNewData, cessNew, finalTaxNew, 
      recommended, savings, effectiveTaxRate, freeCashFlow, totalAnnualInvested, annualExpenses, activeTax,
      highestExpense, highestInvestment, annualDeficit, chartPointsData, calcOldTax, calcNewTax, potentialSavings80C
    };
  }, [monthlyIncome, investments, totalMonthlyExpenses, expenses]);

  // --- INTERACTIVE CALCULATIONS ---
  const active80C = custom80C !== '' ? Math.min(Number(custom80C), 150000) : deductions80C;
  const simulatedIncome = annualIncome * (1 + (incomeBoost / 100));
  const simOldTax = calcOldTax(simulatedIncome, active80C);
  const simNewTax = calcNewTax(simulatedIncome);
  const optimalRegime = simNewTax < simOldTax ? 'New Regime' : 'Old Regime';
  const bestSimTax = Math.min(simOldTax, simNewTax);
  const taxIncrease = bestSimTax - activeTax;

  // SVG Chart Polyline Math
  const maxChartTax = Math.max(...chartPointsData.map(p => Math.max(p.oldTax, p.newTax)), 1000);
  const getOldY = (val: number) => 45 - (val / maxChartTax) * 40;
  const getNewY = (val: number) => 45 - (val / maxChartTax) * 40;
  
  const oldPointsStr = chartPointsData.map((p, i) => `${(i / 4) * 100},${getOldY(p.oldTax)}`).join(' ');
  const newPointsStr = chartPointsData.map((p, i) => `${(i / 4) * 100},${getNewY(p.newTax)}`).join(' ');

  const downloadTaxReport = async () => {
    if (!taxReportRef.current) return;
    try {
      setIsExporting(true);
      setShowDetails(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const node = taxReportRef.current;
      const dataUrl = await toPng(node, { backgroundColor: '#0F1216', pixelRatio: 2, width: node.scrollWidth, height: node.scrollHeight });
      const tempPdf = new jsPDF();
      const imgProps = tempPdf.getImageProperties(dataUrl);
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [imgProps.width, imgProps.height] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
      pdf.save(`Tax_Optimization_Report_${new Date().getFullYear()}.pdf`);
    } catch (error: any) {
      console.error("PDF Gen Failed:", error);
      alert(`Report Generation Failed: ${error.message}`);
    } finally { 
      setIsExporting(false); 
    }
  };

  if (annualIncome === 0) return null;

  return (
    <div ref={taxReportRef} className="bg-[#0F1216] border border-[#2C3E50] p-6 mt-6 relative">
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

      <div className="flex justify-end gap-3 mb-4">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs uppercase tracking-widest text-[#4A6572] hover:text-[#E2E8F0] flex items-center gap-1 transition-colors"
        >
          {showDetails ? 'Hide Calculation Breakdown' : 'Show Calculation Breakdown'}
          <span className="text-[10px]">{showDetails ? '▲' : '▼'}</span>
        </button>
        <button 
          onClick={downloadTaxReport} 
          disabled={isExporting} 
          className={`border border-[#2C3E50] text-[#E2E8F0] px-3 py-1 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 ${isExporting ? 'bg-[#2C3E50] opacity-70 cursor-wait' : 'hover:bg-[#2C3E50]'}`}
        >
          <span>📄</span> {isExporting ? 'Generating...' : 'Download Tax Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* === OLD REGIME CARD === */}
        <div className={`p-4 border transition-all duration-300 ${recommended === 'Old Regime' || recommended === 'Either Regime' ? 'bg-[#181C28] border-[#10b981]' : 'bg-[#0F1216] border-[#2C3E50]/50 opacity-70'}`}>
          <h3 className="text-[#E2E8F0] font-medium mb-3 uppercase tracking-widest text-xs flex justify-between">
            Old Tax Regime
            {recommended === 'Old Regime' && <span className="text-[#10b981]">★</span>}
          </h3>
          
          <div className="flex justify-between mb-2 pb-4 border-b border-[#2C3E50]/50">
            <span className="text-[#4A6572] text-sm flex flex-col">
              Est. Liability 
              <span className="text-[9px] uppercase tracking-widest">Total tax you will owe</span>
            </span>
            <span className={`text-xl font-bold ${recommended === 'Old Regime' || recommended === 'Either Regime' ? 'text-[#E2E8F0]' : 'text-[#8B3A3A]'}`}>
              ₹{Math.round(finalTaxOld).toLocaleString('en-IN')}
            </span>
          </div>

          {showDetails && (
            <div className="mt-4 mb-4 space-y-4 text-xs font-sans pb-4">
              
              <div className="space-y-2">
                <div className="text-[10px] text-[#4A6572] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1"><span>1️⃣</span> Arriving at Taxable Income</div>
                
                <div className="flex justify-between text-[#E2E8F0] items-center">
                  <span className="flex flex-col">
                    <span>Gross Annual Income</span>
                  </span>
                  <span className="font-mono">₹{annualIncome.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-[#10b981] items-center">
                  <span className="flex flex-col">
                    <span>Standard Deduction</span>
                  </span>
                  <span className="font-mono">-₹{stdDedOld.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-[#10b981] items-center">
                  <span className="flex flex-col">
                    <span>Sec 80C Investments</span>
                  </span>
                  <span className="font-mono">-₹{deductions80C.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-[#E2E8F0] pt-2 border-t border-[#2C3E50]/30 font-semibold items-center bg-[#2C3E50]/20 p-2 rounded">
                  <span>Net Taxable Income</span>
                  <span className="font-mono">₹{taxableOld.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {slabsOld.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#2C3E50]/30">
                  <div className="text-[10px] text-[#4A6572] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1"><span>2️⃣</span> Applying Income Brackets</div>
                  
                  <div className="bg-[#0F1216] border border-[#2C3E50]/50 rounded p-2 space-y-2">
                    {slabsOld.map(slab => (
                      <div className="flex justify-between text-[#E2E8F0] text-[11px] items-center border-b last:border-0 border-[#2C3E50]/30 pb-1 last:pb-0" key={slab.range}>
                        <span className="flex flex-col">
                          <span>Bracket: {slab.range}</span>
                          <span className="text-[9px] text-[#4A6572]">Taxing {slab.rate} of the ₹{slab.taxableAmount.toLocaleString('en-IN')} that falls in this tier</span>
                        </span>
                        <span className="text-amber-500 font-mono">+₹{Math.round(slab.tax).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#2C3E50]/30">
                <div className="flex justify-between text-[#E2E8F0] items-center">
                  <span className="flex flex-col">
                    <span>Health & Education Cess</span>
                  </span>
                  <span className="text-amber-500 font-mono">+₹{Math.round(cessOld).toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          )}
          
          <div className="mt-2 pt-4 border-t border-[#2C3E50]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#4A6572]">Sec 80C Utilization</span>
              <span className="text-[#E2E8F0]">₹{deductions80C.toLocaleString('en-IN')} / ₹1.5L</span>
            </div>
            <div className="h-1.5 w-full bg-[#0F1216] rounded-full overflow-hidden border border-[#2C3E50]/50">
              <div className="h-full bg-[#10b981]" style={{ width: `${(deductions80C / 150000) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* === NEW REGIME CARD === */}
        <div className={`p-4 border transition-all duration-300 ${recommended === 'New Regime' || recommended === 'Either Regime' ? 'bg-[#181C28] border-[#10b981]' : 'bg-[#0F1216] border-[#2C3E50]/50 opacity-70'}`}>
          <h3 className="text-[#E2E8F0] font-medium mb-3 uppercase tracking-widest text-xs flex justify-between">
            New Tax Regime
            {recommended === 'New Regime' && <span className="text-[#10b981]">★</span>}
          </h3>

          <div className="flex justify-between mb-2 pb-4 border-b border-[#2C3E50]/50">
            <span className="text-[#4A6572] text-sm flex flex-col">
              Est. Liability 
              <span className="text-[9px] uppercase tracking-widest">Total tax you will owe</span>
            </span>
            <span className={`text-xl font-bold ${recommended === 'New Regime' || recommended === 'Either Regime' ? 'text-[#E2E8F0]' : 'text-[#8B3A3A]'}`}>
              ₹{Math.round(finalTaxNew).toLocaleString('en-IN')}
            </span>
          </div>

          {showDetails && (
            <div className="mt-4 mb-4 space-y-4 text-xs font-sans pb-4">
              
              <div className="space-y-2">
                <div className="text-[10px] text-[#4A6572] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1"><span>1️⃣</span> Arriving at Taxable Income</div>
                
                <div className="flex justify-between text-[#E2E8F0] items-center">
                  <span className="flex flex-col">
                    <span>Gross Annual Income</span>
                  </span>
                  <span className="font-mono">₹{annualIncome.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-[#10b981] items-center">
                  <span className="flex flex-col">
                    <span>Standard Deduction</span>
                  </span>
                  <span className="font-mono">-₹{stdDedNew.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-[#4A6572] items-center opacity-60">
                  <span className="flex flex-col">
                    <span className="line-through">Sec 80C Investments</span>
                  </span>
                  <span className="font-mono">₹0</span>
                </div>
                
                <div className="flex justify-between text-[#E2E8F0] pt-2 border-t border-[#2C3E50]/30 font-semibold items-center bg-[#2C3E50]/20 p-2 rounded">
                  <span>Net Taxable Income</span>
                  <span className="font-mono">₹{taxableNew.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {slabsNew.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#2C3E50]/30">
                  <div className="text-[10px] text-[#4A6572] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1"><span>2️⃣</span> Applying Income Brackets</div>
                  
                  <div className="bg-[#0F1216] border border-[#2C3E50]/50 rounded p-2 space-y-2">
                    {slabsNew.map(slab => (
                      <div className="flex justify-between text-[#E2E8F0] text-[11px] items-center border-b last:border-0 border-[#2C3E50]/30 pb-1 last:pb-0" key={slab.range}>
                        <span className="flex flex-col">
                          <span>Bracket: {slab.range}</span>
                          <span className="text-[9px] text-[#4A6572]">Taxing {slab.rate} of the ₹{slab.taxableAmount.toLocaleString('en-IN')} that falls in this tier</span>
                        </span>
                        <span className="text-amber-500 font-mono">+₹{Math.round(slab.tax).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#2C3E50]/30">
                <div className="flex justify-between text-[#E2E8F0] items-center">
                  <span className="flex flex-col">
                    <span>Health & Education Cess</span>
                  </span>
                  <span className="text-amber-500 font-mono">+₹{Math.round(cessNew).toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          )}
          
          <div className="mt-2 pt-4 border-t border-[#2C3E50]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#4A6572]">Sec 80C Utilization</span>
              <span className="text-[#4A6572] italic text-[10px]">Disabled in New Regime</span>
            </div>
            <div className="h-1.5 w-full bg-[#0F1216] rounded-full overflow-hidden border border-[#2C3E50]/50">
              <div className="h-full bg-[#2C3E50]" style={{ width: `0%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-2">
        {savings > 0 ? (
          <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-3 flex justify-between items-center text-sm transition-all">
            <span className="text-[#E2E8F0]">By choosing the <strong className="text-[#10b981]">{recommended}</strong>, you save:</span>
            <span className="text-[#10b981] font-bold">₹{Math.round(savings).toLocaleString('en-IN')} / year</span>
          </div>
        ) : (
          <div className="bg-[#2C3E50]/20 border border-[#2C3E50]/50 p-3 flex justify-between items-center text-sm transition-all">
            <span className="text-[#E2E8F0]">Both regimes result in the same tax liability.</span>
            <span className="text-[#4A6572] font-bold">₹0 Difference</span>
          </div>
        )}

        {/* --- INTERACTIVE TAX VS INCOME CHART & WHAT-IF SCENARIOS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Interactive Line Chart */}
          <div className="bg-[#181C28] border border-[#2C3E50] overflow-hidden flex flex-col">
            <div className="bg-[#15803d] text-white py-3 px-4 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
              <span>Tax vs Income Chart</span>
              <span className="text-[10px] text-[#10b981] bg-[#0F1216]/50 px-2 py-1 rounded">Interactive Hover</span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-center relative min-h-55">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible group">
                {/* Axes */}
                <line x1="0" y1="0" x2="0" y2="50" stroke="#4A6572" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#4A6572" strokeWidth="0.5" />
                
                {/* Lines */}
                <polyline points={oldPointsStr} fill="none" stroke="#ef4444" strokeWidth="1" className="transition-all duration-300" />
                <polyline points={newPointsStr} fill="none" stroke="#3b82f6" strokeWidth="1" className="transition-all duration-300" />
                
                {/* Data Points with Hover Detection */}
                {chartPointsData.map((p, i) => {
                  const cx = (i / 4) * 100;
                  const cyOld = getOldY(p.oldTax);
                  const cyNew = getNewY(p.newTax);
                  const isHovered = hoveredNode === i;

                  return (
                    <g key={`node-${i}`} onMouseEnter={() => setHoveredNode(i)} onMouseLeave={() => setHoveredNode(null)}>
                      {/* Invisible larger hit area for easier hovering */}
                      <rect x={cx - 10} y="0" width="20" height="50" fill="transparent" className="cursor-crosshair" />
                      
                      {/* Vertical Guideline on Hover */}
                      {isHovered && <line x1={cx} y1="0" x2={cx} y2="50" stroke="#4A6572" strokeWidth="0.5" strokeDasharray="2" />}
                      
                      <circle cx={cx} cy={cyOld} r={isHovered ? "3" : "1.5"} fill="#ef4444" className="transition-all duration-200" />
                      <circle cx={cx} cy={cyNew} r={isHovered ? "3" : "1.5"} fill="#3b82f6" className="transition-all duration-200" />
                    </g>
                  );
                })}
              </svg>
              
              {/* Dynamic Tooltip */}
              {hoveredNode !== null && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#0F1216] border border-[#2C3E50] p-3 rounded shadow-xl pointer-events-none z-10 w-48 transition-opacity">
                  <div className="text-[10px] text-[#4A6572] uppercase tracking-widest border-b border-[#2C3E50]/50 pb-1 mb-2">
                    Income: <span className="text-[#E2E8F0] font-bold">₹{Math.round(chartPointsData[hoveredNode].income).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-[#ef4444] flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#ef4444] rounded-full"></div> Old</span>
                    <span>₹{Math.round(chartPointsData[hoveredNode].oldTax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#3b82f6] flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full"></div> New</span>
                    <span>₹{Math.round(chartPointsData[hoveredNode].newTax).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-6 left-6 text-[10px] font-mono flex gap-4">
                <span className="text-[#ef4444] flex items-center gap-1"><div className="w-3 h-0.5 bg-[#ef4444]"></div> Old Regime</span>
                <span className="text-[#3b82f6] flex items-center gap-1"><div className="w-3 h-0.5 bg-[#3b82f6]"></div> New Regime</span>
              </div>
            </div>
          </div>

          {/* Interactive What-If Calculator */}
          <div className="bg-[#181C28] border border-[#2C3E50] overflow-hidden flex flex-col">
            <div className="bg-[#0f766e] text-white py-3 px-4 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
              <span>What-If Calculator</span>
              <span className="text-[10px] text-teal-300 bg-[#0F1216]/50 px-2 py-1 rounded">Live Model</span>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-center gap-6">
              
              {/* Slider Input */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-[#E2E8F0] flex justify-between uppercase tracking-widest">
                  <span>Simulate Salary Increase</span>
                  <span className="text-[#10b981]">+{incomeBoost}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={incomeBoost} 
                  onChange={(e) => setIncomeBoost(Number(e.target.value))}
                  className="w-full h-1 bg-[#0F1216] rounded-lg appearance-none cursor-pointer accent-[#10b981]"
                />
                <div className="flex justify-between items-end p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                  <div className="text-[10px] text-[#4A6572] uppercase tracking-widest">
                    Projected Gross: <br/>
                    <span className="text-[#E2E8F0] text-sm">₹{Math.round(simulatedIncome).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#4A6572] uppercase tracking-widest block mb-1">New {optimalRegime} Tax</span>
                    <span className={`font-mono font-bold ${taxIncrease > 0 ? 'text-amber-500' : 'text-[#10b981]'}`}>
                      ₹{Math.round(bestSimTax).toLocaleString('en-IN')} 
                      <span className="text-[10px] ml-1 opacity-70">({taxIncrease > 0 ? '+' : ''}₹{Math.round(taxIncrease).toLocaleString('en-IN')})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Deduction Input */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[#2C3E50]/50">
                <label className="text-xs font-semibold text-[#E2E8F0] flex justify-between uppercase tracking-widest items-center">
                  <span>Simulate 80C Investment</span>
                  <div className="group relative">
                    <span className="text-[10px] text-[#4A6572] bg-[#0F1216] border border-[#2C3E50] px-2 py-0.5 rounded cursor-help">?</span>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#2C3E50] text-[#E2E8F0] text-[9px] rounded hidden group-hover:block z-10 shadow-lg">
                      Enter a custom value up to ₹1,50,000 to see how utilizing ELSS, PPF, or Life Insurance lowers your Old Regime tax burden instantly.
                    </div>
                  </div>
                </label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    placeholder={`Current: ₹${deductions80C}`}
                    value={custom80C}
                    onChange={(e) => setCustom80C(e.target.value)}
                    className="flex-1 bg-[#0F1216] border border-[#2C3E50] p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#10b981] font-mono transition-colors"
                  />
                  <div className="bg-[#0F1216] border border-[#2C3E50]/50 p-2 flex flex-col justify-center min-w-30 rounded">
                    <span className="text-[9px] text-[#4A6572] uppercase tracking-widest">Tax Savings</span>
                    <span className="text-[#10b981] font-mono font-bold">
                      ₹{Math.max(0, calcOldTax(simulatedIncome, 0) - simOldTax).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <div className="bg-[#181C28] border border-[#2C3E50] overflow-hidden mt-4">
          <div className="p-4 border-b border-[#2C3E50] bg-[#0F1216]">
            <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
              <span>🔍</span> Cash Flow & Tax Efficiency Diagnostics
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2C3E50]">
            
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="text-[10px] text-[#4A6572] uppercase tracking-widest mb-2 font-sans font-semibold">Annual Flow Mapping</div>
              
              <div className="flex justify-between items-center text-[#E2E8F0]">
                <span className="flex flex-col">
                  <span>Gross Inflow</span>
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
                <span className={annualDeficit > 0 ? "text-amber-500" : ""}>
                  {annualDeficit > 0 ? `-₹${annualDeficit.toLocaleString('en-IN')}` : `₹${Math.round(freeCashFlow).toLocaleString('en-IN')}`}
                </span>
              </div>
              
            </div>

            <div className="p-5">
              <div className="text-[10px] text-[#4A6572] uppercase tracking-widest mb-4 font-semibold">The Action Plan</div>

              <div className="mb-5">
                <h4 className="text-[#E2E8F0] font-bold text-xs mb-2 flex items-center gap-2"><span>1️⃣</span> What is your Cash Flow?</h4>
                <p className="text-xs text-[#4A6572] leading-relaxed">
                  Out of your total income of <strong className="text-[#E2E8F0]">₹{annualIncome.toLocaleString('en-IN')}</strong>, you spend <strong className="text-[#8B3A3A]">₹{annualExpenses.toLocaleString('en-IN')}</strong> on living, invest <strong className="text-blue-400">₹{totalAnnualInvested.toLocaleString('en-IN')}</strong>, and lose <strong className="text-[#8B3A3A]">₹{Math.round(activeTax).toLocaleString('en-IN')}</strong> to taxes.
                  The remaining <strong className={annualDeficit > 0 ? "text-amber-500" : "text-[#10b981]"}>{annualDeficit > 0 ? `-₹${annualDeficit.toLocaleString('en-IN')}` : `₹${Math.round(freeCashFlow).toLocaleString('en-IN')}`}</strong> is your "Free Cash Flow."
                </p>
              </div>

              <div className="mb-5">
                <h4 className="text-[#E2E8F0] font-bold text-xs mb-2 flex items-center gap-2"><span>2️⃣</span> Your Tax Burden</h4>
                <p className="text-xs text-[#4A6572] leading-relaxed">
                  You are currently losing <strong className="text-[#E2E8F0]">{effectiveTaxRate.toFixed(1)}%</strong> of your total hard-earned money directly to the government.
                </p>
              </div>

              <div>
                <h4 className="text-[#E2E8F0] font-bold text-xs mb-2 flex items-center gap-2"><span>3️⃣</span> How to stop wasting money:</h4>
                
                {annualDeficit > 0 ? (
                  <div className="text-xs text-amber-500 leading-relaxed bg-amber-500/5 p-4 border border-amber-500/20 rounded shadow-sm">
                    <strong className="flex items-center gap-2 mb-3 text-sm">
                      <span>⚠️</span> CRITICAL: Cash Flow Deficit Detected
                    </strong>
                    <p className="mb-4 text-[#4A6572]">
                      Your current layout leaves you short by <strong className="text-amber-500">₹{annualDeficit.toLocaleString('en-IN')}</strong> per year. Your expenses, active investments, and taxes are mathematically consuming more than your gross income. Before optimizing for tax, deploy this data-driven recovery protocol:
                    </p>
                    
                    <div className="space-y-3 mt-4 text-[#E2E8F0]">
                      <div className="p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                        <strong className="text-[#10b981] block mb-1">Strategy 1: The Expense Audit</strong>
                        <span className="text-[#4A6572]">
                          {highestExpense 
                            ? `Your ledger shows your heaviest outgoing expense is "${highestExpense.name}" at ₹${highestExpense.amount.toLocaleString('en-IN')}/${highestExpense.frequency === 'annual' ? 'yr' : 'mo'}. If this is non-essential, reducing it is your fastest path to restoring liquidity.` 
                            : `Review your recurring outflows. Cut any non-essential spending to free up immediate liquidity.`}
                        </span>
                      </div>
                      
                      <div className="p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                        <strong className="text-blue-400 block mb-1">Strategy 2: The Investment Pause</strong>
                        <span className="text-[#4A6572]">
                          {highestInvestment
                            ? `You are currently funneling ₹${highestInvestment.amount.toLocaleString('en-IN')}/${highestInvestment.frequency === 'annual' ? 'yr' : 'mo'} into "${highestInvestment.name}". Investing while running a daily deficit forces reliance on high-interest credit. Temporarily pause this SIP to stop the bleeding.`
                            : `If you have active SIPs, temporarily halt them. Funneling money into markets while running a deficit forces reliance on high-interest credit.`}
                        </span>
                      </div>

                      <div className="p-3 bg-[#0F1216] border border-[#2C3E50]/50 rounded">
                        <strong className="text-purple-400 block mb-1">Strategy 3: The Income Pivot</strong>
                        <span className="text-[#4A6572]">
                          You cannot out-save a fundamental income deficit. You need to either increase your primary salary or generate a supplementary side-income of exactly <strong className="text-[#E2E8F0]">₹{Math.ceil(annualDeficit / 12).toLocaleString('en-IN')}/month</strong> just to break even.
                        </span>
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

      </div>
    </div>
  );
};

export default TaxOptimizer;