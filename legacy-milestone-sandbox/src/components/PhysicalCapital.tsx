import React, { useState } from 'react';
import type { CashFlowItem } from '../App';

interface PhysicalCapitalProps {
  expenses: CashFlowItem[];
}

const PhysicalCapital: React.FC<PhysicalCapitalProps> = ({ expenses }) => {
  // Auto-detect gym expenses from the ledger
  const gymExpense = expenses.find(e => e.name.toLowerCase().includes('gym') || e.name.toLowerCase().includes('fitness'));
  const monthlyGymCost = gymExpense ? (gymExpense.frequency === 'annual' ? gymExpense.amount / 12 : gymExpense.amount) : 0;

  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number>(6); // Defaulting to an almost daily routine
  
  const monthlyWorkouts = workoutsPerWeek * 4.33; // Avg weeks in a month
  const costPerWorkout = monthlyWorkouts > 0 ? monthlyGymCost / monthlyWorkouts : 0;
  
  // Gamification tiers
  const isOptimal = workoutsPerWeek >= 5;
  const isWastingMoney = workoutsPerWeek <= 2 && monthlyGymCost > 0;

  if (monthlyGymCost === 0) return null; // Hide if no gym membership is being tracked

  return (
    <div className="bg-[#181C28] border border-[#2C3E50] p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[#E2E8F0] text-lg font-semibold tracking-wide flex items-center gap-2">
            <span>🏋️</span> Physical Capital
          </h2>
          <p className="text-[#4A6572] text-sm mt-1">Gym ROI & Cost-Per-Use Tracking</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-[#4A6572] block">Cost Per Session</span>
          <span className={`font-bold text-lg ${isOptimal ? 'text-[#10b981]' : isWastingMoney ? 'text-amber-500' : 'text-[#E2E8F0]'}`}>
            ₹{costPerWorkout.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-[#E2E8F0] uppercase tracking-widest">Attendance Frequency</span>
            <span className="text-[#10b981] font-mono">{workoutsPerWeek} days/wk</span>
          </div>
          <input 
            type="range" min="0" max="7" step="1" 
            value={workoutsPerWeek} 
            onChange={(e) => setWorkoutsPerWeek(Number(e.target.value))}
            className="w-full accent-[#10b981] h-1 bg-[#0F1216] rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2C3E50]/50">
          <div className="bg-[#0F1216] p-3 border border-[#2C3E50]/30 rounded-sm">
            <div className="text-[9px] text-[#4A6572] uppercase tracking-widest mb-1">Monthly Sunk Cost</div>
            <div className="text-[#8B3A3A] font-mono text-sm font-bold">₹{monthlyGymCost.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-[#0F1216] p-3 border border-[#2C3E50]/30 rounded-sm">
            <div className="text-[9px] text-[#4A6572] uppercase tracking-widest mb-1">Monthly Sessions</div>
            <div className="text-[#10b981] font-mono text-sm font-bold">{monthlyWorkouts.toFixed(0)} Workouts</div>
          </div>
        </div>
      </div>

      {/* Routine Analytics */}
      <div className="mt-4 pt-4 border-t border-[#2C3E50]">
        <div className="text-[10px] uppercase tracking-widest text-[#4A6572] mb-3">Hypertrophy Load Trackers</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono bg-[#0F1216] p-2 border border-[#2C3E50]/20">
            <span className="text-[#E2E8F0]">Barbell Bench Press</span>
            <span className="text-[#4A6572]">Primary Push</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono bg-[#0F1216] p-2 border border-[#2C3E50]/20">
            <span className="text-[#E2E8F0]">Incline Dumbbell Press</span>
            <span className="text-[#4A6572]">Upper Bias</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono bg-[#0F1216] p-2 border border-[#2C3E50]/20">
            <span className="text-[#E2E8F0]">Weighted Chest Dips</span>
            <span className="text-[#4A6572]">Lower/Tricep</span>
          </div>
        </div>
      </div>

      <div className="mt-5 text-[10px] text-[#4A6572] leading-relaxed">
        {isOptimal 
          ? "Excellent financial efficiency. Your daily routine is driving your cost-per-workout down to optimal levels. High physical ROI." 
          : isWastingMoney 
          ? "Warning: Low attendance is inflating your cost-per-workout. You are subsidizing the gym for daily users. Increase frequency to improve ROI." 
          : "Moderate efficiency. Increasing your weekly attendance will lower your cost-per-session and improve physical capital."}
      </div>
    </div>
  );
};

export default PhysicalCapital;