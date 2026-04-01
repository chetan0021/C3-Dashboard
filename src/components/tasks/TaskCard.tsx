'use client'

import { Task, TaskStatus } from '@/types'
import { calcHeatScore, getHeatLabel, isWithin48Hours } from '@/lib/heatEngine'
import { CountdownTimer } from './CountdownTimer'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Circle,
  Clock3,
  Edit2,
  Trash2,
  User,
} from 'lucide-react'
import { supabase } from '@/utils/supabase'
import { useState, useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  Career: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  Growth: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Discipline: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  Strategy: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'completed',
  completed: 'todo',
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'text-muted-foreground',
  in_progress: 'text-amber-400',
  completed: 'text-emerald-400 line-through opacity-60',
}

const MONEY_ICONS: Record<string, React.ElementType> = {
  M_up: TrendingUp,
  M_down: TrendingDown,
  Neutral: Minus,
}

const MONEY_COLORS: Record<string, string> = {
  M_up: 'text-emerald-400',
  M_down: 'text-red-400',
  Neutral: 'text-slate-400',
}

const MONEY_LABELS: Record<string, string> = {
  M_up: '$M ↑',
  M_down: '$M ↓',
  Neutral: 'Neutral',
}

interface TaskCardProps {
  task: Task
  onStatusChange?: (id: string, status: TaskStatus) => void
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const confirmTimeoutRef = useRef<NodeJS.Timeout>()

  // Reset confirming state after 3 seconds of inactivity
  useEffect(() => {
    if (isConfirming) {
      confirmTimeoutRef.current = setTimeout(() => {
        setIsConfirming(false)
      }, 3000)
    }
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
    }
  }, [isConfirming])

  const score = calcHeatScore(task)
  const heat = getHeatLabel(score)
  const showCountdown = isWithin48Hours(task.deadline)
  const MoneyIcon = MONEY_ICONS[task.money_impact] ?? Minus

  const cycleStatus = async () => {
    if (loading || !onStatusChange) return
    const next = STATUS_CYCLE[task.status]
    setLoading(true)
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', task.id)
    onStatusChange(task.id, next)
    setLoading(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return

    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    onDelete(task.id)
    setIsConfirming(false)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) onEdit(task)
  }

  const StatusIcon =
    task.status === 'completed'
      ? CheckCircle2
      : task.status === 'in_progress'
      ? Clock3
      : Circle

  return (
    <div
      className={cn(
        'glass rounded-xl p-4 border transition-all duration-200 group',
        task.status === 'completed' ? 'opacity-60' : 'hover:border-primary/30 hover:shadow-lg'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={cycleStatus}
          disabled={loading}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Toggle task status"
        >
          <StatusIcon
            className={cn(
              'w-5 h-5',
              task.status === 'completed' && 'text-emerald-400',
              task.status === 'in_progress' && 'text-amber-400'
            )}
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className={cn('font-semibold text-sm leading-snug', STATUS_STYLES[task.status])}>
              {task.title}
            </p>
            {/* Heat badge & Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                  heat.bg, heat.border, heat.color
                )}
              >
                {heat.label}
              </span>
              {(onEdit || onDelete) && (
                <div className="flex gap-1 ml-1 transition-opacity">
                  {isConfirming ? (
                    <>
                      <button 
                        onClick={handleDelete} 
                        className="p-1.5 rounded bg-red-500/20 text-red-500 ring-1 ring-red-500/50 transition-all duration-200"
                        title="Click again to confirm"
                      >
                        <Check className="w-4 h-4 animate-in zoom-in-50 duration-200" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsConfirming(false)
                        }}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground animate-in slide-in-from-left-2 duration-200"
                        title="Cancel delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {onEdit && (
                        <button 
                          onClick={handleEdit} 
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={handleDelete} 
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {/* Category */}
            <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', CATEGORY_COLORS[task.category])}>
              {task.category}
            </span>

            {/* Priority stars */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < task.priority ? 'text-primary fill-primary' : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>

            {/* Money impact */}
            <span className={cn('flex items-center gap-1 text-[11px] font-semibold', MONEY_COLORS[task.money_impact])}>
              <MoneyIcon className="w-3 h-3" />
              {MONEY_LABELS[task.money_impact]}
            </span>

            {/* Routine badge */}
            {task.is_routine && (
              <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                <RefreshCw className="w-3 h-3" />
                Routine
              </span>
            )}

            {/* Linked Person */}
            {task.people && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md">
                <User className="w-3 h-3" />
                {task.people.name}
              </span>
            )}

            {/* Heat score */}
            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
              ⚡ {score.toFixed(1)}
            </span>
          </div>

          {/* Deadline row */}
          {task.deadline && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.deadline), 'dd MMM yyyy, hh:mm a')}
              </span>
              {showCountdown && <CountdownTimer deadline={task.deadline} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
