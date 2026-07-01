import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Eye } from 'lucide-react'
import { clientsService } from '../../services/clients.service'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils'
import type { Client } from '../../types'
import ClientDetailModal from '../../components/backoffice/ClientDetailModal'
import ClientFormModal from '../../components/backoffice/ClientFormModal'
import ClientFinancialProfile from '../../components/backoffice/ClientFinancialProfile'
import { usePermissions } from '../../hooks/usePermissions'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os estados' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_validacao', label: 'Em Validação' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'incompleto', label: 'Incompleto' },
]

export default function ClientesPage() {
  const queryClient = useQueryClient()
  const {
    canCreateClient,
    canUpdateClientEligibility,
    canUpdateClientStatus,
    canUpdateClient,
    canDeleteClient,
  } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [showFinancial, setShowFinancial] = useState(false)
  const [financialClient, setFinancialClient] = useState<Client | null>(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', statusFilter],
    queryFn: () => clientsService.getAll(statusFilter ? { registration_status: statusFilter } : {}),
  })

  const updateEligibilityMutation = useMutation({
    mutationFn: ({ id, eligible }: { id: string; eligible: boolean }) =>
      clientsService.updateEligibility(id, eligible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      clientsService.updateRegistrationStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const filtered = clients.filter((c: Client) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(s) ||
      c.bi_number?.toLowerCase().includes(s) ||
      c.nif?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)
    )
  })

  const handleView = (client: Client) => {
    setSelectedClient(client)
    setShowDetail(true)
  }

  const handleEdit = (client: Client) => {
    setEditClient(client)
    setShowForm(true)
  }

  const handleViewFinancial = (client: Client) => {
    setFinancialClient(client)
    setShowFinancial(true)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, BI ou NIF..."
              className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {canCreateClient() && (
          <Button onClick={() => { setEditClient(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        )}      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            Clientes
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>BI / NIF</TableHead>
                  <TableHead>Rendimento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Elegivel</TableHead>
                  <TableHead>Registo</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-400">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((client: Client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{client.full_name}</p>
                        <p className="text-xs text-gray-400">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-mono">{client.bi_number}</p>
                      <p className="text-xs font-mono text-gray-400">{client.nif}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(client.monthly_income)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(client.registration_status)}`}>
                        {getStatusLabel(client.registration_status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => updateEligibilityMutation.mutate({ id: client.id, eligible: !client.is_eligible_for_credit })}
                        disabled={!canUpdateClientEligibility()}
                        className={`text-xs font-medium transition-opacity ${canUpdateClientEligibility() ? 'hover:underline' : 'cursor-not-allowed opacity-40'} ${client.is_eligible_for_credit ? 'text-[#0097A9]' : 'text-gray-400'}`}
                        title={canUpdateClientEligibility() ? 'Alterar elegibilidade' : 'Sem permisso'}
                      >
                        {client.is_eligible_for_credit ? 'Sim' : 'No'}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDate(client.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewFinancial(client)}
                          className="rounded-md px-3 py-1.5 text-xs font-medium text-[#0097A9] hover:bg-[#0097A9]/5 transition-colors border border-[#0097A9]/30"
                          title="Perfil Financeiro"
                        >
                          Perfil Financeiro
                        </button>
                        <button
                          onClick={() => handleView(client)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          open={showDetail}
          onClose={() => setShowDetail(false)}
          onEdit={() => { setShowDetail(false); handleEdit(selectedClient) }}
        />
      )}

      {/* Form Modal */}
      <ClientFormModal
        client={editClient}
        open={showForm}
        onClose={() => { setShowForm(false); setEditClient(null) }}
        onSuccess={() => {
          setShowForm(false)
          setEditClient(null)
          queryClient.invalidateQueries({ queryKey: ['clients'] })
        }}
      />

      {/* Financial Profile Modal */}
      {financialClient && (
        <ClientFinancialProfile
          clientId={financialClient.id}
          clientName={financialClient.full_name}
          open={showFinancial}
          onClose={() => { setShowFinancial(false); setFinancialClient(null) }}
        />
      )}
    </div>
  )
}


