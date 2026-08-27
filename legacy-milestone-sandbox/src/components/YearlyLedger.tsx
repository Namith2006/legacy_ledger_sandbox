import React from 'react';

export interface LedgerRow {
  year: number;
  startingBalance: number;
  invested: number;
  returns: number;
  endBalance: number;
}

interface YearlyLedgerProps {
  ledgerData: LedgerRow[];
}

const YearlyLedger: React.FC<YearlyLedgerProps> = ({ ledgerData }) => {
  if (ledgerData.length === 0) return null;

  return (
    <div className="bg-[#0F1216] border border-[#2C3E50] overflow-hidden">
      <div className="p-4 border-b border-[#2C3E50] bg-[#181C28]">
        <h3 className="text-[#E2E8F0] font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
          <span>📖</span> The Legacy Ledger
        </h3>
        <p className="text-[#4A6572] text-xs mt-1">Decade-long mathematical breakdown</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono whitespace-nowrap">
          <thead className="bg-[#181C28]/50 text-[#4A6572] text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-4 font-normal">Year</th>
              <th className="p-4 font-normal">Starting Capital</th>
              <th className="p-4 font-normal text-blue-400">Capital Deployed</th>
              <th className="p-4 font-normal text-[#10b981]">Market Returns</th>
              <th className="p-4 font-normal text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C3E50]/30">
            {ledgerData.map((row) => (
              <tr key={row.year} className="hover:bg-[#181C28] transition-colors">
                <td className="p-4 text-[#E2E8F0]">Year {row.year}</td>
                <td className="p-4 text-[#4A6572]">₹{row.startingBalance.toLocaleString('en-IN')}</td>
                <td className="p-4 text-blue-400/80">+₹{row.invested.toLocaleString('en-IN')}</td>
                <td className="p-4 text-[#10b981]/80">+₹{row.returns.toLocaleString('en-IN')}</td>
                <td className="p-4 text-[#E2E8F0] font-bold text-right">₹{row.endBalance.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyLedger;