import api from './api'
import type { Client } from '../types'

export const clientsService = {
  async getAll(filters?: Record<string, string>) {
    const { data } = await api.get<Client[]>('/clients', { params: filters })
    return data
  },

  async getOne(id: string) {
    const { data } = await api.get<Client>(`/clients/${id}`)
    return data
  },

  async getMyProfile() {
    const { data } = await api.get<Client>('/clients/my-profile')
    return data
  },

  async create(payload: Partial<Client>) {
    const { data } = await api.post<Client>('/clients', payload)
    return data
  },

  async update(id: string, payload: Partial<Client>) {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload)
    return data
  },

  async updateEligibility(id: string, isEligible: boolean) {
    const { data } = await api.patch(`/clients/${id}/eligibility`, { is_eligible: isEligible })
    return data
  },

  async updateRegistrationStatus(id: string, status: string) {
    const { data } = await api.patch(`/clients/${id}/registration-status`, { status })
    return data
  },

  async getStats(id: string) {
    const { data } = await api.get(`/clients/${id}/stats`)
    return data
  },
}
