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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Plus, CalendarIcon, Users } from 'lucide-react'
import { supabase } from '@/utils/supabase'

const schema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  give_take_score: z.number().int(),
  last_interaction: z.date(),
  time: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

import { People } from '@/types'
import { useEffect } from 'react'

export function AddPersonModal({ 
  onAdded,
  personToEdit,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: { 
  onAdded: () => void 
  personToEdit?: People
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen
  const [loading, setLoading] = useState(false)
  const isEditing = !!personToEdit

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: personToEdit?.name || '',
      role: personToEdit?.role || '',
      give_take_score: personToEdit?.give_take_score || 0, 
      last_interaction: personToEdit?.last_interaction ? new Date(personToEdit.last_interaction) : new Date(),
      time: personToEdit?.last_interaction ? format(new Date(personToEdit.last_interaction), 'HH:mm') : format(new Date(), 'HH:mm'),
    },
  })

  useEffect(() => {
    if (personToEdit) {
      form.reset({
        name: personToEdit.name,
        role: personToEdit.role,
        give_take_score: personToEdit.give_take_score,
        last_interaction: new Date(personToEdit.last_interaction),
        time: format(new Date(personToEdit.last_interaction), 'HH:mm'),
      })
    } else {
      form.reset({ name: '', role: '', give_take_score: 0, last_interaction: new Date(), time: format(new Date(), 'HH:mm') })
    }
  }, [personToEdit, form])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    
    // Combine date and time
    const finalDate = new Date(values.last_interaction)
    if (values.time) {
      const [hours, minutes] = values.time.split(':').map(Number)
      finalDate.setHours(hours, minutes, 0, 0)
    }

    const payload = {
      name: values.name,
      role: values.role,
      give_take_score: values.give_take_score,
      last_interaction: finalDate.toISOString(),
    }
    
    if (isEditing && personToEdit) {
      await supabase.from('people').update(payload).eq('id', personToEdit.id)
    } else {
      await supabase.from('people').insert([payload])
    }
    
    form.reset({ name: '', role: '', give_take_score: 0, last_interaction: new Date(), time: format(new Date(), 'HH:mm') })
    setOpen(false)
    onAdded()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        !isControlled ? <Button id="add-person-btn" className="gap-2 bg-primary/90 hover:bg-primary font-semibold" /> : <div className="hidden" />
      }>
        <Plus className="w-4 h-4" />
        Add Person
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">{isEditing ? 'Edit Network Member' : 'Add to Network'}</DialogTitle>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Full Name</FormLabel>
                <FormControl>
                  <Input id="person-name" placeholder="e.g. Rahul Sharma" className="bg-secondary/50 border-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Role / Context</FormLabel>
                <FormControl>
                  <Input id="person-role" placeholder="e.g. Tech Lead at Google, College friend" className="bg-secondary/50 border-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="give_take_score" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Give/Take Score</FormLabel>
                  <FormControl>
                    <Input id="person-score" type="number" placeholder="0" className="bg-secondary/50 border-border" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">+ = you give. − = they give</p>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2">
                <FormField control={form.control} name="last_interaction" render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Last Met</FormLabel>
                    <Popover>
                      <PopoverTrigger render={
                        <FormControl>
                          <Button
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
              <Button id="person-submit" type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 font-semibold">
                {loading ? 'Saving…' : (isEditing ? 'Save Changes' : 'Add Person')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
