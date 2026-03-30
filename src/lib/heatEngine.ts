import { Task } from '@/types'

// ─── Money Impact Weights ───────────────────────────────────────────────────
const MONEY_WEIGHT: Record<string, number> = {
  M_up: 3,
  M_down: 2,
  Neutral: 1,
}

/**
 * Heat Score = (priority × moneyWeight) / max(1, daysUntilDeadline)
 * Higher = more urgent. Tasks with no deadline get a small base score.
 */
export function calcHeatScore(task: Task): number {
  const weight = MONEY_WEIGHT[task.money_impact] ?? 1
  const base = task.priority * weight

  if (!task.deadline) return base * 0.5 // no deadline → half base

  const now = new Date()
  const deadline = new Date(task.deadline)
  const daysLeft = Math.max(0, (deadline.getTime() - now.getTime()) / 86_400_000)

  // Overdue tasks get max urgency × 10
  if (daysLeft === 0 && deadline.getTime() < now.getTime()) return base * 10

  return base / (daysLeft + 1)
}

export function sortByHeat(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => calcHeatScore(b) - calcHeatScore(a))
}

export function getHeatLabel(score: number): {
  label: string
  color: string
  bg: string
  border: string
} {
  if (score >= 20) return { label: '🔥 Critical', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' }
  if (score >= 10) return { label: '⚡ Hot', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' }
  if (score >= 4)  return { label: '🌡 Warm', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' }
  return { label: '❄ Cool', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30' }
}

export function daysUntilDeadline(deadline: string | undefined): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return diff / 86_400_000
}

export function isWithin48Hours(deadline: string | undefined): boolean {
  const days = daysUntilDeadline(deadline)
  return days !== null && days >= 0 && days <= 2
}
