'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Finance } from '@/types'
import { buildWeeklyData, formatINR } from '@/lib/financeUtils'
import { WeeklyChart } from '@/components/finance/WeeklyChart'
import { QuickAddFinance } from '@/components/finance/QuickAddFinance'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, 
  IndianRupee, Target, BarChart3, RefreshCw, Loader2, CheckCircle2,
  Zap, Trash2, Plus
} from 'lucide-react'
import { WealthPieChart } from '@/components/finance/WealthPieChart'
import { AIBrainCard } from '@/components/AIBrainCard'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'


type LeakageFlash = { id: string; message: string }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [records, setRecords] = useState<Finance[]>([])
  const [loading, setLoading] = useState(true)
  const [leakageFlash, setLeakageFlash] = useState<LeakageFlash | null>(null)
  
  const [editingFinance, setEditingFinance] = useState<Finance | undefined>()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const [financeToDelete, setFinanceToDelete] = useState<Finance | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('finance')
      .select('*')
      .order('date', { ascending: false })
    if (!error && data) setRecords(data as Finance[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeIncome = records
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + Number(r.amount), 0)

    const passiveStrategy = records
      .filter((r) => r.strategy_tag === 'SIP' || r.strategy_tag === 'Strategy')
      .reduce((s, r) => {
        // SIP outgoing = money deployed (positive for wealth), income tagged SIP = returns
        return r.type === 'income' ? s + Number(r.amount) : s - Number(r.amount)
      }, 0)

    const totalOutgoing = records
      .filter((r) => r.type === 'outgoing')
      .reduce((s, r) => s + Number(r.amount), 0)

    const net = activeIncome - totalOutgoing
    const sipDeployed = records
      .filter((r) => r.strategy_tag === 'SIP' && r.type === 'outgoing')
      .reduce((s, r) => s + Number(r.amount), 0)

    return { activeIncome, totalOutgoing, net, passiveStrategy, sipDeployed }
  }, [records])

  const pieData = useMemo(() => {
    return [
      { name: 'SIP 📈', value: records.filter(r => r.strategy_tag === 'SIP' && r.type === 'outgoing').reduce((s, r) => s + Number(r.amount), 0) },
      { name: 'Strategy 🎯', value: records.filter(r => r.strategy_tag === 'Strategy' && r.type === 'outgoing').reduce((s, r) => s + Number(r.amount), 0) },
      { name: 'Extra ⚡', value: records.filter(r => r.strategy_tag === 'Extra' && r.type === 'outgoing').reduce((s, r) => s + Number(r.amount), 0) },
      { name: 'Income 💰', value: stats.activeIncome },
    ].filter(d => d.value > 0)
  }, [records, stats.activeIncome])

  const weeklyData = useMemo(() => buildWeeklyData(records, 6), [records])

  // Recent 5 records
  const recentRecords = records.slice(0, 8)


  const confirmDelete = async () => {
    if (!financeToDelete) return
    setIsDeleting(true)
    const { error } = await supabase.from('finance').delete().eq('id', financeToDelete.id)
    if (!error) {
      fetchRecords()
    }
    setIsDeleting(false)
    setFinanceToDelete(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold">Strategy &amp; Wealth</h1>
          </div>
          <p className="text-muted-foreground text-sm">Track income, deployments, and wealth leakage in real-time.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={fetchRecords} 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button 
            onClick={() => { setEditingFinance(undefined); setIsEditModalOpen(true); }} 
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Finance
          </button>
          <QuickAddFinance 
            onAdded={fetchRecords} 
            financeToEdit={editingFinance}
            open={isEditModalOpen}
            onOpenChange={(open) => {
              setIsEditModalOpen(open)
              if (!open) setTimeout(() => setEditingFinance(undefined), 300)
            }}
          />
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Income */}
        <div className="glass rounded-2xl p-5 border border-emerald-400/20 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-400/15">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400 opacity-60" />
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatINR(stats.activeIncome)}</p>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5">Total Extra Money</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active Income</p>
        </div>

        {/* Strategic Deployment */}
        <div className="glass rounded-2xl p-5 border border-cyan-400/20 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-400/15">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-400 opacity-60" />
          </div>
          <p className="text-xl font-bold text-cyan-400">{formatINR(stats.passiveStrategy)}</p>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5">Strategic Deployment</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Elite Pillar Allocations</p>
        </div>

        {/* Total Outgoing */}
        <div className="glass rounded-2xl p-5 border border-red-400/20 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-400/15">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-400">{formatINR(stats.totalOutgoing)}</p>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5">Total Outgoing</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All expenses</p>
        </div>

        {/* Net */}
        <div className={cn(
          'glass rounded-2xl p-5 border hover:scale-[1.02] transition-transform duration-200',
          stats.net >= 0 ? 'border-indigo-400/20' : 'border-red-400/30'
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl', stats.net >= 0 ? 'bg-indigo-400/15' : 'bg-red-400/15')}>
              <Target className={cn('w-5 h-5', stats.net >= 0 ? 'text-indigo-400' : 'text-red-400')} />
            </div>
            <Zap className={cn('w-4 h-4 opacity-60', stats.net >= 0 ? 'text-indigo-400' : 'text-red-400')} />
          </div>
          <p className={cn('text-xl font-bold', stats.net >= 0 ? 'text-indigo-400' : 'text-red-400')}>
            {formatINR(stats.net)}
          </p>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5">Net Position</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Income minus expenses</p>
        </div>
      </div>

      {/* ── Leakage Warning Flash ──────────────────────────────────────────── */}
      {leakageFlash && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-400/40 bg-amber-400/10 animate-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-300">{leakageFlash.message}</p>
          <button onClick={() => setLeakageFlash(null)} className="ml-auto text-amber-400/60 hover:text-amber-400 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* ── Leakage Tracker ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AIBrainCard type="finance" />
        </div>
        <div className="glass rounded-2xl p-5 border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-sm">Strategic Allocation</h2>
          </div>
          <WealthPieChart data={pieData} />
        </div>
      </div>

      {/* ── Weekly Chart ───────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Income vs. Outgoing — Last 6 Weeks</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-52 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading chart…</span>
          </div>
        ) : (
          <WeeklyChart data={weeklyData} />
        )}
      </div>

      {/* ── Recent Entries ─────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Recent Entries</h2>
          </div>
          <span className="text-xs text-muted-foreground">{records.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : recentRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No entries yet — log your first transaction.</p>
        ) : (
          <div className="space-y-2">
            {recentRecords.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                  r.type === 'income' ? 'bg-emerald-400/10' : 'bg-red-400/10'
                )}>
                  {r.type === 'income'
                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.source}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(r.date), 'dd MMM yyyy')} &nbsp;·&nbsp;
                    <span className={cn(
                      'font-medium px-1.5 py-0.5 rounded-full text-[10px]',
                      r.strategy_tag === 'SIP' ? 'bg-sky-400/10 text-sky-400' :
                      r.strategy_tag === 'Strategy' ? 'bg-indigo-400/10 text-indigo-400' :
                      'bg-white/5 text-muted-foreground'
                    )}>
                      {r.strategy_tag}
                    </span>
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingFinance(r); setIsEditModalOpen(true); }}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button 
                    onClick={() => setFinanceToDelete(r)}
                    className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>

                <p className={cn('font-bold font-mono text-sm shrink-0 min-w-[80px] text-right', r.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                  {r.type === 'income' ? '+' : '-'}{formatINR(Number(r.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      <Dialog open={!!financeToDelete} onOpenChange={(o) => !o && !isDeleting && setFinanceToDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/20 mb-4">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-xl font-bold mb-2">Delete Entry?</DialogTitle>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete <strong className="text-foreground">{financeToDelete?.source}</strong>? This will permanently remove the record from your wealth tracker.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setFinanceToDelete(null)} disabled={isDeleting}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 font-bold text-white shadow-lg">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
