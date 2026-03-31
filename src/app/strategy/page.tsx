'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { 
  Zap, 
  Target, 
  Brain, 
  MessageSquarePlus, 
  History, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { QuickAddModal } from '@/components/QuickAddModal'

interface StrategyLog {
  id: string
  content: string
  mood: string
  created_at: string
}

export default function StrategyPage() {
  const [logs, setLogs] = useState<StrategyLog[]>([])
  const [newLog, setNewLog] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    const { data } = await supabase
      .from('strategy_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setLogs(data)
  }

  async function handleSubmit() {
    if (!newLog.trim()) return
    setLoading(true)
    const { error } = await supabase.from('strategy_logs').insert([
      { content: newLog, mood: 'Elite' }
    ])
    if (!error) {
      setNewLog('')
      fetchLogs()
    }
    setLoading(false)
  }

  async function runAIAnalysis() {
    setAnalyzing(true)
    // Simulated elite strategy analysis based on logs and tasks
    setTimeout(() => {
      setAnalysis("Strategic Verdict: You are executing well on 'Growth' (Hackathons) but your 'Career' Pillar has been stagnant for 3 days. Recommendation: Allocate 90mins tomorrow to 'Sentaurus TCAD' simulation. Course Correction: Pivot from passive observation to active documentation of 'Google APAC' preparation.")
      setAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
              <Target className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Strategy HQ</h1>
          </div>
          <p className="text-muted-foreground">Pillar 5: High-Level Logic & Elite Course Correction</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-fuchsia-500/30 hover:bg-fuchsia-500/10 text-fuchsia-400 font-semibold"
            onClick={runAIAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Analyze Tactics
          </Button>
          <QuickAddModal />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reflection Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageSquarePlus className="w-4 h-4" />
              Elite Strategic Reflection
            </div>
            <Textarea
              placeholder="What did we learn today? Where are we leaking time? What is the course correction for tomorrow?"
              className="min-h-[150px] bg-secondary/30 border-border focus:border-fuchsia-500/50 resize-none"
              value={newLog}
              onChange={(e) => setNewLog(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground italic">&quot;Clear logic leads to clear command.&quot;</p>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !newLog.trim()}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 font-bold px-8 shadow-[0_0_15px_rgba(192,38,211,0.3)]"
              >
                {loading ? 'Logging...' : 'Log Reflection'}
              </Button>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 ml-1">
              <History className="w-5 h-5 text-muted-foreground" />
              Strategic Timeline
            </h2>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="glass rounded-xl p-8 border border-border text-center text-muted-foreground">
                  No strategic reflections logged yet. Start today.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="glass rounded-xl p-5 border border-border hover:border-fuchsia-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(log.created_at), 'PPPp')}
                      </div>
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 uppercase">
                        {log.mood}
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{log.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          {/* AI Strategy Analysis Result */}
          {analysis && (
            <div className="glass rounded-2xl p-6 border border-fuchsia-500/30 bg-fuchsia-500/5 space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm uppercase">
                <Brain className="w-4 h-4" />
                Commander Feedback
              </div>
              <div className="text-sm leading-relaxed text-foreground/90 bg-black/40 p-4 rounded-xl border border-fuchsia-500/20">
                {analysis}
              </div>
            </div>
          )}

          {/* Strategic Metrics Card */}
          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Tactical Pulse
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Career Velocity', sub: '$M ↑ Focus', score: 85, color: 'bg-sky-500' },
                { name: 'Growth Rate', sub: 'POC / Skill Up', score: 92, color: 'bg-emerald-500' },
                { name: 'Discipline', sub: 'Routine Hit Rate', score: 78, color: 'bg-violet-500' },
                { name: 'Social Depth', sub: 'CRM Health', score: 65, color: 'bg-amber-500' },
              ].map((m) => (
                <div key={m.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-muted-foreground">{m.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", m.color)} style={{ width: `${m.score}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Course Correction Quick Access */}
          <div className="glass rounded-2xl p-6 border border-border bg-gradient-to-br from-fuchsia-500/5 to-primary/5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-fuchsia-400" />
              Active Direction
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-tight">Main Objective</p>
                  <p className="text-sm font-semibold text-foreground">Hackathon: Witch Hunt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
