import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { formatDate } from '../../lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../../services/api'
import { usePermissions } from '../../hooks/usePermissions'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  analista: 'Analista de Crédito',
  gestor: 'Gestor de Crédito',
  supervisor: 'Supervisor',
  cliente: 'Cliente',
}

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-gray-900 text-white',
  analista:   'bg-gray-100 text-gray-700',
  gestor:     'bg-[#0097A9]/10 text-[#0097A9]',
  supervisor: 'bg-gray-100 text-gray-700',
  cliente:    'bg-gray-50 text-gray-500',
}

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'analista', 'gestor', 'supervisor']),
})

type FormData = z.infer<typeof schema>

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'analista', label: 'Analista de Crédito' },
  { value: 'gestor', label: 'Gestor de Crédito' },
  { value: 'supervisor', label: 'Supervisor' },
]

export default function UtilizadoresPage() {
  const queryClient = useQueryClient()
  const { canCreateUser, canToggleUserActive, user: currentUser } = usePermissions()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users')
      return data
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      await api.post('/users', data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      reset()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(typeof msg === 'string' ? msg : (Array.isArray(msg) ? msg[0] : 'Erro ao criar utilizador'))
    }
  }

  const filtered = users.filter((u: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.role?.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar utilizadores..."
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:border-[#0097A9] focus:outline-none"
          />
        </div>
        {canCreateUser() && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Novo Utilizador
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            Utilizadores do Sistema
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
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                      Nenhum utilizador encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0097A9]/10 text-xs font-bold text-[#0097A9]">
                          {user.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.active ? 'bg-[#0097A9]/10 text-[#0097A9]' : 'bg-red-50 text-red-600'}`}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDate(user.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {canToggleUserActive() && user.id !== currentUser?.id && (
                          <button
                            onClick={() => toggleActiveMutation.mutate(user.id)}
                            className={`rounded-md p-1.5 transition-colors ${user.active ? 'text-[#0097A9] hover:bg-[#0097A9]/10' : 'text-gray-400 hover:bg-gray-100'}`}
                            title={user.active ? 'Desactivar' : 'Activar'}
                          >
                            {user.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); setError('') }} title="Novo Utilizador" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input label="Nome Completo" {...register('name')} error={errors.name?.message} placeholder="Nome do colaborador" />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} placeholder="email@millenniumatlntico.ao" />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} placeholder="Mínimo 6 caracteres" />
          <Select label="Perfil de Acesso" options={ROLE_OPTIONS} {...register('role')} error={errors.role?.message} placeholder="Seleccione o perfil" />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="outline" type="button" onClick={() => { setShowForm(false); reset(); setError('') }}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Utilizador</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


