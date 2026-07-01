import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BackofficeLayout } from './components/layout/BackofficeLayout'
import { PageLoader } from './components/ui/spinner'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { authService } from './services/auth.service'

// Lazy loading de todas as páginas para melhor performance
const LoginPage                     = lazy(() => import('./pages/auth/LoginPage'))
const PortalLoginPage               = lazy(() => import('./pages/portal/PortalLoginPage'))
const PortalDashboardPage           = lazy(() => import('./pages/portal/PortalDashboardPage'))
const PortalCreditoPage             = lazy(() => import('./pages/portal/PortalCreditoPage'))
const PortalSolicitarCreditoPage    = lazy(() => import('./pages/portal/PortalSolicitarCreditoPage'))
const PortalMeusPedidosPage         = lazy(() => import('./pages/portal/PortalMeusPedidosPage'))
const PortalPedidoDetalhePage       = lazy(() => import('./pages/portal/PortalPedidoDetalhePage'))
const PortalFTIPage                 = lazy(() => import('./pages/portal/PortalFTIPage'))
const PortalPerfilPage              = lazy(() => import('./pages/portal/PortalPerfilPage'))
const PortalAtualizacaoContaPage    = lazy(() => import('./pages/portal/PortalAtualizacaoContaPage'))
const PortalHistoricoAtualizacoesPage = lazy(() => import('./pages/portal/PortalHistoricoAtualizacoesPage'))
const PortalAtualizacaoDetalhePage  = lazy(() => import('./pages/portal/PortalAtualizacaoDetalhePage'))
const DashboardPage                 = lazy(() => import('./pages/backoffice/DashboardPage'))
const ClientesPage           = lazy(() => import('./pages/backoffice/ClientesPage'))
const DocumentosPage         = lazy(() => import('./pages/backoffice/DocumentosPage'))
const CreditoPage            = lazy(() => import('./pages/backoffice/CreditoPage'))
const CreditoDetalhePage     = lazy(() => import('./pages/backoffice/CreditoDetalhePage'))
const RiscoPage              = lazy(() => import('./pages/backoffice/RiscoPage'))
const RelatoriosPage         = lazy(() => import('./pages/backoffice/RelatoriosPage'))
const NotificacoesPage       = lazy(() => import('./pages/backoffice/NotificacoesPage'))
const AuditoriaPage          = lazy(() => import('./pages/backoffice/AuditoriaPage'))
const UtilizadoresPage       = lazy(() => import('./pages/backoffice/UtilizadoresPage'))
const SimulacaoPage          = lazy(() => import('./pages/backoffice/SimulacaoPage'))
const ProdutosPage           = lazy(() => import('./pages/backoffice/ProdutosPage'))
const AtualizacoesDadosPage  = lazy(() => import('./pages/backoffice/AtualizacoesDadosPage'))
const NotFoundPage           = lazy(() => import('./pages/NotFoundPage'))
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!authService.isAuthenticated()) {
    const isBackoffice = location.pathname.startsWith('/backoffice')
    return <Navigate to={isBackoffice ? '/login' : '/portal'} replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  if (authService.isAuthenticated()) {
    const user = authService.getStoredUser()
    // Redirecionar clientes para o portal e staff para o backoffice
    const redirectTo = user?.role === 'cliente' ? '/portal/dashboard' : '/backoffice/dashboard'
    return <Navigate to={redirectTo} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader label="A carregar..." />}>
          <Routes>
            {/* Público */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            
            {/* Portal do Cliente */}
            <Route
              path="/portal"
              element={
                <PublicRoute>
                  <PortalLoginPage />
                </PublicRoute>
              }
            />
            
            <Route
              path="/portal/dashboard"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalDashboardPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/credito"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalCreditoPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/credito/solicitar/:productId"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalSolicitarCreditoPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/credito/pedidos"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalMeusPedidosPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/credito/pedido/:id"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalPedidoDetalhePage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/credito/fti/:id"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalFTIPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/perfil"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalPerfilPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/perfil/atualizacoes"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalAtualizacaoContaPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/perfil/historico-atualizacoes"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalHistoricoAtualizacoesPage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/portal/perfil/atualizacoes/:id"
              element={
                <PrivateRoute>
                  <ProtectedRoute allowedRoles={['cliente']} redirectTo="/portal">
                    <PortalAtualizacaoDetalhePage />
                  </ProtectedRoute>
                </PrivateRoute>
              }
            />

            {/* Backoffice — protegido */}
            <Route
              path="/backoffice"
              element={
                <PrivateRoute>
                  <BackofficeLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/backoffice/dashboard" replace />} />
              
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="clientes" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <ClientesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="documentos" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <DocumentosPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="credito" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <CreditoPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="credito/:id" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <CreditoDetalhePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="risco" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <RiscoPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="relatorios" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'supervisor']}>
                    <RelatoriosPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="notificacoes" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <NotificacoesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="auditoria" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <AuditoriaPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="utilizadores" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UtilizadoresPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="simulacao" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <SimulacaoPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="produtos" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'gestor', 'analista', 'supervisor']}>
                    <ProdutosPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="atualizacoes-dados" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'analista', 'gestor']}>
                    <AtualizacoesDadosPage />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/portal" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
