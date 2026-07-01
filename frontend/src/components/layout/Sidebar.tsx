import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, CreditCard, ShieldCheck,
  BarChart3, Bell, ClipboardList, Settings, LogOut, ChevronRight,
  Calculator, Package,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { authService } from '../../services/auth.service'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: string[]
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/backoffice/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Clientes',
    path: '/backoffice/clientes',
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: 'Pedidos de Crédito',
    path: '/backoffice/credito',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    label: 'Avaliação de Risco',
    path: '/backoffice/risco',
    icon: <ShieldCheck className="h-4 w-4" />,
    roles: ['admin', 'analista', 'gestor', 'supervisor'],
  },
  {
    label: 'Relatórios',
    path: '/backoffice/relatorios',
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ['admin', 'gestor', 'supervisor'],
  },
  {
    label: 'Notificações',
    path: '/backoffice/notificacoes',
    icon: <Bell className="h-4 w-4" />,
  },
  {
    label: 'Auditoria',
    path: '/backoffice/auditoria',
    icon: <ClipboardList className="h-4 w-4" />,
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Simulador',
    path: '/backoffice/simulacao',
    icon: <Calculator className="h-4 w-4" />,
    roles: ['admin', 'analista', 'gestor', 'supervisor'],
  },
  {
    label: 'Produtos de Crédito',
    path: '/backoffice/produtos',
    icon: <Package className="h-4 w-4" />,
    roles: ['admin', 'analista', 'gestor', 'supervisor'],
  },
  {
    label: 'Atualização de Dados',
    path: '/backoffice/atualizacoes-dados',
    icon: <FileText className="h-4 w-4" />,
    roles: ['admin', 'gestor'],
  },
  {
    label: 'Utilizadores',
    path: '/backoffice/utilizadores',
    icon: <Settings className="h-4 w-4" />,
    roles: ['admin'],
  },
]

interface SidebarProps {
  user: any
}

export function Sidebar({ user }: SidebarProps) {
  const navigate = useNavigate()

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  )

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-gradient-to-b from-[#0097A9] to-[#007A8A] text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/20 px-5 py-4">
        <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
          <span className="text-[#0097A9] text-xl font-bold leading-none">φ</span>
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-tight">ATLÂNTICO</p>
          <p className="text-[8px] text-white/60 uppercase tracking-widest leading-none">
            Banco Millennium Atlântico
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 border-b border-white/20 px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5A623] text-xs font-bold text-white shadow-md">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
          <p className="text-[10px] capitalize text-white/80">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-3">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-white text-[#0097A9] shadow-sm font-semibold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/20 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-red-500/20 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Terminar Sessão</span>
        </button>
      </div>
    </aside>
  )
}
