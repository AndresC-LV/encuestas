import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
interface ThemeContextType { modoOscuro: boolean; toggleModo: () => void }
const ThemeContext = createContext<ThemeContextType | null>(null)
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modoOscuro, setModoOscuro] = useState(true)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('modoOscuro')
    if (stored !== null) setModoOscuro(stored === 'true')
    setMounted(true)
  }, [])
  useEffect(() => { if (mounted) document.documentElement.classList.toggle('dark', modoOscuro) }, [modoOscuro, mounted])
  const toggleModo = () => setModoOscuro(prev => {
    const next = !prev
    localStorage.setItem('modoOscuro', String(next))
    return next
  })
  return <ThemeContext.Provider value={{ modoOscuro, toggleModo }}>{children}</ThemeContext.Provider>
}
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
