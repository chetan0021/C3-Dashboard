'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Target, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calcHeatScore } from '@/lib/heatEngine'
import { Task } from '@/types'

export function PredictiveMeter() {
  const [totalTasks, setTotalTasks]       = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [mUpDone, setMUpDone]             = useState(0)
  const [targetTask, setTargetTask]       = useState<Task | null>(null)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data: allTasks, error: fetchErr } = await supabase
          .from('tasks')
          .select('*')

        if (fetchErr) throw fetchErr

        if (allTasks && allTasks.length > 0) {
          const total     = allTasks.length
          const completed = allTasks.filter(t => t.status === 'completed').length
          const mUp       = allTasks.filter(t => t.money_impact === 'M_up' && t.status === 'completed').length

          setTotalTasks(total)
          setCompletedTasks(completed)
          setMUpDone(mUp)

          // Find highest heat-score open task as the "focus target"
          const openTasks = allTasks.filter(t => t.status !== 'completed')
          if (openTasks.length > 0) {
            const sorted = [...openTasks].sort((a, b) => calcHeatScore(b) - calcHeatScore(a))
            setTargetTask(sorted[0])
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const now = new Date()
  const hasTarget = !!targetTask

  // ── Deadline label ────────────────────────────────────────────────────────
  const deadlineMs   = targetTask?.deadline ? new Date(targetTask.deadline).getTime() - now.getTime() : -1
  const daysLeftRaw  = deadlineMs > 0 ? deadlineMs / (1000 * 60 * 60 * 24) : 0
  const daysLeftWhole = Math.floor(daysLeftRaw)

  const daysLeftLabel = (() => {
    if (!targetTask?.deadline) return 'No Deadline'
    if (deadlineMs <= 0) return 'Overdue'
    if (daysLeftRaw < 0.5) return 'Tonight'
    if (daysLeftRaw < 1)   return 'Today'
    if (daysLeftRaw < 2)   return 'Tomorrow'
    return `${daysLeftWhole} ${daysLeftWhole === 1 ? 'Day' : 'Days'} Left`
  })()

  // ── Percentage = overall task completion rate ─────────────────────────────
  // Simple, honest: completed / total × 100
  const percentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  const radius        = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - ((loading ? 0 : percentage) / 100) * circumference

  const formatShortDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

  return (
    <div className="glass rounded-2xl p-6 border border-border flex flex-col items-center justify-between relative hover:shadow-lg transition-all bg-gradient-to-br from-background to-black/40">
      {/* Target task title */}
      <h3 className="text-sm font-bold flex flex-col items-center justify-center gap-1 w-full text-foreground/90 text-center">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[150px]">{hasTarget ? targetTask.title : 'No Targets'}</span>
        </div>
        {hasTarget && targetTask.deadline && (
          <span className="text-xs font-normal text-muted-foreground">({formatShortDate(targetTask.deadline)})</span>
        )}
      </h3>

      {/* Donut chart */}
      <div className="relative flex items-center justify-center my-4">
        <svg className="w-32 h-32 transform -rotate-90 drop-shadow-lg scale-110">
          <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
          <circle
            cx="64" cy="64" r={radius}
            stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-[1500ms] ease-out',
              percentage >= 70 ? 'text-emerald-400' : percentage >= 40 ? 'text-amber-400' : 'text-red-400'
            )}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={cn('text-3xl font-black tracking-tighter drop-shadow-md', percentage >= 70 ? 'text-emerald-50' : '')}>
            {loading ? '–' : percentage}%
          </span>
        </div>
      </div>

      {/* Label explaining what the % means */}
      <p className="text-[10px] text-muted-foreground/60 text-center -mt-2 mb-2 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {loading ? '…' : `${completedTasks} of ${totalTasks} tasks complete`}
      </p>

      {/* Bottom stats row */}
      <div className="text-center w-full bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">
          <strong className="text-white text-sm">{mUpDone}</strong> $M ↑ Done
        </span>
        <span className={cn(
          'font-medium',
          daysLeftLabel === 'Overdue'  ? 'text-red-400' :
          daysLeftLabel === 'Tonight' || daysLeftLabel === 'Today' ? 'text-orange-400' :
          daysLeftLabel === 'Tomorrow' ? 'text-amber-400' : 'text-muted-foreground'
        )}>
          <strong className="text-sm">{daysLeftLabel}</strong>
        </span>
      </div>
    </div>
  )
}
