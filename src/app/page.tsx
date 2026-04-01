'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { CheckSquare, DollarSign, Users, TrendingUp, Star, Zap } from 'lucide-react'
import { QuickAddModal } from '@/components/QuickAddModal'
import { AIBrainCard } from '@/components/AIBrainCard'
import { PredictiveMeter } from '@/components/PredictiveMeter'
import { SocialDebtCard } from '@/components/people/SocialDebtCard'
import { TaskTimeline } from '@/components/tasks/TaskTimeline'
import { cn } from '@/lib/utils'

const quickCategories = [
  {
    label: 'Career',
    description: 'Professional Growth & Work',
    icon: Star,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/20',
  },
  {
    label: 'Growth',
    description: 'Learning & Self-improvement',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    label: 'Discipline',
    description: 'Habits & Routines',
    icon: Zap,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  {
    label: 'People',
    description: 'Social CRM & Networking',
    icon: Users,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    label: 'Strategy',
    description: 'Elite High-Level Logic',
    icon: Zap,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
]

export default function DashboardPage() {
  const [taskCount, setTaskCount] = useState(0)
  const [financeTotal, setFinanceTotal] = useState(0)
  const [peopleCount, setPeopleCount] = useState(0)
  const [streak, setStreak] = useState(0)
  
  const [tasksByCat, setTasksByCat] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadStats() {
      // Load Tasks
      const { data: tasks } = await supabase.from('tasks').select('category, status, updated_at')
      if (tasks) {
        setTaskCount(tasks.filter(t => t.status !== 'completed').length)
        
        const counts: Record<string, number> = {}
        tasks.forEach(t => {
          counts[t.category] = (counts[t.category] || 0) + 1
        })
        setTasksByCat(counts)
        
        const todayStr = new Date().toISOString().split('T')[0]
        
        // Simple streak logic
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        const recentActivity = tasks.filter(t => 
          t.updated_at && (t.updated_at.startsWith(todayStr) || t.updated_at.startsWith(yesterdayStr))
        )
        setStreak(recentActivity.length > 0 ? (recentActivity.length > 3 ? 5 : 3) : 0)
      }

      // Load Finance
      const { data: finance } = await supabase.from('finance').select('amount, type')
      if (finance) {
        const total = finance.reduce((acc, f) => acc + (f.type === 'income' ? Number(f.amount) : -Number(f.amount)), 0)
        setFinanceTotal(total)
      }

      // Load People
      const { count } = await supabase.from('people').select('*', { count: 'exact', head: true })
      if (count !== null) setPeopleCount(count)
    }
    loadStats()
  }, [])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  const dynamicStats = [
    { label: 'Active Tasks', value: taskCount.toString(), subtext: 'across all categories', icon: CheckSquare, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
    { label: 'Net Wealth', value: `₹${financeTotal.toLocaleString()}`, subtext: 'current balance', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'Relationships', value: peopleCount.toString(), subtext: 'people tracked', icon: Users, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { label: 'Streak', value: streak.toString(), subtext: 'days active', icon: TrendingUp, color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero header */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Chetan</span> ⚡
          </h1>
          <p className="text-muted-foreground mt-1">Your command center is ready. What are we conquering today?</p>
        </div>
        <div className="shrink-0"><QuickAddModal /></div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map(({ label, value, subtext, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn("glass rounded-2xl p-5 border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg", border)}>
            <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm font-semibold text-foreground/80">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          </div>
        ))}
      </div>

      {/* Commander AI & Witch Hunt Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><AIBrainCard type="general" /></div>
        <div className="space-y-6">
          <PredictiveMeter />
          
          <SocialDebtCard />
        </div>
      </div>

      {/* Task Flow Timeline */}
      <TaskTimeline />

      {/* Categories quick view */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Task Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickCategories.map(({ label, description, icon: Icon, color, bg, border }) => (
            <Link
              href={label === 'People' ? "/people" : (label === 'Strategy' ? "/strategy" : "/tasks")}
              key={label}
              className={cn("glass rounded-2xl p-5 border group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg block", border)}
            >
              <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {label === 'People' ? `${peopleCount} people` : `${tasksByCat[label] || 0} tasks`}
                </span>
                <span className={cn("text-xs font-medium", color)}>View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty state prompt */}
      <div className="glass rounded-2xl p-8 border border-border text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-4">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-bold text-lg mb-2">Start building your command center</h3>
        <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
          Add your first task, finance entry, or person to get started. Use the Quick Add button above or in the sidebar.
        </p>
        <QuickAddModal />
      </div>
    </div>
  )
}
