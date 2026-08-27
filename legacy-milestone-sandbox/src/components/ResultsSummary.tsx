import React, { useState } from 'react';

interface ResultsSummaryProps {
  currentSavings: number;
  lifetimeInvested: number;
  lifetimeIncome: number;
  finalWealth: number;
  targetYear: string;
  totalExpenses: number;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  currentSavings,
  lifetimeInvested,
  lifetimeIncome,
  finalWealth,
  targetYear,
  totalExpenses
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const lifetimeExpenses = totalExpenses * 120; // 10 years of flat expenses
  const totalInterest = finalWealth - currentSavings - lifetimeInvested;

  const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

  const cardClasses = "bg-[#181C28] border border-[#2C3E50] p-6 flex flex-col justify-center items-center text-center w-full";
  const smallCardClasses = "bg-[#181C28] border border-[#2C3E50] py-5 flex flex-col justify-center items-center text-center w-full";
  const labelClasses = "text-[#4A6572] text-xs uppercase tracking-widest mb-2 block";
  const valueClasses = "text-2xl font-light text-[#E2E8F0]";

  return (
    <div className="flex flex-col gap-6 w-full">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div 
          onClick={() => setIsModalOpen(true)}
          className={`${cardClasses} cursor-pointer hover:border-[#4A6572] hover:bg-[#0F1216] transition-all group relative`}
        >
          <span className={labelClasses}>10-Year Final Wealth</span>
          <span className={`${valueClasses} text-3xl text-[#34d399]/90 group-hover:text-[#6ee7b7] transition-colors`}>
            {formatCurrency(finalWealth)}
          </span>
          <span className="text-[#4A6572] text-[10px] uppercase tracking-widest mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
            View Breakdown →
          </span>
        </div>

        <div className={cardClasses}>
          <span className={labelClasses}>Target Milestone Reached</span>
          <span className={valueClasses}>{targetYear}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className={smallCardClasses}>
          <span className={labelClasses}>10-Yr Total Income</span>
          <span className="text-xl font-light text-[#E2E8F0]">{formatCurrency(lifetimeIncome)}</span>
        </div>
        
        <div className={smallCardClasses}>
          <span className={labelClasses}>10-Yr Total Invested</span>
          <span className="text-xl font-light text-[#E2E8F0]">{formatCurrency(lifetimeInvested)}</span>
        </div>

        <div className={smallCardClasses}>
          <span className={labelClasses}>10-Yr Total Returns</span>
          <span className="text-xl font-light text-[#34d399]/90">+{formatCurrency(Math.max(0, totalInterest))}</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#0F1216] border border-[#2C3E50] p-8 max-w-md w-full text-[#E2E8F0] shadow-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-widest border-b border-[#2C3E50] pb-4 mb-6 text-center text-[#4A6572]">
              Net Worth Breakdown
            </h2>

            <div className="flex flex-col gap-4 text-sm tracking-wide">
              <div className="flex justify-between items-center">
                <span className="text-[#4A6572]">Base Savings:</span>
                <span>{formatCurrency(currentSavings)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[#4A6572]">10-Yr Contributions (Stepped-Up):</span>
                <span>+ {formatCurrency(lifetimeInvested)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[#4A6572]">10-Yr Interest Earned:</span>
                <span className="text-[#34d399]/90">+ {formatCurrency(Math.max(0, totalInterest))}</span>
              </div>

              <div className="border-t border-[#2C3E50] my-2"></div>

              <div className="flex justify-between items-center font-bold text-lg">
                <span className="text-[#E2E8F0] uppercase text-xs tracking-widest">Total Value:</span>
                <span className="text-[#34d399]/90">{formatCurrency(finalWealth)}</span>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-[#2C3E50]/50 flex justify-between items-center text-xs">
                <span className="text-[#8B3A3A]/80 uppercase tracking-widest">Lifetime Expenses Paid:</span>
                <span className="text-[#8B3A3A]/80">- {formatCurrency(lifetimeExpenses)}</span>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              className="border border-[#2C3E50] hover:bg-[#2C3E50] px-4 py-3 mt-8 w-full text-xs uppercase tracking-widest transition-colors text-[#E2E8F0]"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResultsSummary;