import api from './api'

export const reportsService = {
  async getCreditReport(filters?: Record<string, string>) {
    const { data } = await api.get('/reports/credit', { params: filters })
    return data
  },

  async getClientReport(filters?: Record<string, string>) {
    const { data } = await api.get('/reports/clients', { params: filters })
    return data
  },

  async getRiskReport(filters?: Record<string, string>) {
    const { data } = await api.get('/reports/risk', { params: filters })
    return data
  },

  async getDocumentReport(filters?: Record<string, string>) {
    const { data } = await api.get('/reports/documents', { params: filters })
    return data
  },
}
