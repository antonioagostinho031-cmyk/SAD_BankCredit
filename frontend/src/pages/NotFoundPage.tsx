import { useNavigate, useLocation } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Button } from '../components/ui/button'
import { authService } from '../services/auth.service'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Detectar contexto baseado na URL ou role do usuário
  const isPortalContext = location.pathname.startsWith('/portal')
  const user = authService.getStoredUser()
  const isCliente = user?.role === 'cliente'
  
  // Determinar para onde redirecionar
  const dashboardPath = isPortalContext || isCliente ? '/portal/dashboard' : '/backoffice/dashboard'
  const buttonText = isPortalContext || isCliente ? 'Voltar ao Portal' : 'Voltar ao Dashboard'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <FileQuestion className="h-10 w-10 text-gray-400" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="mt-1 text-base text-gray-500">Pagina nao encontrada</p>
        <p className="mt-0.5 text-sm text-gray-400">
          A pagina que procura nao existe ou foi movida.
        </p>
      </div>
      <Button onClick={() => navigate(dashboardPath)}>
        {buttonText}
      </Button>
    </div>
  )
}
