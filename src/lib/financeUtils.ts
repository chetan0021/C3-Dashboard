import { Finance } from '@/types'
import { startOfWeek, format, addWeeks, isWithinInterval, endOfWeek } from 'date-fns'

export interface WeeklyDataPoint {
  week: string        // "Mar 24"
  weekStart: Date
  income: number
  outgoing: number
  net: number
}

export function buildWeeklyData(records: Finance[], weeksBack = 6): WeeklyDataPoint[] {
  const now = new Date()
  return Array.from({ length: weeksBack }, (_, i) => {
    const weekStart = startOfWeek(addWeeks(now, -(weeksBack - 1 - i)), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const inRange = records.filter((r) =>
      isWithinInterval(new Date(r.date), { start: weekStart, end: weekEnd })
    )

    const income = inRange
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + Number(r.amount), 0)

    const outgoing = inRange
      .filter((r) => r.type === 'outgoing')
      .reduce((sum, r) => sum + Number(r.amount), 0)

    return {
      week: format(weekStart, 'MMM d'),
      weekStart,
      income,
      outgoing,
      net: income - outgoing,
    }
  })
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
