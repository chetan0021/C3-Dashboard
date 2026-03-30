'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { str: 'OVERDUE', overdue: true }
  const totalSec = ms / 1000
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  const days = Math.floor(h / 24)

  if (days > 0) {
    return { str: `${days}d ${pad(h % 24)}h ${pad(m)}m`, overdue: false }
  }
  return { str: `${pad(h)}h ${pad(m)}m ${pad(s)}s`, overdue: false }
}

export function CountdownTimer({ deadline }: { deadline: string }) {
  const [ms, setMs] = useState(() => new Date(deadline).getTime() - Date.now())
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    rafRef.current = setInterval(() => {
      setMs(new Date(deadline).getTime() - Date.now())
    }, 1000)
    return () => {
      if (rafRef.current) clearInterval(rafRef.current)
    }
  }, [deadline])

  const { str, overdue } = formatCountdown(ms)
  const under48h = ms > 0 && ms < 172_800_000

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-1 rounded-md border ${
        overdue
          ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
          : under48h
          ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 animate-pulse'
          : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
      }`}
    >
      <Clock className="w-3 h-3 shrink-0" />
      {str}
    </div>
  )
}
