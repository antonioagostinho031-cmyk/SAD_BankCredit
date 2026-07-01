import { Bell, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../services/dashboard.service'

interface HeaderProps {
  title: string
  user: any
}

export function Header({ title, user }: HeaderProps) {
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await fetch('/api/v1/notifications/unread-count', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      })
      return res.json()
    },
    refetchInterval: 30000,
  })

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <h1 className="text-base font-semibold text-[#0097A9]">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="h-8 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-[#0097A9]/10 hover:text-[#0097A9] transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F5A623] text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0097A9] to-[#007A8A] text-xs font-bold text-white shadow-md">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
