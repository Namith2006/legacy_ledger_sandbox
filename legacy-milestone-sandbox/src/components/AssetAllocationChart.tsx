import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CashFlowItem } from '../App';

interface AssetAllocationChartProps {
  investments: CashFlowItem[];
}

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ investments }) => {
  const data = [
    { name: 'Equity', value: 0, color: '#E2E8F0' },
    { name: 'Debt/Bonds', value: 0, color: '#4A6572' },
    { name: 'Gold/Commodities', value: 0, color: '#2C3E50' },
    { name: 'Liquid/Cash', value: 0, color: '#34d399' }
  ];

  investments.forEach(inv => {
    const amount = inv.frequency === 'annual' ? inv.amount / 12 : inv.amount;
    const index = data.findIndex(d => d.name.toLowerCase().includes(inv.assetClass || 'liquid'));
    if (index !== -1) data[index].value += amount;
  });

  const activeData = data.filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F1216] border border-[#2C3E50] p-3 shadow-xl">
          <p className="text-[#4A6572] text-xs uppercase tracking-widest">{payload[0].name}</p>
          <p className="text-[#E2E8F0] font-light">₹{Math.round(payload[0].value).toLocaleString('en-IN')}/mo</p>
        </div>
      );
    }
    return null;
  };

  if (activeData.length === 0) return null;

  return (
    <div className="bg-[#181C28] border border-[#2C3E50] p-6 w-full h-[300px] flex flex-col">
      <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2">
        Asset Allocation (Monthly)
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetAllocationChart;