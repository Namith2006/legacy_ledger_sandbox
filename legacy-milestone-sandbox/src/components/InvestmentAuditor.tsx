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
}

// 1. ADDED TYPESCRIPT INTERFACES TO FIX THE ANY[] ERRORS
interface AuditAlert {
  target: string;
  issue: string;
  math: string;
  verdict: string;
  pivot: string;
}

interface AuditPraise {
  target: string;
  reason: string;
  taxNote: string;
}

const InvestmentAuditor: React.FC<InvestmentAuditorProps> = ({ investments, monthlyIncome }) => {
  const annualIncome = monthlyIncome * 12;
  
  const taxSlab = annualIncome > 1500000 ? 0.30 : (annualIncome > 1000000 ? 0.20 : (annualIncome > 500000 ? 0.10 : 0));
  const slabPercentage = taxSlab * 100;

  const analysis = useMemo(() => {
    // 2. APPLIED THE INTERFACES TO THE ARRAYS
    const alerts: AuditAlert[] = [];
    const praises: AuditPraise[] = [];
    let totalInefficientCapital = 0;

    investments.forEach(inv => {
      const annualAmount = inv.frequency === 'annual' ? inv.amount : inv.amount * 12;
      const name = inv.name.toLowerCase();
      const assetClass = inv.assetClass || 'liquid';

      if (name.includes('fd') || name.includes('fixed deposit') || name.includes('rd')) {
        const grossReturn = 7.0;
        const netReturn = grossReturn * (1 - taxSlab);
        totalInefficientCapital += annualAmount;
        alerts.push({
          target: inv.name,
          issue: `Taxed at marginal slab (${slabPercentage}%)`,
          math: `${grossReturn}% Gross → ${netReturn.toFixed(1)}% Net`,
          verdict: netReturn < 6.0 ? 'Losing to 6% inflation.' : 'Sub-optimal post-tax yield.',
          pivot: 'Pivot to Equity Mutual Funds (12.5% LTCG tax) or PPF for tax-free fixed returns.'
        });
      } 
      else if (name.includes('lic') || name.includes('endowment') || name.includes('ulip')) {
        totalInefficientCapital += annualAmount;
        alerts.push({
          target: inv.name,
          issue: 'Mixing Insurance with Investment',
          math: 'Est. 4-5% Net Yield',
          verdict: 'High hidden agent commissions and lock-in periods drastically reduce real returns.',
          pivot: 'Surrender policy if possible. Buy pure Term Insurance and invest the difference in Index Funds.'
        });
      }
      else if (assetClass === 'liquid' || name.includes('savings')) {
         totalInefficientCapital += annualAmount;
         alerts.push({
          target: inv.name,
          issue: `Idle Cash Drag`,
          math: `3% Gross → ${(3 * (1 - taxSlab)).toFixed(1)}% Net`,
          verdict: 'Severe loss of purchasing power over time.',
          pivot: 'Keep only 6 months emergency funds here. Sweep the rest into high-growth assets.'
        });
      }
      else if (assetClass === 'gold' || name.includes('gold')) {
        if (name.includes('digital') || name.includes('physical')) {
          alerts.push({
            target: inv.name,
            issue: 'Inefficient Holding Format',
            math: 'Subject to 12.5% LTCG + making charges/spreads',
            verdict: 'You are paying premiums just to hold this asset.',
            pivot: 'Pivot to Sovereign Gold Bonds (SGBs). You get capital appreciation + 2.5% extra annual interest, and maturity is 100% tax-free.'
          });
        } else {
          praises.push({
            target: inv.name,
            reason: 'Excellent hedge against market volatility.',
            taxNote: 'SGBs held to maturity are completely exempt from Capital Gains tax.'
          });
        }
      }
      else if (assetClass === 'equity' || name.includes('index') || name.includes('mutual fund') || name.includes('equity')) {
        let specializedNote = '';
        if (name.includes('defense') || name.includes('psu') || name.includes('bel')) {
           specializedNote = 'Sectoral/Defense equities offer aggressive alpha during government cap-ex cycles, though with higher volatility.';
        }

        praises.push({
          target: inv.name,
          reason: 'High Probability Compounder. ' + specializedNote,
          taxNote: 'Highly tax-efficient. Long Term Capital Gains (LTCG) are taxed at only 12.5% on profits exceeding ₹1.25 Lakh per year.'
        });
      }
      else if (name.includes('ppf') || name.includes('epf')) {
        praises.push({
          target: inv.name,
          reason: 'The ultimate debt instrument.',
          taxNote: 'EEE Status (Exempt-Exempt-Exempt). Your principal, interest, and maturity amounts are 100% tax-free. Untouchable by income tax slabs.'
        });
      }
    });

    return { alerts, praises, totalInefficientCapital };
  }, [investments, taxSlab, slabPercentage]);

  if (investments.length === 0) return null;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] overflow-hidden mt-8">
      <div className="p-4 border-b border-[#2C3E50] bg-[#181C28] flex justify-between items-center">
        <div>
          <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
            <span>🔬</span> Automated Portfolio Audit
          </h3>
          <p className="text-[#4A6572] text-[10px] uppercase tracking-widest mt-1">
            Tax-Adjusted Yield Analysis at {slabPercentage}% Income Slab
          </p>
        </div>
      </div>

      <div className="p-6">
        {analysis.totalInefficientCapital > 0 && (
          <div className="mb-6 bg-[#8B3A3A]/10 border border-[#8B3A3A]/30 p-4 rounded text-sm">
            <span className="text-[#8B3A3A] font-bold block mb-1 uppercase tracking-widest text-xs">⚠️ Capital Drag Detected</span>
            <span className="text-[#E2E8F0]">
              You have <strong className="text-amber-500 font-mono">₹{analysis.totalInefficientCapital.toLocaleString('en-IN')}</strong> deployed in structurally inefficient assets this year. 
              Taxes and inflation are severely degrading these returns.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest border-b border-[#2C3E50] pb-2">
              Action Required (Waste)
            </h4>
            {analysis.alerts.length === 0 ? (
              <div className="text-[#4A6572] text-xs italic">No inefficient assets detected. Your portfolio is highly optimized.</div>
            ) : (
              analysis.alerts.map((alert, idx) => (
                <div key={idx} className="bg-[#181C28] border border-[#2C3E50]/50 p-4 rounded relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
                  <strong className="text-[#E2E8F0] text-sm block mb-2">{alert.target}</strong>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                       <span className="text-[#4A6572]">Tax Impact:</span>
                       <span className="text-[#8B3A3A] font-mono">{alert.math}</span>
                    </div>
                    <div className="text-[#E2E8F0] pt-2 border-t border-[#2C3E50]/30">
                       <span className="text-amber-500 mr-1">Verdict:</span> {alert.verdict}
                    </div>
                    <div className="text-[#10b981] bg-[#10b981]/10 p-2 rounded mt-2">
                       <strong>Recommendation:</strong> {alert.pivot}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-[#10b981] text-xs font-bold uppercase tracking-widest border-b border-[#2C3E50] pb-2">
              Optimal Allocations (Keep)
            </h4>
            {analysis.praises.length === 0 ? (
              <div className="text-[#4A6572] text-xs italic">No optimal high-growth assets detected. Consider restructuring.</div>
            ) : (
              analysis.praises.map((praise, idx) => (
                <div key={idx} className="bg-[#181C28] border border-[#10b981]/20 p-4 rounded relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#10b981]"></div>
                  <strong className="text-[#E2E8F0] text-sm block mb-2">{praise.target}</strong>
                  <div className="space-y-2 text-xs text-[#E2E8F0]">
                    <div>{praise.reason}</div>
                    <div className="text-[#4A6572] pt-2 border-t border-[#2C3E50]/30 text-[11px] leading-relaxed">
                       <strong className="text-blue-400">Tax Advantage:</strong> {praise.taxNote}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentAuditor;