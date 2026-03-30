'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calcHeatScore } from '@/lib/heatEngine'
import { Task } from '@/types'

export function PredictiveMeter() {
  const [completedCount, setCompletedCount] = useState(0)
  const [targetTask, setTargetTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data: allTasks, error: fetchErr } = await supabase
          .from('tasks')
          .select('*')

        if (fetchErr) throw fetchErr;

        if (allTasks && allTasks.length > 0) {
          // Count M_up completed tasks globally (could scope to category if desired)
          const mUpCount = allTasks.filter(t => t.money_impact === 'M_up' && t.status === 'completed').length
          setCompletedCount(mUpCount)

          // Find highest heat score open task
          const openTasks = allTasks.filter(t => t.status !== 'completed')
          if (openTasks.length > 0) {
            const sorted = openTasks.sort((a, b) => calcHeatScore(b) - calcHeatScore(a))
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

  const targetDate = targetTask?.deadline ? new Date(targetTask.deadline) : new Date()
  const now = new Date()
  const daysLeft = targetTask?.deadline 
    ? Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  const hasTarget = !!targetTask;
  
  const flatTarget = 15;
  let probability = hasTarget ? Math.round((completedCount / flatTarget) * 100) : 0
  if (probability > 100) probability = 100
  if (daysLeft === 0 && completedCount < flatTarget && hasTarget) {
    probability = Math.round((completedCount / flatTarget) * 50)
  }

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - ((loading ? 0 : probability) / 100) * circumference

  const formatShortDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="glass rounded-2xl p-6 border border-border flex flex-col items-center justify-between relative hover:shadow-lg transition-all bg-gradient-to-br from-background to-black/40">
      <h3 className="text-sm font-bold flex flex-col items-center justify-center gap-1 w-full text-foreground/90 text-center">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="truncate max-w-[150px]">{hasTarget ? targetTask.title : 'No Targets'}</span>
        </div>
        {hasTarget && targetTask.deadline && (
          <span className="text-xs font-normal text-muted-foreground mr-1">({formatShortDate(targetTask.deadline)})</span>
        )}
      </h3>

      <div className="relative flex items-center justify-center my-4 group">
        <svg className="w-32 h-32 transform -rotate-90 drop-shadow-lg scale-110">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-[1500ms] ease-out",
              probability > 70 ? 'text-emerald-400' : probability > 40 ? 'text-amber-400' : 'text-red-400'
            )}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={cn("text-3xl font-black tracking-tighter drop-shadow-md", probability > 70 ? 'text-emerald-50' : '')}>
            {loading ? '-' : probability}%
          </span>
        </div>
      </div>

      <div className="text-center w-full bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium"><strong className="text-white text-sm">{completedCount}</strong> $M ↑ Done</span>
        <span className="text-muted-foreground font-medium"><strong className="text-white text-sm">{daysLeft}</strong> Days Left</span>
      </div>
    </div>
  )
}
