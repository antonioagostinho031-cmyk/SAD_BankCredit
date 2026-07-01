import { useState, useRef, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, ChevronDown, CreditCard, FileText, UserCog, User, Bell, ClipboardList } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'

interface PortalLayoutProps {
  children: ReactNode
}

interface SubItem {
  label: string
  path: string
  icon: ReactNode
  description: string
}

interface NavItem {
  label: string
  path?: string
  submenus?: SubItem[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'MEU ATLÂNTICO',
    path: '/portal/dashboard',
  },
  {
    label: 'CRÉDITO',
    submenus: [
      {
        label: 'Solicitar Crédito',
        path: '/portal/credito',
        icon: <CreditCard className="h-4 w-4" />,
        description: 'Explore os nossos produtos',
      },
      {
        label: 'Ver Pedidos',
        path: '/portal/credito/pedidos',
        icon: <FileText className="h-4 w-4" />,
        description: 'Acompanhe as suas solicitações',
      },
    ],
  },
  {
    label: 'CONTA',
    submenus: [
      {
        label: 'Perfil',
        path: '/portal/perfil',
        icon: <User className="h-4 w-4" />,
        description: 'Consultar os seus dados',
      },
      {
        label: 'Actualizar Conta',
        path: '/portal/perfil/atualizacoes',
        icon: <UserCog className="h-4 w-4" />,
        description: 'Solicitar actualização de dados',
      },
      {
        label: 'Pedidos de Actualização',
        path: '/portal/perfil/historico-atualizacoes',
        icon: <ClipboardList className="h-4 w-4" />,
        description: 'Acompanhar pedidos submetidos',
      },
    ],
  },
]

export function PortalLayout({ children }: PortalLayoutProps) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user }   = useAuth()
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleLogout = () => {
    authService.logout()
    navigate('/portal')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const isGroupActive = (item: NavItem) => {
    if (item.path) return isActive(item.path)
    return item.submenus?.some((s) => isActive(s.path)) ?? false
  }

  const openDropdown = (label: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpenMenu(label)
  }

  const scheduleClose = () => {
    timerRef.current = setTimeout(() => setOpenMenu(null), 180)
  }

  const handleNavClick = (item: NavItem) => {
    if (item.path) {
      setOpenMenu(null)
      navigate(item.path)
    }
  }

  const handleSubClick = (path: string) => {
    setOpenMenu(null)
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── Top Header ─────────────────────────────────────── */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('/portal/dashboard')}
          >
            <div className="h-9 w-9 rounded-full bg-[#0097A9] flex items-center justify-center shadow-sm">
              <span className="text-white text-xl font-bold leading-none">φ</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0097A9] leading-tight">ATLÂNTICO</h1>
              <p className="text-[8px] text-gray-400 uppercase tracking-widest leading-none">
                Banco Millennium Atlântico
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#F5A623] text-white px-5 py-2 rounded font-semibold text-sm hover:bg-[#E09615] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>SAIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Navigation ────────────────────────────────── */}
      <div className="bg-[#0097A9] text-white relative z-30">
        <div className="container mx-auto px-4">
          <nav className="flex items-center">
            {NAV_ITEMS.map((item) => {
              const active = isGroupActive(item)
              const hasSubmenu = !!item.submenus

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasSubmenu && openDropdown(item.label)}
                  onMouseLeave={scheduleClose}
                >
                  {/* Nav button */}
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`flex items-center gap-1.5 px-6 py-3.5 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[#007A8A] border-b-2 border-white'
                        : 'hover:bg-[#007A8A]'
                    }`}
                  >
                    {item.label}
                    {hasSubmenu && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openMenu === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown */}
                  {hasSubmenu && openMenu === item.label && (
                    <div
                      className="absolute top-full left-0 w-56 bg-white rounded-b-xl shadow-xl border border-gray-100 py-1.5 z-50"
                      onMouseEnter={() => openDropdown(item.label)}
                      onMouseLeave={scheduleClose}
                    >
                      {item.submenus!.map((sub) => (
                        <button
                          key={sub.path}
                          onClick={() => handleSubClick(sub.path)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left ${
                            isActive(sub.path) ? 'bg-teal-50' : ''
                          }`}
                        >
                          <span className={`mt-0.5 shrink-0 ${
                            isActive(sub.path) ? 'text-[#0097A9]' : 'text-gray-400'
                          }`}>
                            {sub.icon}
                          </span>
                          <div>
                            <p className={`text-sm font-semibold leading-tight ${
                              isActive(sub.path) ? 'text-[#0097A9]' : 'text-gray-800'
                            }`}>
                              {sub.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{sub.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── User Welcome Bar ───────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0097A9]/10 border-2 border-[#0097A9]/20 flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-[#0097A9]">
                {user?.name?.charAt(0).toUpperCase() ?? 'C'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                Bem-vindo, {user?.name?.split(' ')[0] ?? 'Cliente'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString('pt-PT', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <span className="text-xs text-gray-400 hidden sm:block">
            Último acesso:{' '}
            {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Page Content ───────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>

    </div>
  )
}
