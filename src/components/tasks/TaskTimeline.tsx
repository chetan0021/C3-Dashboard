'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/utils/supabase'
import { Task } from '@/types'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { Calendar as CalendarIcon, Clock, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TaskTimeline() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'todo') // only grab non-completed tasks
        .not('deadline', 'is', null) // must have a deadline for the timeline
        .order('deadline', { ascending: true })

      if (data) {
        setTasks(data)
      }
      setLoading(false)
    }

    fetchTasks()
  }, [])

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  if (loading) {
    return <div className="h-40 glass rounded-2xl border border-border animate-pulse flex items-center justify-center text-muted-foreground">Loading Strategic Timeline...</div>
  }

  if (tasks.length === 0) {
    return null
  }

  const getUrgencyColor = (deadline: string) => {
    const d = new Date(deadline)
    if (isPast(d) && !isToday(d)) return 'border-red-500/50 bg-red-500/10 text-red-400'
    if (isToday(d)) return 'border-orange-500/50 bg-orange-500/10 text-orange-400'
    if (isTomorrow(d)) return 'border-amber-500/50 bg-amber-500/10 text-amber-400'
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }

  return (
    <div className="glass rounded-2xl p-6 border border-border space-y-4 relative w-full overflow-hidden shrink-0 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-orange-400" />
          Strategic Task Flow
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={scrollLeft} className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground transition"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={scrollRight} className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground transition"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent h-full items-center relative"
      >
        {/* Horizontal dividing line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/50 -translate-y-1/2 z-0" />

        {tasks.map((task, index) => {
          const deadline = new Date(task.deadline!)
          const daysAway = differenceInDays(deadline, new Date())
          
          return (
            <div key={task.id} className="relative z-10 shrink-0 w-64 snap-start flex flex-col items-center group">
              {/* Top Label (Date) */}
              <div className="mb-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {isToday(deadline) ? 'Today' : isTomorrow(deadline) ? 'Tomorrow' : format(deadline, 'MMM dd')}
              </div>
              
              {/* Connecting Node on the Line */}
              <div className={cn("w-4 h-4 rounded-full border-2 bg-background z-20 transition-transform group-hover:scale-125", getUrgencyColor(task.deadline!).split(' ')[0])} />

              {/* Task Card */}
              <div className={cn(
                "mt-4 p-4 rounded-xl border flex flex-col gap-2 w-full transition-all group-hover:-translate-y-1 shadow-md bg-background/50 backdrop-blur-sm",
                getUrgencyColor(task.deadline!)
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{task.category}</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                    <Clock className="w-3 h-3" />
                    {format(deadline, 'HH:mm')}
                  </span>
                </div>
                <p className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">{task.title}</p>
                {daysAway > 1 && (
                  <p className="text-[10px] opacity-70 mt-1">{daysAway} days away</p>
                )}
              </div>
              
            </div>
          )
        })}
      </div>
    </div>
  )
}
