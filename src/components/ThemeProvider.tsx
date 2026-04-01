'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'sunset' | 'cyber' | 'monochrome' | 'matrix'

const THEMES: Record<Theme, { primary: string, primaryForeground: string, accent: string, accentForeground: string }> = {
  // Maroon/Red + Yellow (Dark primary, dark accent)
  sunset: { primary: '348 75% 45%', primaryForeground: '0 0% 98%', accent: '45 95% 55%', accentForeground: '240 10% 3.9%' },
  // Cyan + Blue (Light primary, medium accent)
  cyber: { primary: '190 90% 50%', primaryForeground: '240 10% 3.9%', accent: '220 90% 60%', accentForeground: '0 0% 98%' },
  // White/Silver (Light primary, light accent)
  monochrome: { primary: '0 0% 95%', primaryForeground: '240 10% 3.9%', accent: '0 0% 70%', accentForeground: '240 10% 3.9%' },
  // Hacker Green (Medium primary, dark accent)
  matrix: { primary: '120 100% 40%', primaryForeground: '240 10% 3.9%', accent: '140 100% 30%', accentForeground: '0 0% 98%' }
}

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'sunset', setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sunset')
  const [mounted, setMounted] = useState(false)

  // Initialize from local storage
  useEffect(() => {
    const saved = localStorage.getItem('c3_theme') as Theme
    if (saved && THEMES[saved]) {
      setThemeState(saved)
    }
    setMounted(true)
  }, [])

  // Apply CSS Variables globally whenever theme changes
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    const colors = THEMES[theme]

    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--primary-foreground', colors.primaryForeground)
    root.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground) // Ensure sidebar matches
    root.style.setProperty('--ring', colors.primary)
    root.style.setProperty('--sidebar-primary', colors.primary)
    root.style.setProperty('--sidebar-ring', colors.primary)
    root.style.setProperty('--accent', colors.accent)
    root.style.setProperty('--accent-foreground', colors.accentForeground)

    localStorage.setItem('c3_theme', theme)
  }, [theme, mounted])

  // Prevent hydration mismatch by blocking render until mounted (or returning default)
  // Actually, returning children immediately is fine since CSS vars handle the styling, 
  // but it might flicker on first load. That's a standard trade-off without SSR inline scripts.

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}
