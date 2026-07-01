import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value == null || isNaN(value)) return '— Kz'
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
  return `${formatted} Kz`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    aprovado:             'bg-[#0097A9]/10 text-[#0097A9] ring-1 ring-inset ring-[#0097A9]/20',
    aprovado_condicional: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300',
    desembolsado:         'bg-[#0097A9]/10 text-[#0097A9] ring-1 ring-inset ring-[#0097A9]/20',
    rejeitado:            'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200',
    cancelado:            'bg-red-50 text-red-500 ring-1 ring-inset ring-red-200',
    em_analise:           'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300',
    submetido:            'bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200',
    pendente:             'bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200',
  }
  return map[status] ?? 'bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    aprovado: 'Aprovado',
    aprovado_condicional: 'Aprovado Condicional',
    rejeitado: 'Rejeitado',
    em_analise: 'Em Análise',
    submetido: 'Submetido',
    pendente: 'Pendente',
    cancelado: 'Cancelado',
    desembolsado: 'Desembolsado',
    rascunho: 'Rascunho',
    em_validacao: 'Em Validação',
    expirado: 'Expirado',
    incompleto: 'Incompleto',
  }
  return map[status] ?? status
}

export function getRiskColor(level: string): string {
  const map: Record<string, string> = {
    baixo:     'text-[#0097A9]',
    medio:     'text-gray-600',
    alto:      'text-gray-800',
    muito_alto:'text-red-600',
  }
  return map[level] ?? 'text-gray-600'
}

export function getRiskLabel(level: string): string {
  const map: Record<string, string> = {
    baixo: 'Baixo Risco',
    medio: 'Medio Risco',
    alto: 'Alto Risco',
    muito_alto: 'Muito Alto Risco',
  }
  return map[level] ?? level
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-[#0097A9]'
  if (score >= 50) return 'text-gray-600'
  return 'text-red-600'
}

export function truncateText(text: string, maxLength = 50): string {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}
