'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { People } from '@/types'
import { PersonCard } from '@/components/people/PersonCard'
import { AddPersonModal } from '@/components/people/AddPersonModal'
import { cn } from '@/lib/utils'
import {
  Users, Heart, AlertCircle, Loader2, RefreshCw,
  TrendingDown, LayoutGrid, Search, Trash2, Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Filter = 'all' | 'needs_action' | 'balanced' | 'givers'

const FILTERS: { key: Filter; label: string; icon: React.ElementType; activeClass: string }[] = [
  { key: 'all',          label: 'All',          icon: LayoutGrid,    activeClass: 'bg-primary/15 text-primary border-primary/40' },
  { key: 'needs_action', label: '⚡ Reach Out', icon: AlertCircle,   activeClass: 'bg-amber-400/15 text-amber-400 border-amber-400/40' },
  { key: 'balanced',     label: 'Balanced',     icon: Heart,         activeClass: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/40' },
  { key: 'givers',       label: 'They Give',    icon: TrendingDown,  activeClass: 'bg-red-400/15 text-red-400 border-red-400/40' },
]

export default function PeoplePage() {
  const [people, setPeople] = useState<People[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const [editingPerson, setEditingPerson] = useState<People | undefined>()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const [personToDelete, setPersonToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPeople = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('give_take_score', { ascending: true })
    if (!error && data) setPeople(data as People[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPeople() }, [fetchPeople])

  const confirmDelete = async () => {
    if (!personToDelete) return
    setIsDeleting(true)
    const { error } = await supabase.from('people').delete().eq('id', personToDelete)
    if (!error) {
      fetchPeople()
    }
    setIsDeleting(false)
    setPersonToDelete(null)
  }

  const handleDelete = (id: string) => {
    setPersonToDelete(id)
  }

  const handleEdit = (person: People) => {
    setEditingPerson(person)
    setIsEditModalOpen(true)
  }

  const filtered = useMemo(() => {
    let result = people

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q)
      )
    }

    // Filter tab
    switch (filter) {
      case 'needs_action':
        result = result.filter((p) => p.give_take_score <= -10)
        break
      case 'balanced':
        result = result.filter((p) => p.give_take_score > -10 && p.give_take_score < 10)
        break
      case 'givers':
        result = result.filter((p) => p.give_take_score < -20)
        break
    }

    return result
  }, [people, filter, search])

  // Stats
  const needsAction = people.filter((p) => p.give_take_score <= -10).length
  const balanced = people.filter((p) => p.give_take_score > -10 && p.give_take_score <= 10).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Network CRM</h1>
            {needsAction > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400">
                {needsAction} need attention
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Track relationships and maintain your give/take balance.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchPeople} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button 
            onClick={() => { setEditingPerson(undefined); setIsEditModalOpen(true); }} 
            className="flex items-center gap-2 bg-primary/90 hover:bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Person
          </button>
          <AddPersonModal 
            onAdded={fetchPeople} 
            personToEdit={editingPerson}
            open={isEditModalOpen}
            onOpenChange={(open) => {
              setIsEditModalOpen(open)
              if (!open) setTimeout(() => setEditingPerson(undefined), 300)
            }}
          />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{people.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">In Network</p>
        </div>
        <div className="glass rounded-xl p-3 border border-amber-400/20 text-center">
          <p className="text-2xl font-bold text-amber-400">{needsAction}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Need Action</p>
        </div>
        <div className="glass rounded-xl p-3 border border-emerald-400/20 text-center">
          <p className="text-2xl font-bold text-emerald-400">{balanced}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Balanced</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 border border-border">
          {FILTERS.map(({ key, label, icon: Icon, activeClass }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
                filter === key
                  ? activeClass
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading network…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 border border-border text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {people.length === 0 ? 'No one in your network yet.' : 'No matches for this filter.'}
          </p>
          {people.length === 0 && (
            <p className="text-muted-foreground/60 text-xs mt-1">Add people you know and track your relationships.</p>
          )}
        </div>
      ) : (
        <>
          {/* "Needs Action" banner if any */}
          {filter === 'all' && needsAction > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-400/8 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-300">
                <strong>{needsAction} connection{needsAction > 1 ? 's' : ''}</strong> highlighted — your give side is low. Reach out and help!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((person) => (
              <PersonCard 
                key={person.id} 
                person={person} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <Dialog open={!!personToDelete} onOpenChange={(o) => !o && !isDeleting && setPersonToDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/20 mb-4">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-xl font-bold mb-2">Remove from Network?</DialogTitle>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to remove this person? Their history and give/take score will be permanently erased.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPersonToDelete(null)} disabled={isDeleting}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 font-bold text-white shadow-lg">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
