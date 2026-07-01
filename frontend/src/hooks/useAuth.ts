import { useState, useEffect } from 'react'
import { authService } from '../services/auth.service'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = authService.getStoredUser()
    setUser(stored)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password)
    setUser(response.user)
    return response
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const hasRole = (...roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isAuthenticated = !!user && authService.isAuthenticated()

  return { user, isLoading, isAuthenticated, login, logout, hasRole }
}
