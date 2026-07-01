import api from './api'
import type { Document } from '../types'

export const documentsService = {
  async getAll(filters?: Record<string, string>) {
    const { data } = await api.get<Document[]>('/documents', { params: filters })
    return data
  },

  async getByClient(clientId: string) {
    const { data } = await api.get<Document[]>(`/documents/client/${clientId}`)
    return data
  },

  async getClientSummary(clientId: string) {
    const { data } = await api.get(`/documents/client/${clientId}/summary`)
    return data
  },

  async upload(file: File, clientId: string, documentType: string, expiryDate?: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', clientId)
    formData.append('document_type', documentType)
    if (expiryDate) formData.append('expiry_date', expiryDate)

    const { data } = await api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async validate(id: string, status: string, notes?: string) {
    const { data } = await api.patch(`/documents/${id}/validate`, {
      document_id: id,
      status,
      validation_notes: notes,
    })
    return data
  },

  async getValidations(id: string) {
    const { data } = await api.get(`/documents/${id}/validations`)
    return data
  },

  async getUrl(id: string) {
    const { data } = await api.get(`/documents/${id}/url`)
    return data
  },

  async remove(id: string) {
    await api.delete(`/documents/${id}`)
  },
}
