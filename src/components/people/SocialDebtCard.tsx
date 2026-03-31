'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { People } from '@/types'
import { Users, ArrowRight, UserMinus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function SocialDebtCard() {
  const [debtors, setDebtors] = useState<People[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDebt() {
      try {
        const { data, error } = await supabase
          .from('people')
          .select('*')
          .lte('give_take_score', -5) // Showing any significant debt
          .order('give_take_score', { ascending: true }) // Most debt first
          .limit(3)
        
        if (error) throw error
        setDebtors(data || [])
      } catch (err) {
        console.error('Error fetching social debt:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDebt()
  }, [])

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-border animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl w-full" />
          ))}
        </div>
      </div>
    )
  }

  const hasDebt = debtors.length > 0

  return (
    <div className="glass rounded-2xl p-6 border border-violet-400/20 bg-violet-400/5 relative overflow-hidden group flex flex-col transition-all hover:border-violet-400/40">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          Social CRM
        </h3>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
          hasDebt 
            ? "text-red-400 bg-red-400/10 border-red-400/20" 
            : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        )}>
          {hasDebt ? "Social Debt High" : "Social Capital Stable"}
        </span>
      </div>

      <div className="space-y-4 flex-1">
        {hasDebt ? (
          debtors.map((person) => {
            // Calculate progress percentage (0 to 100 based on -50 to 0 score)
            const debtProgress = Math.min(100, Math.abs((person.give_take_score / 50) * 100))
            
            return (
              <div key={person.id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/item">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">{person.name}</p>
                    <p className="text-[10px] text-muted-foreground">{person.role}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-red-400">
                    {person.give_take_score}
                  </span>
                </div>
                
                {/* Debt Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400 transition-all duration-1000 ease-out" 
                    style={{ width: `${debtProgress}%` }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center opacity-50">
            <UserMinus className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-xs">No significant social debt.</p>
            <p className="text-[10px] text-muted-foreground">Strategic network is balanced.</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <Link 
          href="/people" 
          className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          Manage Relationships
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
