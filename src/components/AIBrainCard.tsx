'use client'

import { useEffect, useState } from 'react'
import { BrainCircuit, AlertTriangle, ShieldCheck, Sparkles, RefreshCw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Insight {
  label: string
  value: number
  emoji: string
  color: string
}

interface BrainData {
  insights?: Insight[];
  battlePlan?: string;
  hasLeakage?: boolean;
  error?: string;
  modelUsed?: string;
}

export function AIBrainCard({ type = 'general' }: { type?: 'general' | 'finance' }) {
  const [data, setData] = useState<BrainData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isInitial, setIsInitial] = useState(true)

  const fetchBrain = async (force = false) => {
    setLoading(true)
    setIsInitial(false)
    try {
      const res = await fetch(`/api/brain?type=${type}`)
      const json = await res.json()
      setData(json)
      // Cache in session
      sessionStorage.setItem(`ai_cache_${type}`, JSON.stringify(json))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = sessionStorage.getItem(`ai_cache_${type}`)
    if (cached) {
      setData(JSON.parse(cached))
      setIsInitial(false)
      setLoading(false)
    } else {
      // Auto-fetch ONLY on first ever session load if no cache
      fetchBrain()
    }
  }, [type])

  return (
    <div className="glass rounded-2xl p-6 border border-primary/20 bg-primary/5 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.01]">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
          <BrainCircuit className="w-5 h-5" />
          Commander AI
        </h3>
        <button 
          onClick={() => fetchBrain(true)}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
            loading 
              ? "bg-primary/10 text-primary/40 cursor-not-allowed" 
              : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
          )}
        >
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-primary/10 rounded-xl w-full"></div>
          <div className="h-4 bg-primary/10 rounded w-2/3"></div>
        </div>
      ) : data?.error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-sm text-red-400 font-medium whitespace-pre-line">{data.error}</p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {type === 'finance' ? (
            <div className="h-48 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.insights}
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={({ x, y, payload }) => {
                      const insight = (data.insights || []).find(i => i.label === payload.value)
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={-10}
                            y={4}
                            textAnchor="end"
                            fill="hsl(var(--foreground) / 0.8)"
                            className="text-[11px] font-semibold"
                          >
                            {insight?.emoji} {payload.value}
                          </text>
                        </g>
                      )
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as Insight
                        return (
                          <div className="bg-card border border-border p-2 rounded-lg shadow-xl text-[11px] flex items-center gap-2">
                            <span className="text-base">{d.emoji}</span>
                            <span className="font-bold">{d.label}:</span>
                            <span className="font-mono text-primary">{d.value}/100</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  >
                    {(data.insights || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color === 'emerald-400' ? '#10b981' :
                          entry.color === 'amber-400' ? '#f59e0b' :
                          entry.color === 'red-400' ? '#ef4444' :
                          entry.color === 'fuchsia-400' ? '#d946ef' :
                          '#8b5cf6'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-foreground/90 space-y-2 whitespace-pre-line leading-relaxed border-b border-white/5 pb-4">
              {data.battlePlan}
            </div>
          )}

          {(data.hasLeakage || !data.hasLeakage) && (
            <div className="flex items-center justify-between gap-4">
              {data.hasLeakage ? (
                <div className="flex-1 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[11px] font-bold text-red-400/90 leading-tight">
                    Leakage detected! Keep your $M ↑ score high.
                  </p>
                </div>
              ) : (
                <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[11px] font-semibold text-emerald-400">Tactical execution optimal.</p>
                </div>
              )}

              {data.modelUsed && (
                <div className={cn(
                  "px-2 py-1 rounded-md text-[9px] font-bold border flex items-center gap-1 shrink-0",
                  data.modelUsed === '8b' 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                    : "bg-primary/10 border-primary/20 text-primary"
                )}>
                  <Zap className="w-2.5 h-2.5" />
                  {data.modelUsed === '8b' ? "Low Power" : "70b Mode"}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground bg-primary/10 p-4 rounded-xl text-center">Neural link lost.</p>
      )}
    </div>
  )
}
