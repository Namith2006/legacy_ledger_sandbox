import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { supabase } from './supabaseClient';
import TrajectoryChart from './components/TrajectoryChart';
import ScenarioControls from './components/ScenarioControls';
import ResultsSummary from './components/ResultsSummary';
import ExpertAdvisor from './components/ExpertAdvisor';
import AssetAllocationChart from './components/AssetAllocationChart';
import StrategyEngine from './components/StrategyEngine';
import RankBadge from './components/RankBadge';
import MilestoneBuckets from './components/MilestoneBuckets';
import TaxOptimizer from './components/TaxOptimizer';
import EmergencyRunway from './components/EmergencyRunway';
import FireTracker from './components/FireTracker';
import YearlyLedger from './components/YearlyLedger';
import SinkingFunds from './components/SinkingFunds'; // <-- NEW IMPORT ADDED

export type AssetClass = 'equity' | 'debt' | 'gold' | 'liquid';

export interface CashFlowItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'annual';
  assetClass?: AssetClass;
}

export interface Milestone {
  id: string;
  name: string;
  target: number;
}

export interface MarketReturns {
  equity: number;
  debt: number;
  gold: number;
  liquid: number;
}

const loadState = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(`legacyMilestone_${key}`);
  return saved ? JSON.parse(saved) : defaultValue;
};

const App: React.FC = () => {
  const [currentSavings, setCurrentSavings] = useState<number>(() => loadState('savings', 100000));
  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => loadState('income', 60000));
  const [annualIncomeGrowth, setAnnualIncomeGrowth] = useState<number>(() => loadState('incomeGrowth', 10));
  const [inflationAdjusted, setInflationAdjusted] = useState<boolean>(() => loadState('inflation', false));
  
  const [marketReturns, setMarketReturns] = useState<MarketReturns>(() => loadState('marketReturns', {
    equity: 12, debt: 8, gold: 10, liquid: 5
  }));
  
  const [expenses, setExpenses] = useState<CashFlowItem[]>(() => loadState('expenses', [
    { id: '1', name: 'Rent', amount: 15000, frequency: 'monthly' },
    { id: '2', name: 'BCA Tuition Fee', amount: 80000, frequency: 'annual' },
  ]));
  
  const [investments, setInvestments] = useState<CashFlowItem[]>(() => loadState('investments', [
    { id: '1', name: 'Index Funds', amount: 8000, frequency: 'monthly', assetClass: 'equity' },
    { id: '2', name: 'PPF / EPF', amount: 2000, frequency: 'monthly', assetClass: 'debt' }
  ]));

  const [milestones, setMilestones] = useState<Milestone[]>(() => loadState('milestones', [
    { id: '1', name: 'Parental Care & Spoil Fund', target: 2000000 },
    { id: '2', name: 'Ultimate Legacy', target: 5000000 }
  ]));

  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- AUTH & SUPABASE STATE ---
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('legacyMilestone_savings', JSON.stringify(currentSavings));
    localStorage.setItem('legacyMilestone_income', JSON.stringify(monthlyIncome));
    localStorage.setItem('legacyMilestone_incomeGrowth', JSON.stringify(annualIncomeGrowth));
    localStorage.setItem('legacyMilestone_expenses', JSON.stringify(expenses));
    localStorage.setItem('legacyMilestone_investments', JSON.stringify(investments));
    localStorage.setItem('legacyMilestone_milestones', JSON.stringify(milestones));
    localStorage.setItem('legacyMilestone_marketReturns', JSON.stringify(marketReturns));
    localStorage.setItem('legacyMilestone_inflation', JSON.stringify(inflationAdjusted));
  }, [currentSavings, monthlyIncome, annualIncomeGrowth, expenses, investments, milestones, marketReturns, inflationAdjusted]);

  const getMonthlyEquivalent = (items: CashFlowItem[]) => items.reduce((sum, item) => sum + (item.frequency === 'annual' ? item.amount / 12 : item.amount), 0);
  const totalMonthlyExpenses = getMonthlyEquivalent(expenses);
  const totalMonthlyInvestments = getMonthlyEquivalent(investments);
  const availableCash = Math.max(0, monthlyIncome - totalMonthlyExpenses);
  const actualInvested = Math.min(totalMonthlyInvestments, availableCash);

  const { lifetimeIncome, lifetimeInvested, chartData, ledgerData } = useMemo(() => {
    let incomeTotal = 0;
    let investedTotal = 0;
    const data = [];
    const lData = [];
    const monthlyInflation = (6 / 100) / 12;
    let balances = { equity: 0, debt: 0, gold: 0, liquid: currentSavings };

    data.push({ date: 'Today', value: currentSavings });

    let currentTotalBalance = currentSavings;

    for (let year = 1; year <= 10; year++) {
      const startingBalance = currentTotalBalance;
      let yearlyInvested = 0;

      const hikeMultiplier = Math.pow(1 + annualIncomeGrowth / 100, year - 1);
      const yearlyScaledInvestments = totalMonthlyInvestments * hikeMultiplier;
      const yearlyScaledIncome = monthlyIncome * hikeMultiplier;
      const yearlyAvailableCash = Math.max(0, yearlyScaledIncome - totalMonthlyExpenses);
      const monthlyActualInvested = Math.min(yearlyScaledInvestments, yearlyAvailableCash);
      const investedRatio = yearlyScaledInvestments > 0 ? Math.min(1, yearlyAvailableCash / yearlyScaledInvestments) : 0;

      incomeTotal += yearlyScaledIncome * 12;
      investedTotal += monthlyActualInvested * 12;

      for (let month = 1; month <= 12; month++) {
        investments.forEach(inv => {
           const monthlyAmount = (inv.frequency === 'annual' ? inv.amount / 12 : inv.amount) * hikeMultiplier * investedRatio;
           const assetClass = inv.assetClass || 'liquid';
           balances[assetClass] += monthlyAmount;
           yearlyInvested += monthlyAmount;
        });
        balances.equity *= (1 + (marketReturns.equity / 100) / 12);
        balances.debt *= (1 + (marketReturns.debt / 100) / 12);
        balances.gold *= (1 + (marketReturns.gold / 100) / 12);
        balances.liquid *= (1 + (marketReturns.liquid / 100) / 12);
      }

      currentTotalBalance = balances.equity + balances.debt + balances.gold + balances.liquid;
      const marketReturnsEarned = currentTotalBalance - startingBalance - yearlyInvested;
      
      let displayValue = currentTotalBalance;
      let displayStart = startingBalance;
      let displayInvested = yearlyInvested;
      let displayReturns = marketReturnsEarned;

      // Adjust ledger display math for inflation
      if (inflationAdjusted) {
        const monthsElapsed = year * 12;
        const prevMonthsElapsed = (year - 1) * 12;
        const discountFactor = Math.pow(1 + monthlyInflation, monthsElapsed);
        const prevDiscountFactor = Math.pow(1 + monthlyInflation, prevMonthsElapsed);
        
        displayValue = currentTotalBalance / discountFactor;
        displayStart = startingBalance / prevDiscountFactor;
        displayInvested = yearlyInvested / discountFactor;
        displayReturns = displayValue - displayStart - displayInvested;
      }

      data.push({ date: `Year ${year}`, value: Math.round(displayValue) });
      lData.push({
        year,
        startingBalance: Math.round(displayStart),
        invested: Math.round(displayInvested),
        returns: Math.round(displayReturns),
        endBalance: Math.round(displayValue)
      });
    }

    return { lifetimeIncome: incomeTotal, lifetimeInvested: investedTotal, chartData: data, ledgerData: lData };
  }, [currentSavings, monthlyIncome, totalMonthlyExpenses, totalMonthlyInvestments, investments, marketReturns, annualIncomeGrowth, inflationAdjusted]);

  const finalWealth = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true); 
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dataUrl = await toPng(reportRef.current, { backgroundColor: '#0F1216', pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Legacy_Ledger_Projection.pdf');
    } catch (error: any) {
      console.error("PDF Gen Failed:", error);
      alert(`PDF Error: ${error.message}`);
    } finally { setIsExporting(false); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        alert("Success! Check your email for a confirmation link (if enabled in Supabase) or you are now logged in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
      setShowAuthModal(false);
    } catch (error: any) {
      alert(`Auth Error: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const syncToSupabase = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('scenarios').insert({
        user_id: user.id,
        scenario_name: `Projection Snapshot - ${new Date().toLocaleDateString()}`,
        current_savings: currentSavings,
        monthly_income: monthlyIncome,
        annual_income_growth: annualIncomeGrowth,
        inflation_adjusted: inflationAdjusted,
        market_returns: marketReturns,
        expenses: expenses,
        investments: investments,
        milestones: milestones
      });

      if (error) throw error;
      alert("Success! Your scenario has been permanently secured in the Legacy Ledger database.");
    } catch (error: any) {
      console.error(error);
      alert(`Sync Failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#0F1216] text-[#E2E8F0] p-6 md:p-8 font-sans selection:bg-[#2C3E50] relative">
      
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#0F1216] border border-[#2C3E50] p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-[#4A6572] hover:text-[#E2E8F0]">✕</button>
            <h2 className="text-xl font-light text-[#E2E8F0] uppercase tracking-widest mb-6 text-center">
              {authMode === 'login' ? 'Access Ledger' : 'Initialize Account'}
            </h2>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email Address" required className="bg-[#181C28] border border-[#2C3E50] p-3 text-sm focus:border-[#4A6572] outline-none" />
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" required className="bg-[#181C28] border border-[#2C3E50] p-3 text-sm focus:border-[#4A6572] outline-none" />
              <button type="submit" disabled={authLoading} className="bg-[#2C3E50] hover:bg-[#4A6572] text-[#E2E8F0] p-3 text-xs uppercase tracking-widest transition-colors mt-2">
                {authLoading ? 'Processing...' : (authMode === 'login' ? 'Secure Login' : 'Create Account')}
              </button>
            </form>
            <div className="mt-6 text-center text-xs text-[#4A6572]">
              {authMode === 'login' ? "Don't have an account? " : "Already established? "}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[#34d399] hover:underline uppercase tracking-widest ml-1">
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full mx-auto">
        <header className="mb-8 border-b border-[#2C3E50] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-light text-[#E2E8F0] uppercase tracking-widest">Legacy Milestone</h1>
            <p className="text-[#4A6572] mt-2 text-xs uppercase tracking-widest">Disciplined Wealth Projection</p>
          </div>
          <div className="flex gap-3 items-center">
            {user && (
              <button onClick={logout} className="text-[#4A6572] text-[10px] uppercase tracking-widest hover:text-[#E2E8F0] mr-2">
                Sign Out
              </button>
            )}
            <button onClick={downloadPDF} disabled={isExporting} className={`border border-[#2C3E50] text-[#E2E8F0] px-4 py-2 text-xs uppercase tracking-widest transition-colors flex items-center justify-center min-w-35 ${isExporting ? 'bg-[#2C3E50] opacity-70 cursor-wait' : 'hover:bg-[#2C3E50]'}`}>
              {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
            <button onClick={syncToSupabase} disabled={isSyncing} className="bg-[#2C3E50] hover:bg-[#4A6572] text-[#E2E8F0] px-4 py-2 text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user ? 'bg-[#10b981]' : 'bg-amber-500'} animate-pulse`}></span> 
              {isSyncing ? 'Syncing...' : 'Sync DB'}
            </button>
          </div>
        </header>

        <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-1">
          <div className="lg:col-span-4">
            
            <RankBadge 
              currentSavings={currentSavings} 
              availableCash={availableCash} 
              monthlyIncome={monthlyIncome} 
            />

            <ScenarioControls 
              currentSavings={currentSavings} setCurrentSavings={setCurrentSavings}
              monthlyIncome={monthlyIncome} setMonthlyIncome={setMonthlyIncome}
              annualIncomeGrowth={annualIncomeGrowth} setAnnualIncomeGrowth={setAnnualIncomeGrowth}
              expenses={expenses} setExpenses={setExpenses}
              investments={investments} setInvestments={setInvestments}
              totalExpenses={totalMonthlyExpenses} totalInvestments={totalMonthlyInvestments}
              availableCash={availableCash} actualInvested={actualInvested}
              marketReturns={marketReturns} setMarketReturns={setMarketReturns}
              milestones={milestones} setMilestones={setMilestones}
              inflationAdjusted={inflationAdjusted} setInflationAdjusted={setInflationAdjusted}
            />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-8">
            <TrajectoryChart data={chartData} milestones={milestones} inflationAdjusted={inflationAdjusted} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <ResultsSummary 
                  currentSavings={currentSavings} lifetimeInvested={lifetimeInvested} 
                  lifetimeIncome={lifetimeIncome} finalWealth={finalWealth} 
                  targetYear="Evaluated" totalExpenses={totalMonthlyExpenses} 
                />
              </div>
              <div className="md:col-span-1">
                <AssetAllocationChart investments={investments} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <EmergencyRunway currentSavings={currentSavings} totalMonthlyExpenses={totalMonthlyExpenses} />
              <FireTracker currentSavings={currentSavings} totalMonthlyExpenses={totalMonthlyExpenses} />
            </div>

            <YearlyLedger ledgerData={ledgerData} />

            {/* ---> MOVED INSIDE THE COL-SPAN-8 TO FIX THE LAYOUT GAP <--- */}
            <TaxOptimizer 
              monthlyIncome={monthlyIncome} 
              investments={investments} 
              totalMonthlyExpenses={totalMonthlyExpenses} 
            />

            <SinkingFunds />

            <MilestoneBuckets 
              currentSavings={currentSavings} 
              milestones={milestones} 
            />

          </div>
        </div>

        <StrategyEngine 
          currentSavings={currentSavings}
          availableCash={availableCash}
          targetGoal={milestones.length > 0 ? milestones[milestones.length - 1].target : 0}
          investments={investments}
          setInvestments={setInvestments}
        />

      </div>
      <ExpertAdvisor 
        currentSavings={currentSavings} monthlyIncome={monthlyIncome}
        availableCash={availableCash} targetGoal={milestones.length > 0 ? milestones[milestones.length -1].target : 0}
        investments={investments} setInvestments={setInvestments}
        expenses={expenses} setExpenses={setExpenses}
        milestones={milestones} setMilestones={setMilestones}
      />
    </div>
  );
};

export default App;