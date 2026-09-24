import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type UserSession } from '@/services/rh'

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<UserSession>
  registerAdmin: (email: string, pass: string, name: string) => Promise<UserSession>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const current = authService.getCurrentUser()
      setUser(current)
    } catch (e) {
      console.error('Erro ao recuperar usuário:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const session = await authService.login(email, pass)
    setUser(session)
    return session
  }

  const registerAdmin = async (email: string, pass: string, name: string) => {
    const session = await authService.registerAdmin(email, pass, name)
    setUser(session)
    return session
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider')
  }
  return context
}
