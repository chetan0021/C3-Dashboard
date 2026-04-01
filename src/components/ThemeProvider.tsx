'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'sunset' | 'cyber' | 'monochrome' | 'matrix'

const THEMES: Record<Theme, { primary: string, accent: string }> = {
  // Maroon/Red + Yellow
  sunset: { primary: '348 75% 45%', accent: '45 95% 55%' },
  // Cyan + Blue
  cyber: { primary: '190 90% 50%', accent: '220 90% 60%' },
  // White/Silver
  monochrome: { primary: '0 0% 95%', accent: '0 0% 70%' },
  // Hacker Green
  matrix: { primary: '120 100% 40%', accent: '140 100% 30%' }
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
    root.style.setProperty('--ring', colors.primary)
    root.style.setProperty('--sidebar-primary', colors.primary)
    root.style.setProperty('--sidebar-ring', colors.primary)
    root.style.setProperty('--accent', colors.accent)

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
