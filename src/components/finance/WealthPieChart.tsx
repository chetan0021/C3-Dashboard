/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatINR } from '@/lib/financeUtils'

const COLOR_MAP: Record<string, string> = {
  'Income 💰': '#10b981',
  'Extra ⚡': '#f43f5e',
  'SIP 📈': '#0ea5e9',
  'Strategy 🎯': '#8b5cf6',
}


export function WealthPieChart({ data }: { data: { name: string; value: number }[] }) {
  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-xs italic">
        Not enough data for allocation breakdown.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.name] || '#6366f1'} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: any) => formatINR(Number(value))}
        />
        <Legend 
          verticalAlign="middle" 
          align="right" 
          layout="vertical"
          iconType="circle"
          wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
