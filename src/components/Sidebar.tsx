'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickAddModal } from '@/components/QuickAddModal'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/people', label: 'People', icon: Users },
  { href: '/strategy', label: 'Strategy', icon: Target },
]

function SidebarContent({ collapsed, pathname }: { collapsed?: boolean; pathname: string }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 glow-primary shrink-0">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-base tracking-tight text-foreground leading-none">C3</p>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Dashboard</p>
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div className={cn('px-3 py-4', collapsed && 'px-2')}>
        <QuickAddModal collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        <p className={cn(
          'text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3 mb-2',
          collapsed && 'sr-only'
        )}>
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'sidebar-item rounded-lg',
                isActive && 'sidebar-item-active text-primary',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('px-2 py-4 border-t border-border space-y-1', collapsed && 'px-2')}>
        <Link
          href="/settings"
          className={cn(
            'sidebar-item rounded-lg',
            collapsed && 'justify-center px-2'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Stats badge */}
        {!collapsed && (
          <div className="mt-3 mx-1 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Weekly Progress</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '62%' }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">62% tasks completed</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile: Sheet trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="glass" />}>
            <Menu className="w-4 h-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Persistent sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150 shadow-md"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  )
}
