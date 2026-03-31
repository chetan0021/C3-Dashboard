'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Plus,
  CalendarIcon,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { supabase } from '@/utils/supabase'
import { Task, People } from '@/types'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['Career', 'Growth', 'Discipline', 'Strategy']),
  priority: z.number().min(1).max(5),
  money_impact: z.enum(['M_up', 'M_down', 'Neutral']),
  is_routine: z.boolean().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']),
  deadline: z.date().optional().nullable(),
  time: z.string().optional(),
  person_id: z.string().optional().nullable(),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function QuickAddModal({ 
  collapsed, 
  taskToEdit,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onComplete
}: { 
  collapsed?: boolean
  taskToEdit?: Task
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onComplete?: () => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen
  const [loading, setLoading] = useState(false)
  const [people, setPeople] = useState<People[]>([])
  const isEditing = !!taskToEdit

  useEffect(() => {
    supabase.from('people').select('*').then(({ data }) => {
      if (data) setPeople(data)
    })
  }, [])

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: taskToEdit?.title || '',
      description: taskToEdit?.description || '',
      category: (taskToEdit?.category as TaskFormValues['category']) || 'Career',
      priority: taskToEdit?.priority || 3,
      money_impact: (taskToEdit?.money_impact as TaskFormValues['money_impact']) || 'Neutral',
      is_routine: taskToEdit?.is_routine || false,
      status: (taskToEdit?.status as TaskFormValues['status']) || 'todo',
      deadline: taskToEdit?.deadline ? new Date(taskToEdit.deadline) : null,
      time: taskToEdit?.deadline ? format(new Date(taskToEdit.deadline), 'HH:mm') : '23:59',
      person_id: taskToEdit?.person_id || null,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: taskToEdit?.title || '',
        description: taskToEdit?.description || '',
        category: (taskToEdit?.category as TaskFormValues['category']) || 'Career',
        priority: taskToEdit?.priority || 3,
        money_impact: (taskToEdit?.money_impact as TaskFormValues['money_impact']) || 'Neutral',
        is_routine: !!taskToEdit?.is_routine,
        status: (taskToEdit?.status as TaskFormValues['status']) || 'todo',
        deadline: taskToEdit?.deadline ? new Date(taskToEdit.deadline) : null,
        time: taskToEdit?.deadline ? format(new Date(taskToEdit.deadline), 'HH:mm') : '23:59',
        person_id: taskToEdit?.person_id || null,
      })
    }
  }, [taskToEdit, open, form])

  const onSubmit = async (values: TaskFormValues) => {
    setLoading(true)
    try {
      let finalDeadline = null
      if (values.deadline) {
        const combinedDate = new Date(values.deadline)
        if (values.time) {
          const [hours, minutes] = values.time.split(':').map(Number)
          combinedDate.setHours(hours, minutes, 0, 0)
        }
        finalDeadline = combinedDate.toISOString()
      }

      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        money_impact: values.money_impact,
        is_routine: values.is_routine,
        status: values.status,
        deadline: finalDeadline,
        person_id: values.person_id && values.person_id !== 'none' ? values.person_id : null
      }

      // Ensure category matches DB enum exactly
      const finalPayload = {
        ...payload,
        category: payload.category.charAt(0).toUpperCase() + payload.category.slice(1)
      }

      if (isEditing && taskToEdit) {
        const { error } = await supabase.from('tasks').update(finalPayload).eq('id', taskToEdit.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tasks').insert([finalPayload])
        if (error) throw error
      }
      
      form.reset()
      setOpen(false)
      if (onComplete) onComplete()
    } catch (err: unknown) {
      console.error('Failed to save task:', err)
      const error = err as Error
      alert(`Database Error: ${error.message || 'Unknown error'}. Please ensure 'Strategy' is added to the task_category enum in Supabase.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          className={cn(
            'w-full gap-2 bg-primary/90 hover:bg-primary text-primary-foreground font-semibold shadow-lg transition-all duration-200',
            collapsed && 'w-10 h-10 p-0 justify-center'
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{isEditing ? 'Edit Task' : 'Quick Add'}</span>}
        </Button>
      } />

      <DialogContent className="sm:max-w-[580px] bg-card border-border shadow-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold">{isEditing ? 'Edit Task' : 'Quick Add Task'}</DialogTitle>
          </div>
        </DialogHeader>

         <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Task Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" className="bg-secondary/40 border-border focus:ring-1 focus:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Category Pillar *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/40 border-border capitalize">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Career', 'Growth', 'Discipline', 'Strategy'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/40 border-border">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Priority (1-5)</FormLabel>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => form.setValue('priority', n)}
                    className={cn(
                      'flex-1 h-10 rounded-lg border text-sm font-bold transition-all duration-200',
                      form.watch('priority') === n 
                        ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105' 
                        : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Money Impact ($M)</FormLabel>
              <div className="flex gap-2">
                {[
                  { val: 'M_up', label: '$M ↑', icon: TrendingUp, color: 'text-emerald-400', active: 'bg-emerald-500/20 border-emerald-500' },
                  { val: 'Neutral', label: 'Neutral', icon: Minus, color: 'text-slate-400', active: 'bg-slate-500/20 border-slate-500' },
                  { val: 'M_down', label: '$M ↓', icon: TrendingDown, color: 'text-red-400', active: 'bg-red-500/20 border-red-500' },
                ].map(({ val, label, icon: Icon, color, active }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => form.setValue('money_impact', val as TaskFormValues['money_impact'])}
                    className={cn(
                      'flex-1 h-11 rounded-lg border text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center gap-0.5',
                      form.watch('money_impact') === val 
                        ? active + ' scale-105 shadow-lg' 
                        : 'bg-secondary/30 border-border text-muted-foreground hover:border-white/20'
                    )}
                  >
                    <Icon className={cn("w-4 h-4", form.watch('money_impact') === val ? color : "opacity-40")} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-1">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Deadline & Time</FormLabel>
                      <Popover>
                        <PopoverTrigger render={
                          <Button variant="outline" className={cn('w-full justify-start text-left font-normal bg-secondary/40 border-border', !field.value && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">{field.value ? format(field.value, 'dd MMM') : 'Date'}</span>
                          </Button>
                        } />
                        <PopoverContent className="w-auto p-0 border border-border bg-card shadow-2xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-6">
                      <FormControl>
                        <Input type="time" className="bg-secondary/40 border-border w-[90px] px-2 text-sm h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_routine"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0 pb-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="w-5 h-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-semibold text-sm cursor-pointer select-none">Routine Task (R)</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="person_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Link Person (Social CRM)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger className="bg-secondary/40 border-border">
                        <SelectValue placeholder="Select a person..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {people.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-border bg-transparent hover:bg-secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/20">
                {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Create Task')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
