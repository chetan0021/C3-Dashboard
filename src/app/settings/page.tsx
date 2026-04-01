'use client'

import React, { useEffect, useRef } from 'react'
import { useTheme, Theme } from '@/components/ThemeProvider'
import mermaid from 'mermaid'
import { Paintbrush, Webhook, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const THEME_OPTIONS: { id: Theme; label: string; primary: string; accent: string }[] = [
  { id: 'monochrome', label: 'Black & White', primary: 'bg-zinc-200', accent: 'bg-zinc-500' },
  { id: 'sunset', label: 'Sunset (Warm)', primary: 'bg-rose-600', accent: 'bg-yellow-500' },
  { id: 'cyber', label: 'Cyber (Cool)', primary: 'bg-cyan-500', accent: 'bg-blue-500' },
  { id: 'matrix', label: 'Matrix (Hacker)', primary: 'bg-green-500', accent: 'bg-emerald-600' },
]

const ECOSYSTEM_CHART = `
graph TD
    classDef ai fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#000
    classDef tasks fill:#e11d48,stroke:#be123c,stroke-width:2px,color:#fff
    classDef people fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff
    classDef finance fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff

    subgraph "C3 Ecosystem"
        T[Tasks and Deadlines]:::tasks
        P[Social CRM]:::people
        F[Financial Impact]:::finance
        AI(Commander AI Brain):::ai
        
        T -->|Completing priority task| P
        T -->|If task saves money| F
        
        P -.->|Provide Give-Take Deficit| AI
        T -.->|Provide Heat and Urgency| AI
        F -.->|Provide Wealth Leakage Data| AI
        
        AI -->|Generates Tactical Battle Plan| You((You))
    end
`

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      fontFamily: 'inherit',
      securityLevel: 'loose'
    })
    
    const renderChart = async () => {
      if (mermaidRef.current) {
        try {
          // Clear previous render to prevent ID collisions
          mermaidRef.current.innerHTML = ''
          const { svg } = await mermaid.render(`mermaid-chart-${theme}`, ECOSYSTEM_CHART)
          mermaidRef.current.innerHTML = svg
        } catch (e) {
          console.error('Mermaid render error:', e)
        }
      }
    }
    
    // Slight delay for font loading/layout stability
    setTimeout(renderChart, 100)
  }, [theme])

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your dashboard themes and view architectural data connections.</p>
      </div>

      {/* Theme Selector Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-primary" />
          Aesthetic Theme
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={cn(
                "glass rounded-2xl p-5 border text-left flex flex-col gap-3 transition-transform hover:scale-[1.02]",
                theme === opt.id ? "border-primary ring-1 ring-primary/50 shadow-md" : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-sm">{opt.label}</span>
                {theme === opt.id && <Check className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-full", opt.primary)} />
                <div className={cn("w-6 h-6 rounded-full -ml-3 border-2 border-background", opt.accent)} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Architecture Flow Diagram */}
      <section className="space-y-4 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" />
          System Ecosystem & Flow
        </h2>
        <p className="text-sm text-muted-foreground">
          This diagram maps out how your C3 Dashboard conceptually aggregates modules. Notice how your task execution cascades into both financial metrics and relationship (Give/Take) scores before feeding directly into the Commander AI.
        </p>
        <div className="glass rounded-2xl p-8 border border-border overflow-x-auto w-full flex justify-center bg-black/50 overflow-hidden min-h-[400px]">
          <div ref={mermaidRef} className="flex justify-center w-full min-w-[600px]" />
        </div>
      </section>
    </div>
  )
}
