import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Circle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatDateTime } from '../../lib/utils'
import api from '../../services/api'

export default function NotificacoesPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const unreadCount = notifications.filter((n: any) => !n.read).length

  const TYPE_COLORS: Record<string, string> = {
    credit_request_submitted: 'bg-gray-100 text-gray-600',
    credit_decision: 'bg-[#0097A9]/10 text-[#0097A9]',
    document_upload: 'bg-gray-100 text-gray-600',
    default: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notificacoes</CardTitle>
            {unreadCount > 0 && (
              <p className="mt-0.5 text-sm text-gray-500">{unreadCount} por ler</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <svg className="h-6 w-6 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">Sem notificacoes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-2 py-4 transition-colors ${!n.read ? 'bg-[#0097A9]/5' : ''}`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${TYPE_COLORS[n.type] || TYPE_COLORS.default}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.read && <Circle className="mt-1 h-2 w-2 shrink-0 fill-[#0097A9] text-[#0097A9]" />}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      title="Marcar como lida"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


