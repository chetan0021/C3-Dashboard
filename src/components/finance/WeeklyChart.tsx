/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { WeeklyDataPoint, formatINR } from '@/lib/financeUtils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="font-mono text-foreground">{formatINR(entry.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-border flex justify-between gap-4">
          <span className="text-muted-foreground">Net</span>
          <span
            className={`font-mono font-bold ${
              payload[0].value - payload[1].value >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatINR(payload[0].value - payload[1].value)}
          </span>
        </div>
      )}
    </div>
  )
}

export function WeeklyChart({ data }: { data: WeeklyDataPoint[] }) {
  const hasData = data.some((d) => d.income > 0 || d.outgoing > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        No finance data yet — add some entries to see the chart.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
          iconType="circle"
          iconSize={8}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Bar dataKey="income" name="Income" fill="hsl(142 70% 55%)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Bar dataKey="outgoing" name="Outgoing" fill="hsl(0 80% 60%)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  )
}
