import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import type { Milestone } from '../App';

interface TrajectoryChartProps {
  data: { date: string; value: number }[];
  milestones: Milestone[];
  inflationAdjusted: boolean;
}

const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ data, milestones, inflationAdjusted }) => {
  
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F1216] border border-[#2C3E50] p-4 shadow-xl">
          <p className="text-[#4A6572] text-xs uppercase tracking-widest mb-2">{label}</p>
          {/* Scrubbed Tailwind named color here! */}
          <p className="text-[#34d399]/90 font-light text-lg">
            {formatCurrency(payload[0].value)}
          </p>
          {inflationAdjusted && (
            <p className="text-[#8B3A3A] text-[10px] uppercase tracking-widest mt-1">Adjusted for 6% Inflation</p>
          )}
        </div>
      );
    }
    return null;
  };

  const milestoneColors = ['#4A6572', '#E2E8F0', '#8B3A3A'];

  return (
    <div className="bg-[#181C28] border border-[#2C3E50] p-6 w-full h-125 flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-[#2C3E50] pb-2">
        <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest">
          10-Year Wealth Trajectory
        </h3>
        {inflationAdjusted && <span className="text-[#8B3A3A] text-xs uppercase tracking-widest">Real Value (Discounted)</span>}
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
            <XAxis 
              dataKey="date" stroke="#4A6572" fontSize={12} tickLine={false} axisLine={false}
              ticks={data.filter(d => d.date.includes('Year') || d.date === 'Today').map(d => d.date)}
            />
            <YAxis 
              stroke="#4A6572" fontSize={12} tickFormatter={formatCurrency} tickLine={false} axisLine={false} width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4A6572', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {milestones.map((milestone, index) => (
              milestone.target > 0 && (
                <ReferenceLine 
                  key={milestone.id} y={milestone.target} 
                  stroke={milestoneColors[index % milestoneColors.length]} strokeDasharray="4 4" 
                  label={{ 
                    position: 'insideTopLeft', value: milestone.name, 
                    fill: milestoneColors[index % milestoneColors.length], fontSize: 11, textAnchor: 'start'
                  }} 
                />
              )
            ))}
            
            <Line 
              type="monotone" dataKey="value" stroke={inflationAdjusted ? '#4A6572' : '#34d399'} 
              strokeWidth={2} dot={false}
              activeDot={{ r: 6, fill: '#0F1216', stroke: inflationAdjusted ? '#4A6572' : '#34d399', strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrajectoryChart;