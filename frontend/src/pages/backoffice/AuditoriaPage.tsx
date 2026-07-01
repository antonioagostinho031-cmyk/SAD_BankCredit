import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { formatDateTime } from '../../lib/utils'
import api from '../../services/api'

const ACTION_LABELS: Record<string, string> = {
  credit_request_created: 'Pedido de Credito Criado',
  credit_decision_made: 'Decisao de Credito',
  credit_analyst_assigned: 'Analista Atribuido',
  credit_request_cancelled: 'Pedido Cancelado',
  document_upload: 'Documento Enviado',
  document_validation: 'Documento Validado',
  document_delete: 'Documento Removido',
}

export default function AuditoriaPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: async () => {
      const { data } = await api.get('/audit', {
        params: {
          ...(actionFilter ? { action: actionFilter } : {}),
          limit: 200,
        },
      })
      return data
    },
  })

  const filtered = logs.filter((log: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    return log.action?.toLowerCase().includes(s) || log.entity_type?.toLowerCase().includes(s) || log.user_id?.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar logs..."
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:border-[#0097A9] focus:outline-none"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
        >
          <option value="">Todas as accoes</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            Registo de Auditoria
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <svg className="h-6 w-6 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accao</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-gray-400">
                      Nenhum registo encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium capitalize">{log.entity_type}</p>
                      {log.entity_id && (
                        <p className="text-xs font-mono text-gray-400">{log.entity_id.slice(0, 12)}...</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-gray-700">{log.users?.name ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      {log.details ? (
                        <span className="text-xs text-gray-500">
                          {JSON.stringify(log.details).slice(0, 60)}...
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


