import React from 'react';

interface LedgerRow {
  year: number;
  startingBalance: number;
  invested: number;
  returns: number;
  endBalance: number;
}

interface YearlyLedgerProps {
  ledgerData: LedgerRow[];
  inflationAdjusted: boolean;
}

const YearlyLedger: React.FC<YearlyLedgerProps> = ({ ledgerData, inflationAdjusted }) => {
  if (!ledgerData || ledgerData.length === 0) return null;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] p-6 mt-4">
      {/* Dynamic Header */}
      <div className="mb-6">
        <h3 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
          <span>📖</span> The Legacy Ledger
        </h3>
        <p className="text-[#4A6572] text-sm mt-1">
          {inflationAdjusted 
            ? "Decade-long projection showing Real Purchasing Power (adjusted for 6% annual inflation)."
            : "Decade-long nominal mathematical breakdown (ignores inflation)."}
        </p>
      </div>

      {/* Contextual Explainer Banner */}
      {inflationAdjusted && (
        <div className="mb-6 bg-[#8B3A3A]/10 border border-[#8B3A3A]/30 p-4 rounded text-sm">
          <strong className="text-[#8B3A3A] font-bold block mb-1 uppercase tracking-widest text-xs flex items-center gap-2">
            <span>⚠️</span> Purchasing Power Impact
          </strong>
          <span className="text-[#E2E8F0] text-xs leading-relaxed">
            These numbers have been deflated to show what your future wealth will buy in <strong>today's value</strong>. 
            If your "Real Market Returns" are negative, it means your current asset mix is growing slower than the 6% inflation rate, resulting in a silent loss of wealth.
          </span>
        </div>
      )}

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[#2C3E50] text-[10px] uppercase tracking-widest text-[#4A6572]">
              <th className="py-3 font-normal">Year</th>
              <th className="py-3 font-normal">Starting Capital</th>
              <th className="py-3 font-normal">Capital Deployed</th>
              <th className="py-3 font-normal">{inflationAdjusted ? "Real Market Returns" : "Market Returns"}</th>
              <th className="py-3 font-normal text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {ledgerData.map((row) => (
              <tr key={row.year} className="border-b border-[#2C3E50]/30 hover:bg-[#181C28] transition-colors">
                <td className="py-4 text-[#E2E8F0] font-sans text-xs uppercase tracking-widest">Year {row.year}</td>
                <td className="py-4 text-[#4A6572]">₹{row.startingBalance.toLocaleString('en-IN')}</td>
                <td className="py-4 text-blue-400">+₹{row.invested.toLocaleString('en-IN')}</td>
                <td className={`py-4 ${row.returns < 0 ? 'text-[#8B3A3A]' : 'text-[#10b981]'}`}>
                  {/* Safely handle negative signs so it doesn't render "+₹-26,000" */}
                  {row.returns < 0 ? '-' : '+'}₹{Math.abs(row.returns).toLocaleString('en-IN')}
                </td>
                <td className="py-4 text-right font-bold text-[#E2E8F0]">₹{row.endBalance.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyLedger;