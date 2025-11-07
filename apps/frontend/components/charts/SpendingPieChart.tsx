'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface SpendingData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: string | number; // Required for Recharts compatibility
}

interface SpendingPieChartProps {
  data: SpendingData[];
}

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  return (
    <div className="w-full h-[280px] md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string | number) => {
              // Find the data entry that matches this legend item
              const dataEntry = data.find((item) => item.name === value);
              return (
                <span className="text-sm text-gray-600">
                  {value}{' '}
                  {dataEntry?.percentage !== undefined
                    ? `${dataEntry.percentage}%`
                    : ''}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
