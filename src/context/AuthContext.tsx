import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getAuth, setAuth as setStoreAuth } from '../lib/auth-store'
import type { UserInfo } from '../lib/auth-store'
import { supabaseUrl, supabaseServiceKey } from '../lib/supabase'

interface AuthContextType {
  isAuthenticated: boolean | null
  user: UserInfo | null
  login: (usuario: string, password: string) => Promise<boolean>
  logout: () => void
}
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() =>
    typeof window !== 'undefined' ? getAuth() : null
  )
  useEffect(() => {
    if (user !== null) return
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const u = JSON.parse(stored) as UserInfo
        setStoreAuth(u)
        setUser(u)
      } else setUser(null)
    } catch { setUser(null) }
  }, [user])

  const login = async (usuario: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/usuarios?select=id,usuario,nombre&usuario=eq.${encodeURIComponent(usuario)}&password=eq.${encodeURIComponent(password)}`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, Accept: 'application/json' } }
      )
      if (!res.ok) return false
      const users = await res.json()
      if (!Array.isArray(users) || users.length === 0) return false
      const u: UserInfo = { id: users[0].id, usuario: users[0].usuario, nombre: users[0].nombre }
      setStoreAuth(u)
      try { localStorage.setItem('auth_user', JSON.stringify(u)) } catch {}
      setUser(u)
      return true
    } catch { return false }
  }
  const logout = () => {
    setStoreAuth(null)
    try { localStorage.removeItem('auth_user') } catch {}
    setUser(null)
  }
  return <AuthContext.Provider value={{ isAuthenticated: user !== null, user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
