import api from './api'
import type { CreditRequest } from '../types'

export const creditService = {
  async getAll(filters?: Record<string, string>) {
    const { data } = await api.get<CreditRequest[]>('/credit', { params: filters })
    return data
  },

  async getOne(id: string) {
    const { data } = await api.get<CreditRequest>(`/credit/${id}`)
    return data
  },

  async getByClient(clientId: string) {
    const { data } = await api.get<CreditRequest[]>(`/credit/client/${clientId}`)
    return data
  },

  async create(payload: any) {
    const { data } = await api.post<CreditRequest>('/credit', payload)
    return data
  },

  async simulate(payload: { amount: number; term_months: number; interest_rate?: number }) {
    const { data } = await api.post('/credit/simulate', payload)
    return data
  },

  async analyse(id: string) {
    const { data } = await api.post(`/credit/${id}/analyse`)
    return data
  },

  async assignAnalyst(id: string, analystId: string) {
    const { data } = await api.patch(`/credit/${id}/assign`, { analyst_id: analystId })
    return data
  },

  async makeDecision(
    id: string,
    payload: {
      decision: string
      approved_amount?: number
      conditions?: string
      rejection_reason?: string
    },
  ) {
    const { data } = await api.patch(`/credit/${id}/decision`, payload)
    return data
  },

  async getAnalysis(id: string) {
    const { data } = await api.get(`/credit/${id}/analysis`)
    return data
  },

  async cancel(id: string, reason: string) {
    const { data } = await api.patch(`/credit/${id}/cancel`, { reason })
    return data
  },
}
