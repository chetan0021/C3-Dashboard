'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/utils/supabase'
import { Task, TaskStatus } from '@/types'
import { sortByHeat, calcHeatScore } from '@/lib/heatEngine'
import { DailyBattery } from '@/components/tasks/DailyBattery'
import { TaskCard } from '@/components/tasks/TaskCard'
import { QuickAddModal } from '@/components/QuickAddModal'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  TrendingUp,
  Shield,
  Flame,
  SortAsc,
  RefreshCw,
  Loader2,
  LayoutGrid,
  CheckCheck,
  Circle,
  Clock3,
  Filter,
  Target
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type CategoryTab = 'all' | 'Career' | 'Growth' | 'Discipline' | 'Strategy'
type SortMode = 'heat' | 'priority' | 'deadline' | 'created'
type StatusFilter = 'all' | 'todo' | 'in_progress' | 'completed'

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS: { key: CategoryTab; label: string; icon: React.ElementType; color: string; activeClass: string }[] = [
  {
    key: 'all',
    label: 'All Tasks',
    icon: LayoutGrid,
    color: 'text-muted-foreground',
    activeClass: 'bg-primary/15 text-primary border-primary/40',
  },
  {
    key: 'Career',
    label: 'Career Deadlines',
    icon: Briefcase,
    color: 'text-sky-400',
    activeClass: 'bg-sky-400/15 text-sky-400 border-sky-400/40',
  },
  {
    key: 'Growth',
    label: 'Growth Deadlines',
    icon: TrendingUp,
    color: 'text-emerald-400',
    activeClass: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/40',
  },
  {
    key: 'Discipline',
    label: 'Discipline',
    icon: Shield,
    color: 'text-indigo-400',
    activeClass: 'bg-indigo-400/15 text-indigo-400 border-indigo-400/40',
  },
  {
    key: 'Strategy',
    label: 'Strategy',
    icon: Target,
    color: 'text-cyan-400',
    activeClass: 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40',
  },
]

const SORT_OPTIONS: { key: SortMode; label: string; icon: React.ElementType }[] = [
  { key: 'heat', label: 'Heat Score', icon: Flame },
  { key: 'priority', label: 'Priority', icon: SortAsc },
  { key: 'deadline', label: 'Deadline', icon: Clock3 },
  { key: 'created', label: 'Newest', icon: RefreshCw },
]

const STATUS_FILTERS: { key: StatusFilter; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'todo', label: 'To Do', icon: Circle },
  { key: 'in_progress', label: 'In Progress', icon: Clock3 },
  { key: 'completed', label: 'Done', icon: CheckCheck },
]

// ─── Sorting logic ───────────────────────────────────────────────────────────

function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  switch (mode) {
    case 'heat':
      return sortByHeat(tasks)
    case 'priority':
      return [...tasks].sort((a, b) => b.priority - a.priority)
    case 'deadline':
      return [...tasks].sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    case 'created':
      return [...tasks].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
    default:
      return tasks
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [sortMode, setSortMode] = useState<SortMode>('heat')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, people(name, role)')
      .order('created_at', { ascending: false })
    if (!error && data) setTasks(data as Task[])
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // ── Status update callback ───────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: TaskStatus) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    // Sync with DB
    await supabase.from('tasks').update({ status }).eq('id', id)
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  // Daily Battery: all routine tasks regardless of filter
  const routineTasks = useMemo(() => tasks.filter((t) => t.is_routine), [tasks])

  // Filtered + sorted visible tasks
  const visibleTasks = useMemo(() => {
    let result = tasks

    if (activeTab !== 'all') {
      result = result.filter((t) => t.category === activeTab)
    }
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }

    return sortTasks(result, sortMode)
  }, [tasks, activeTab, sortMode, statusFilter])

  // Stats per tab
  const tabCounts = useMemo(() => ({
    all: tasks.length,
    Career: tasks.filter((t) => t.category === 'Career').length,
    Growth: tasks.filter((t) => t.category === 'Growth').length,
    Discipline: tasks.filter((t) => t.category === 'Discipline').length,
    Strategy: tasks.filter((t) => t.category === 'Strategy').length,
  }), [tasks])

  // Hottest task (for the engine header badge)
  const hottestScore = useMemo(
    () => (tasks.length ? Math.max(...tasks.map(calcHeatScore)) : 0),
    [tasks]
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Priority Engine</h1>
            {hottestScore > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/30 text-red-400">
                Peak ⚡ {hottestScore.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Tasks ranked by Heat Score = (Priority × Money Weight) ÷ Days to Deadline
          </p>
        </div>
        <div className="shrink-0">
          <QuickAddModal onComplete={fetchTasks} />
        </div>
      </div>

      {/* ── Daily Battery ────────────────────────────────────────────────── */}
      {routineTasks.length > 0 && <DailyBattery routines={routineTasks} />}

      {/* ── Category Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ key, label, icon: Icon, activeClass, color }) => {
          const count = tabCounts[key as keyof typeof tabCounts]
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0',
                isActive
                  ? activeClass
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 bg-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? '' : color)} />
              {label}
              <span
                className={cn(
                  'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-white/20' : 'bg-white/5 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Sort */}
        <div className="flex items-center gap-1 glass rounded-xl p-1 border border-border">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1.5 mr-0.5" />
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                sortMode === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 glass rounded-xl p-1 border border-border">
          {STATUS_FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                statusFilter === key
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchTasks}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* ── Task list ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading tasks…</span>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="glass rounded-2xl p-12 border border-border text-center">
          <Flame className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No tasks here yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Use Quick Add to fuel the engine.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Rank labels for heat sort */}
          {sortMode === 'heat' && (
            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest px-1">
              ↓ Sorted by Heat Score — highest urgency first
            </p>
          )}
          {visibleTasks.map((task, i) => (
            <div key={task.id} className="flex gap-3 items-start">
              {sortMode === 'heat' && (
                <div className="w-6 text-center shrink-0 mt-4">
                  <span className="text-[11px] font-bold text-muted-foreground/40 font-mono">
                    #{i + 1}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <TaskCard 
                  task={task} 
                  onStatusChange={handleStatusChange} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal Wrapper */}
      <QuickAddModal 
        open={isEditModalOpen} 
        onOpenChange={(open) => {
          setIsEditModalOpen(open)
          if (!open) setTimeout(() => setEditingTask(undefined), 300)
        }} 
        taskToEdit={editingTask}
        onComplete={fetchTasks}
      />
    </div>
  )
}
