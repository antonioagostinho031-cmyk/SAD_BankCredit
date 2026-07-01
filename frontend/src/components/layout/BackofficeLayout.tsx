import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { authService } from '../../services/auth.service'

const pageTitles: Record<string, string> = {
  '/backoffice/dashboard': 'Dashboard Executivo',
  '/backoffice/clientes': 'Gestao de Clientes',
  '/backoffice/documentos': 'Gestao Documental',
  '/backoffice/credito': 'Pedidos de Crédito',
  '/backoffice/risco': 'Avaliação de Risco',
  '/backoffice/relatorios': 'Relatorios',
  '/backoffice/notificacoes': 'Notificacoes',
  '/backoffice/auditoria': 'Auditoria',
  '/backoffice/utilizadores': 'Gestao de Utilizadores',
  '/backoffice/simulacao': 'Simulador de Crédito',
  '/backoffice/atualizacoes-dados': 'Atualizacao de Dados',
}

export function BackofficeLayout() {
  const user = authService.getStoredUser()
  const location = useLocation()

  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path),
  )?.[1] ?? 'Backoffice'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={currentTitle} user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
