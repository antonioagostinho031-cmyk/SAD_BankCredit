import api from './api'

export const dashboardService = {
  async getSummary() {
    const { data } = await api.get('/dashboard/summary')
    return data
  },

  async getCreditStats() {
    const { data } = await api.get('/dashboard/credit-stats')
    return data
  },

  async getClientStats() {
    const { data } = await api.get('/dashboard/client-stats')
    return data
  },

  async getCreditTrend(months?: number) {
    const { data } = await api.get('/dashboard/credit-trend', { params: { months } })
    return data
  },

  async getRiskDistribution() {
    const { data } = await api.get('/dashboard/risk-distribution')
    return data
  },

  async getRecentActivity(limit?: number) {
    const { data } = await api.get('/dashboard/recent-activity', { params: { limit } })
    return data
  },

  async getAnalystPerformance() {
    const { data } = await api.get('/dashboard/analyst-performance')
    return data
  },
}
