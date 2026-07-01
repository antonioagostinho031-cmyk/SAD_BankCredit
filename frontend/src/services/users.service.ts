import api from './api'
import type { User } from '../types'

export const usersService = {
  async getAll() {
    const { data } = await api.get<User[]>('/users')
    return data
  },

  async getOne(id: string) {
    const { data } = await api.get<User>(`/users/${id}`)
    return data
  },

  async create(payload: { name: string; email: string; password: string; role: string }) {
    const { data } = await api.post<User>('/users', payload)
    return data
  },

  async update(id: string, payload: Partial<User>) {
    const { data } = await api.patch<User>(`/users/${id}`, payload)
    return data
  },

  async toggleActive(id: string) {
    const { data } = await api.patch(`/users/${id}/toggle-active`)
    return data
  },

  async remove(id: string) {
    await api.delete(`/users/${id}`)
  },
}
