import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string // Novo parâmetro para customizar redirect
}

/**
 * Componente para proteger rotas baseado em roles
 * 
 * @param children - Componente filho a ser renderizado
 * @param allowedRoles - Array de roles permitidas. Se não fornecido, qualquer usuário autenticado pode acessar
 * @param redirectTo - URL de redirecionamento quando não autenticado (padrão: /login)
 */
export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Aguarda carregar os dados do usuário
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">A carregar...</p>
        </div>
      </div>
    )
  }

  // Não autenticado - redireciona para login apropriado
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />
  }

  // Se não há restrição de roles, permite acesso
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>
  }

  // Verifica se o usuário tem uma das roles permitidas
  if (!allowedRoles.includes(user.role)) {
    // Determina para onde redirecionar baseado na role do usuário
    const defaultRedirect = user.role === 'cliente' ? '/portal/dashboard' : '/backoffice/dashboard'
    
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="mb-4 text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Sua role <span className="font-semibold">{user.role}</span> não tem acesso a este
            recurso.
          </p>
          <button
            onClick={() => window.location.href = defaultRedirect}
            className="w-full rounded-lg bg-[#0097A9] px-4 py-2 text-white hover:bg-[#007A8A] transition-colors"
          >
            Ir para {user.role === 'cliente' ? 'Portal' : 'Backoffice'}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
