import api from './api'
import type { AuthResponse } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  async portalLogin(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/portal/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },

  getStoredUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  },
}
