'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Plus, CalendarIcon, IndianRupee } from 'lucide-react'
import { supabase } from '@/utils/supabase'

const schema = z.object({
  source: z.string().min(1, 'Source is required'),
  amount: z.number().positive('Must be positive'),
  type: z.enum(['income', 'outgoing']),
  strategy_tag: z.enum(['SIP', 'Extra', 'Strategy']),
  date: z.date(),
  time: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

import { Finance } from '@/types'
import { useEffect } from 'react'

export function QuickAddFinance({ 
  onAdded, 
  financeToEdit,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: { 
  onAdded: () => void
  financeToEdit?: Finance
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen
  const [loading, setLoading] = useState(false)
  const isEditing = !!financeToEdit

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: financeToEdit?.source || '',
      amount: financeToEdit?.amount || 0,
      type: financeToEdit?.type || 'income',
      strategy_tag: financeToEdit?.strategy_tag || 'Extra',
      date: financeToEdit?.date ? new Date(financeToEdit.date) : new Date(),
      time: financeToEdit?.date ? format(new Date(financeToEdit.date), 'HH:mm') : format(new Date(), 'HH:mm'),
    },
  })

  useEffect(() => {
    if (financeToEdit) {
      form.reset({
        source: financeToEdit.source,
        amount: financeToEdit.amount,
        type: financeToEdit.type,
        strategy_tag: financeToEdit.strategy_tag,
        date: new Date(financeToEdit.date),
        time: format(new Date(financeToEdit.date), 'HH:mm'),
      })
    } else {
      form.reset({ type: 'income', strategy_tag: 'Extra', date: new Date(), time: format(new Date(), 'HH:mm') })
    }
  }, [financeToEdit, form])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    
    // Combine date and time into a precise Date object
    const finalDate = new Date(values.date)
    if (values.time) {
      const [hours, minutes] = values.time.split(':').map(Number)
      finalDate.setHours(hours, minutes, 0, 0)
    }

    const payload = {
      source: values.source,
      amount: values.amount,
      type: values.type,
      strategy_tag: values.strategy_tag,
      date: finalDate.toISOString(),
    }

    if (isEditing && financeToEdit) {
      await supabase.from('finance').update(payload).eq('id', financeToEdit.id)
    } else {
      await supabase.from('finance').insert([payload])
    }
    
    form.reset({ type: 'income', strategy_tag: 'Extra', date: new Date(), time: format(new Date(), 'HH:mm') })
    setOpen(false)
    onAdded()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        !isControlled ? <Button id="add-finance-btn" className="gap-2 bg-primary/90 hover:bg-primary font-semibold" /> : <div className="hidden" />
      }>
        <Plus className="w-4 h-4" />
        Log Entry
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-400/20">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <DialogTitle className="text-lg font-bold">{isEditing ? 'Edit Finance Entry' : 'Log Finance Entry'}</DialogTitle>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source / Description</FormLabel>
                <FormControl>
                  <Textarea id="finance-source" placeholder="e.g. Freelance Project, Zerodha SIP..." className="resize-none bg-secondary/50 border-border" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      id="finance-amount" 
                      type="number" 
                      placeholder="0" 
                      className="bg-secondary/50 border-border" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="finance-type" className="bg-secondary/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">💰 Income</SelectItem>
                      <SelectItem value="outgoing">💸 Outgoing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="strategy_tag" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Strategy Tag</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="finance-strategy" className="bg-secondary/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SIP">📈 SIP</SelectItem>
                      <SelectItem value="Extra">⚡ Extra</SelectItem>
                      <SelectItem value="Strategy">🎯 Strategy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger render={
                        <FormControl>
                          <Button
                            id="finance-date"
                            variant="outline"
                            className={cn('w-full justify-start text-left font-normal bg-secondary/50 border-border', !field.value && 'text-muted-foreground')}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                            {field.value ? format(field.value, 'dd MMM') : 'Pick date'}
                          </Button>
                        </FormControl>
                      } />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="time" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Time</FormLabel>
                    <FormControl>
                      <Input type="time" className="bg-secondary/50 border-border w-[110px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button id="finance-submit" type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                {loading ? 'Saving…' : (isEditing ? 'Save Changes' : 'Log Entry')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
