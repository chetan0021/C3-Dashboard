'use client'

import { People } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  Heart, Minus, TrendingUp, TrendingDown, Clock, User,
  AlertCircle,
} from 'lucide-react'

interface PersonCardProps {
  person: People
  onEdit?: (person: People) => void
  onDelete?: (id: string) => void
}

function GiveTakeBar({ score }: { score: number }) {
  // score > 0: you give more to them | score < 0: they give more to you
  const clamped = Math.max(-100, Math.min(100, score))
  const givePercent = clamped >= 0 ? 50 + clamped / 2 : 50 + clamped / 2
  const isGiver = clamped >= 0

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className={cn('font-semibold', isGiver ? 'text-emerald-400' : 'text-red-400')}>
          {clamped > 0 ? `You Give (+${clamped})` : clamped < 0 ? `They Give (${clamped})` : 'Balanced (0)'}
        </span>
      </div>
      {/* Bar */}
      <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-border z-10" />
        {/* Fill */}
        <div
          className={cn(
            'absolute top-0 h-full rounded-full transition-all duration-500',
            clamped === 0
              ? 'bg-muted-foreground/40'
              : clamped > 0
              ? 'bg-emerald-400 left-1/2'
              : 'bg-red-400 right-1/2'
          )}
          style={{
            width: `${Math.abs(clamped) / 2}%`,
            ...(clamped < 0 ? { right: '50%' } : { left: '50%' }),
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
        <span>Take</span>
        <span>Give</span>
      </div>
    </div>
  )
}

export function PersonCard({ person, onEdit, onDelete }: PersonCardProps) {
  const score = person.give_take_score
  const isUndernurtured = score <= -20 // you're taking more without giving back
  const isNeedsAction = score <= -10

  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const lastSeen = formatDistanceToNow(new Date(person.last_interaction), { addSuffix: true })

  return (
    <div
      className={cn(
        'glass rounded-2xl p-5 border transition-all duration-200 group hover:scale-[1.02]',
        isUndernurtured
          ? 'border-amber-400/50 shadow-[0_0_20px_hsl(45_100%_55%/0.12)]'
          : 'border-border hover:border-primary/25'
      )}
    >
      {/* Action overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/50 backdrop-blur-sm rounded-lg p-1 border border-border">
        {onEdit && (
          <button onClick={() => onEdit(person)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(person.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        )}
      </div>
      {/* Alert banner */}
      {isNeedsAction && (
        <div className={cn(
          'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg mb-3 -mx-1',
          isUndernurtured
            ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
            : 'bg-yellow-400/10 text-yellow-500 border border-yellow-400/20'
        )}>
          <AlertCircle className="w-3 h-3 shrink-0" />
          {isUndernurtured ? '⚡ Reach out — you owe some giving!' : 'Network nudge — say hi soon'}
        </div>
      )}

      {/* Card header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          'flex items-center justify-center w-11 h-11 rounded-xl text-sm font-bold shrink-0',
          isUndernurtured
            ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
            : 'bg-primary/20 text-primary border border-primary/20'
        )}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{person.name}</p>
          <p className="text-xs text-muted-foreground truncate">{person.role}</p>
        </div>

        {/* Score badge */}
        <div className={cn(
          'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border shrink-0',
          score > 10 ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400' :
          score < -10 ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
          'bg-white/5 border-border text-muted-foreground'
        )}>
          {score > 0 ? <Heart className="w-3 h-3" /> : score < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {score > 0 ? `+${score}` : score}
        </div>
      </div>

      {/* Give/Take progress bar */}
      <GiveTakeBar score={score} />

      {/* Last interaction */}
      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        Last contact {lastSeen}
      </div>
    </div>
  )
}
