import React, { useMemo } from 'react';

interface CashFlowItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'annual';
  assetClass?: 'equity' | 'debt' | 'gold' | 'liquid';
}

interface InvestmentAuditorProps {
  investments: CashFlowItem[];
  monthlyIncome: number;
  availableCash?: number;
}

interface OptimalAssetPlan {
  id: string;
  name: string;
  assetClass: 'equity' | 'debt' | 'gold' | 'liquid';
  currentMonthly: number;
  recommendedMonthly: number;
  recommendedShare: number;
  cagr: number;
  grossProfitAnnual: number;
  taxApplicable: number;
  taxLabel: string;
  netProfitAnnual: number;
  taxAdvantageNote: string;
  isWaste: boolean;
  wasteWarning?: string;
  pivotRecommendation?: string;
}

const InvestmentAuditor: React.FC<InvestmentAuditorProps> = ({ 
  investments, 
  monthlyIncome, 
  availableCash = 0 
}) => {
  const annualIncome = monthlyIncome * 12;
  const slabRate = annualIncome > 1500000 ? 0.30 : (annualIncome > 1000000 ? 0.20 : (annualIncome > 500000 ? 0.10 : 0));

  const { auditedAssets, totalInvestedMonthly, totalProjectedNetProfit, totalTaxDeduction } = useMemo(() => {
    const totalCurrentMonthly = investments.reduce(
      (sum, item) => sum + (item.frequency === 'annual' ? item.amount / 12 : item.amount), 
      0
    );

    // Total deployable monthly pool (combines active SIPs with unused cash)
    const investablePool = Math.max(totalCurrentMonthly, totalCurrentMonthly + availableCash);

    let calculatedTaxTotal = 0;
    let calculatedNetProfitTotal = 0;

    const auditedAssets: OptimalAssetPlan[] = investments.map((inv) => {
      const monthlyAmount = inv.frequency === 'annual' ? inv.amount / 12 : inv.amount;
      const annualDeployed = monthlyAmount * 12;
      const lowerName = inv.name.toLowerCase();
      const assetClass = inv.assetClass || 'liquid';

      let isWaste = false;
      let cagr = 0.10;
      let recommendedShare = 0.15; 
      let taxLabel = '';
      let taxAdvantageNote = '';
      let wasteWarning = '';
      let pivotRecommendation = '';

      // 1. Identify Wealth-Draining Assets
      if (lowerName.includes('fd') || lowerName.includes('fixed deposit') || lowerName.includes('rd')) {
        isWaste = true;
        cagr = 0.07;
        recommendedShare = 0.0;
        taxLabel = `Taxed at Slab (${(slabRate * 100).toFixed(0)}%)`;
        wasteWarning = `Gross yield 7% is reduced to ${(7 * (1 - slabRate)).toFixed(1)}% post-tax, trailing annual inflation.`;
        pivotRecommendation = 'Reallocate capital into Equity Index Funds or PPF for superior tax efficiency.';
      } else if (lowerName.includes('lic') || lowerName.includes('endowment') || lowerName.includes('ulip')) {
        isWaste = true;
        cagr = 0.045;
        recommendedShare = 0.0;
        taxLabel = 'Low Yield Sub-Par Structure';
        wasteWarning = 'Commissions and high mortality charges cap yields at ~4-5%.';
        pivotRecommendation = 'Separate term life coverage from wealth accumulation instruments.';
      } else if (assetClass === 'liquid' || lowerName.includes('savings')) {
        isWaste = true;
        cagr = 0.035;
        recommendedShare = 0.05;
        taxLabel = `Taxed at Slab (${(slabRate * 100).toFixed(0)}%)`;
        wasteWarning = 'Holding excess idle liquid cash dilutes real portfolio purchasing power.';
        pivotRecommendation = 'Retain emergency reserves here; route remaining liquidity to compounding assets.';
      } 
      // 2. High Probability & Optimized Assets
      else if (lowerName.includes('index')) {
        cagr = 0.12;
        recommendedShare = 0.40;
        taxLabel = '12.5% LTCG (> ₹1.25L Profit)';
        taxAdvantageNote = 'Gains held over 12 months qualify for long-term capital gains tax at 12.5%.';
      } else if (assetClass === 'equity' || lowerName.includes('sip') || lowerName.includes('stock')) {
        cagr = 0.15;
        recommendedShare = 0.25;
        taxLabel = '12.5% LTCG (> ₹1.25L Profit)';
        taxAdvantageNote = 'High growth driver. Gains above the annual ₹1.25L exemption threshold are taxed at 12.5%.';
      } else if (lowerName.includes('ppf') || lowerName.includes('epf')) {
        cagr = 0.071;
        recommendedShare = 0.20;
        taxLabel = '0% Tax (EEE Status)';
        taxAdvantageNote = 'Complete exemption on contributions, accrued interest, and maturity distributions.';
      } else if (assetClass === 'gold' || lowerName.includes('gold')) {
        cagr = 0.10;
        recommendedShare = 0.10;
        taxLabel = '0% LTCG on Redemption';
        taxAdvantageNote = 'Holding via Sovereign Gold Bonds eliminates capital gains tax upon redemption.';
      }

      // Calculate Returns & Applicable Taxes
      const grossProfitAnnual = annualDeployed * cagr;
      let taxApplicable = 0;

      if (isWaste) {
        taxApplicable = grossProfitAnnual * slabRate;
      } else if (assetClass === 'equity') {
        const taxableGain = Math.max(0, grossProfitAnnual - 125000);
        taxApplicable = taxableGain * 0.125;
      } else if (assetClass === 'debt' || assetClass === 'gold') {
        taxApplicable = 0; // PPF and SGB to maturity
      }

      const netProfitAnnual = grossProfitAnnual - taxApplicable;
      const recommendedMonthly = Math.round(investablePool * recommendedShare);

      calculatedTaxTotal += taxApplicable;
      calculatedNetProfitTotal += netProfitAnnual;

      // ... previous math above ...
      
      return {
        id: inv.id,
        name: inv.name,
        assetClass,
        currentMonthly: monthlyAmount, // <--- FIX IS HERE
        recommendedMonthly,
        recommendedShare,
        cagr,
        grossProfitAnnual,
        taxApplicable,
        taxLabel,
        netProfitAnnual,
        taxAdvantageNote,
        isWaste,
        wasteWarning,
        pivotRecommendation
      };
    });

    return {
      auditedAssets,
      totalInvestedMonthly: totalCurrentMonthly,
      totalProjectedNetProfit: calculatedNetProfitTotal,
      totalTaxDeduction: calculatedTaxTotal
    };
  }, [investments, monthlyIncome, availableCash, slabRate]);

  if (investments.length === 0) return null;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] overflow-hidden">
      
      {/* Component Header */}
      <div className="p-5 border-b border-[#2C3E50] bg-[#181C28] flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
            <span>🔬</span> Automated Portfolio & Tax Optimizer
          </h3>
          <p className="text-[#4A6572] text-[10px] uppercase tracking-widest mt-1">
            Tax-adjusted returns & recommended asset weightings
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0F1216] px-3 py-1.5 border border-[#2C3E50] text-right">
            <span className="text-[9px] text-[#4A6572] uppercase block">Est. 1-Yr Net Profit</span>
            <span className="text-xs font-mono font-bold text-[#10b981]">
              +₹{Math.round(totalProjectedNetProfit).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-[#0F1216] px-3 py-1.5 border border-[#2C3E50] text-right">
            <span className="text-[9px] text-[#4A6572] uppercase block">Est. Annual Tax</span>
            <span className="text-xs font-mono font-bold text-[#8B3A3A]">
              -₹{Math.round(totalTaxDeduction).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {auditedAssets.map((asset) => (
          <div 
            key={asset.id} 
            className={`bg-[#181C28] border p-5 transition-all flex flex-col justify-between ${
              asset.isWaste 
                ? 'border-amber-500/40' 
                : 'border-[#10b981]/30'
            }`}
          >
            {/* Header & Badges */}
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-[#E2E8F0] font-bold text-sm">{asset.name}</h4>
                  <span className="text-[10px] uppercase tracking-wider text-[#4A6572]">
                    Expected CAGR: {(asset.cagr * 100).toFixed(1)}%
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                  asset.isWaste 
                    ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' 
                    : 'border-[#10b981]/50 text-[#10b981] bg-[#10b981]/10'
                }`}>
                  {asset.taxLabel}
                </span>
              </div>

              {/* Allocation Comparison Table */}
              <div className="grid grid-cols-2 gap-2 my-4 bg-[#0F1216] p-3 border border-[#2C3E50]/40 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-[#4A6572] uppercase block font-sans">Current SIP</span>
                  <span className="text-[#E2E8F0] font-bold">
                    ₹{Math.round(asset.currentMonthly).toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[#10b981] uppercase block font-sans">Recommended Target</span>
                  <span className="text-[#10b981] font-bold">
                    ₹{asset.recommendedMonthly.toLocaleString('en-IN')}/mo ({(asset.recommendedShare * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Annual Returns Breakdown */}
              <div className="space-y-1.5 text-xs font-mono py-2 border-t border-[#2C3E50]/40">
                <div className="flex justify-between text-[#4A6572]">
                  <span>Est. Gross Return (1-Yr):</span>
                  <span>+₹{Math.round(asset.grossProfitAnnual).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#8B3A3A]">
                  <span>Applicable Tax Drag:</span>
                  <span>-₹{Math.round(asset.taxApplicable).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#10b981] font-bold pt-1 border-t border-[#2C3E50]/20">
                  <span>Est. Post-Tax Profit:</span>
                  <span>+₹{Math.round(asset.netProfitAnnual).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Strategic Guidance Footer */}
            <div className="mt-4 pt-3 border-t border-[#2C3E50]/40 text-[11px] leading-relaxed">
              {asset.isWaste ? (
                <div className="text-amber-400 bg-amber-500/10 p-2.5 border border-amber-500/20">
                  <strong>Risk:</strong> {asset.wasteWarning}
                  <div className="text-[#E2E8F0] mt-1">
                    <strong>Action:</strong> {asset.pivotRecommendation}
                  </div>
                </div>
              ) : (
                <div className="text-[#4A6572]">
                  <strong className="text-blue-400 font-sans">Tax Strategy:</strong> {asset.taxAdvantageNote}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default InvestmentAuditor;