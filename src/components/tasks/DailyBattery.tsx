'use client'

import { Task } from '@/types'
import { Battery, BatteryFull, BatteryMedium, BatteryLow, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyBatteryProps {
  routines: Task[]
}

export function DailyBattery({ routines }: DailyBatteryProps) {
  if (routines.length === 0) return null

  const completed = routines.filter((t) => t.status === 'completed').length
  const total = routines.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const BattIcon = pct >= 80 ? BatteryFull : pct >= 40 ? BatteryMedium : BatteryLow
  const color =
    pct >= 80 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
  const bgColor =
    pct >= 80 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  const borderColor =
    pct >= 80 ? 'border-emerald-400/30' : pct >= 40 ? 'border-amber-400/30' : 'border-red-400/30'

  return (
    <div className={cn('glass rounded-2xl p-5 border', borderColor)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BattIcon className={cn('w-5 h-5', color)} />
          <span className="font-semibold text-sm text-foreground">Daily Battery</span>
          <span className="text-xs text-muted-foreground">— Routine tasks today</span>
        </div>
        <div className={cn('text-sm font-bold font-mono', color)}>
          {completed}/{total} &nbsp;·&nbsp; {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', bgColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Routine pills */}
      <div className="flex flex-wrap gap-2">
        {routines.map((task) => {
          const done = task.status === 'completed'
          return (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                done
                  ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400 line-through opacity-70'
                  : 'bg-white/5 border-white/10 text-muted-foreground'
              )}
            >
              {done ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              ) : (
                <Circle className="w-3 h-3 shrink-0" />
              )}
              {task.title}
            </div>
          )
        })}
      </div>
    </div>
  )
}
