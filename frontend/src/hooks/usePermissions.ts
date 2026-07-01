import { useAuth } from './useAuth'

/**
 * DEFINIÇÃO DE PERMISSÕES POR ROLE
 * Baseado em backend/src/common/constants/roles.constants.ts
 */

export type UserRole = 'admin' | 'gestor' | 'analista' | 'supervisor' | 'cliente'

export interface Permission {
  module: string
  action: string
  roles: UserRole[]
}

// Roles que podem acessar o backoffice
const BACKOFFICE_ROLES: UserRole[] = ['admin', 'gestor', 'analista', 'supervisor']

// Permissões do Dashboard
const DASHBOARD_PERMISSIONS = {
  viewSummary: ['admin', 'gestor', 'supervisor'] as UserRole[],
  viewCreditStats: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  viewClientStats: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  viewCreditTrend: ['admin', 'gestor', 'supervisor'] as UserRole[],
  viewRiskDistribution: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  viewRecentActivity: ['admin', 'gestor', 'supervisor'] as UserRole[],
  viewAnalystPerformance: ['admin', 'gestor', 'supervisor'] as UserRole[],
}

// Permissões de Clientes
const CLIENTS_PERMISSIONS = {
  create: ['admin', 'analista'] as UserRole[],
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  update: ['admin', 'analista', 'gestor'] as UserRole[],
  delete: ['admin'] as UserRole[],
  viewStats: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  updateEligibility: ['admin', 'gestor', 'analista'] as UserRole[],
  updateStatus: ['admin', 'analista'] as UserRole[],
}

// Permissões de Documentos
const DOCUMENTS_PERMISSIONS = {
  upload: ['admin', 'analista'] as UserRole[],
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  validate: ['admin', 'analista'] as UserRole[],
  delete: ['admin', 'analista'] as UserRole[],
  download: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
}

// Permissões de Crédito
const CREDIT_PERMISSIONS = {
  create: ['admin', 'analista'] as UserRole[],
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  update: ['admin', 'analista', 'gestor'] as UserRole[],
  delete: ['admin'] as UserRole[],
  analyse: ['admin', 'analista'] as UserRole[],
  assignAnalyst: ['admin', 'gestor', 'supervisor'] as UserRole[],
  makeDecision: ['admin', 'gestor', 'supervisor'] as UserRole[],
  viewAnalysis: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
}

// Permissões de Scoring
const SCORING_PERMISSIONS = {
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  calculate: ['admin', 'analista'] as UserRole[],
  viewDetails: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
}

// Permissões de Risco
const RISK_PERMISSIONS = {
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  assess: ['admin', 'analista'] as UserRole[],
  viewHistory: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
}

// Permissões de Decisões
const DECISION_PERMISSIONS = {
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  create: ['admin', 'analista'] as UserRole[],
  override: ['admin', 'gestor'] as UserRole[],
}

// Permissões de Relatórios
const REPORTS_PERMISSIONS = {
  view: ['admin', 'gestor', 'supervisor'] as UserRole[],
  generate: ['admin', 'gestor', 'supervisor'] as UserRole[],
  export: ['admin', 'gestor', 'supervisor'] as UserRole[],
}

// Permissões de Auditoria
const AUDIT_PERMISSIONS = {
  view: ['admin', 'supervisor'] as UserRole[],
  export: ['admin', 'supervisor'] as UserRole[],
}

// Permissões de Notificações
const NOTIFICATIONS_PERMISSIONS = {
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  markRead: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
}

// Permissões de Utilizadores
const USERS_PERMISSIONS = {
  create: ['admin'] as UserRole[],
  view: ['admin', 'gestor', 'supervisor'] as UserRole[],
  update: ['admin'] as UserRole[],
  delete: ['admin'] as UserRole[],
  toggleActive: ['admin'] as UserRole[],
  changeRole: ['admin'] as UserRole[],
}

// Permissões de Simulação
const SIMULATION_PERMISSIONS = {
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  run: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
}

// Permissões de Produtos
const PRODUCTS_PERMISSIONS = {
  view: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  create: ['admin'] as UserRole[],
  update: ['admin'] as UserRole[],
  delete: ['admin'] as UserRole[],
  viewFTI: ['admin', 'gestor', 'analista', 'supervisor'] as UserRole[],
  createFTI: ['admin'] as UserRole[],
  updateFTI: ['admin'] as UserRole[],
  deleteFTI: ['admin'] as UserRole[],
}

/**
 * Hook para verificar permissões do usuário
 */
export function usePermissions() {
  const { user } = useAuth()

  /**
   * Verifica se o usuário tem uma das roles fornecidas
   */
  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role as UserRole)
  }

  /**
   * Verifica se o usuário pode acessar o backoffice
   */
  const canAccessBackoffice = (): boolean => {
    if (!user) return false
    return BACKOFFICE_ROLES.includes(user.role as UserRole)
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role as UserRole)
  }

  // Dashboard
  const canViewDashboardSummary = () => hasPermission(DASHBOARD_PERMISSIONS.viewSummary)
  const canViewCreditStats = () => hasPermission(DASHBOARD_PERMISSIONS.viewCreditStats)
  const canViewClientStats = () => hasPermission(DASHBOARD_PERMISSIONS.viewClientStats)
  const canViewCreditTrend = () => hasPermission(DASHBOARD_PERMISSIONS.viewCreditTrend)
  const canViewRiskDistribution = () => hasPermission(DASHBOARD_PERMISSIONS.viewRiskDistribution)
  const canViewRecentActivity = () => hasPermission(DASHBOARD_PERMISSIONS.viewRecentActivity)
  const canViewAnalystPerformance = () => hasPermission(DASHBOARD_PERMISSIONS.viewAnalystPerformance)

  // Clientes
  const canCreateClient = () => hasPermission(CLIENTS_PERMISSIONS.create)
  const canViewClients = () => hasPermission(CLIENTS_PERMISSIONS.view)
  const canUpdateClient = () => hasPermission(CLIENTS_PERMISSIONS.update)
  const canDeleteClient = () => hasPermission(CLIENTS_PERMISSIONS.delete)
  const canViewClientStatistics = () => hasPermission(CLIENTS_PERMISSIONS.viewStats)
  const canUpdateClientEligibility = () => hasPermission(CLIENTS_PERMISSIONS.updateEligibility)
  const canUpdateClientStatus = () => hasPermission(CLIENTS_PERMISSIONS.updateStatus)

  // Documentos
  const canUploadDocument = () => hasPermission(DOCUMENTS_PERMISSIONS.upload)
  const canViewDocuments = () => hasPermission(DOCUMENTS_PERMISSIONS.view)
  const canValidateDocument = () => hasPermission(DOCUMENTS_PERMISSIONS.validate)
  const canDeleteDocument = () => hasPermission(DOCUMENTS_PERMISSIONS.delete)
  const canDownloadDocument = () => hasPermission(DOCUMENTS_PERMISSIONS.download)

  // Crédito
  const canCreateCreditRequest = () => hasPermission(CREDIT_PERMISSIONS.create)
  const canViewCreditRequests = () => hasPermission(CREDIT_PERMISSIONS.view)
  const canUpdateCreditRequest = () => hasPermission(CREDIT_PERMISSIONS.update)
  const canDeleteCreditRequest = () => hasPermission(CREDIT_PERMISSIONS.delete)
  const canAnalyseCreditRequest = () => hasPermission(CREDIT_PERMISSIONS.analyse)
  const canAssignAnalyst = () => hasPermission(CREDIT_PERMISSIONS.assignAnalyst)
  const canMakeCreditDecision = () => hasPermission(CREDIT_PERMISSIONS.makeDecision)
  const canViewCreditAnalysis = () => hasPermission(CREDIT_PERMISSIONS.viewAnalysis)

  // Scoring
  const canViewScoring = () => hasPermission(SCORING_PERMISSIONS.view)
  const canCalculateScoring = () => hasPermission(SCORING_PERMISSIONS.calculate)
  const canViewScoringDetails = () => hasPermission(SCORING_PERMISSIONS.viewDetails)

  // Risco
  const canViewRisk = () => hasPermission(RISK_PERMISSIONS.view)
  const canAssessRisk = () => hasPermission(RISK_PERMISSIONS.assess)
  const canViewRiskHistory = () => hasPermission(RISK_PERMISSIONS.viewHistory)

  // Decisões
  const canViewDecisions = () => hasPermission(DECISION_PERMISSIONS.view)
  const canCreateDecision = () => hasPermission(DECISION_PERMISSIONS.create)
  const canOverrideDecision = () => hasPermission(DECISION_PERMISSIONS.override)

  // Relatórios
  const canViewReports = () => hasPermission(REPORTS_PERMISSIONS.view)
  const canGenerateReports = () => hasPermission(REPORTS_PERMISSIONS.generate)
  const canExportReports = () => hasPermission(REPORTS_PERMISSIONS.export)

  // Auditoria
  const canViewAudit = () => hasPermission(AUDIT_PERMISSIONS.view)
  const canExportAudit = () => hasPermission(AUDIT_PERMISSIONS.export)

  // Notificações
  const canViewNotifications = () => hasPermission(NOTIFICATIONS_PERMISSIONS.view)
  const canMarkNotificationsRead = () => hasPermission(NOTIFICATIONS_PERMISSIONS.markRead)

  // Utilizadores
  const canCreateUser = () => hasPermission(USERS_PERMISSIONS.create)
  const canViewUsers = () => hasPermission(USERS_PERMISSIONS.view)
  const canUpdateUser = () => hasPermission(USERS_PERMISSIONS.update)
  const canDeleteUser = () => hasPermission(USERS_PERMISSIONS.delete)
  const canToggleUserActive = () => hasPermission(USERS_PERMISSIONS.toggleActive)
  const canChangeUserRole = () => hasPermission(USERS_PERMISSIONS.changeRole)

  // Simulação
  const canViewSimulation = () => hasPermission(SIMULATION_PERMISSIONS.view)
  const canRunSimulation = () => hasPermission(SIMULATION_PERMISSIONS.run)

  // Produtos
  const canViewProducts = () => hasPermission(PRODUCTS_PERMISSIONS.view)
  const canCreateProduct = () => hasPermission(PRODUCTS_PERMISSIONS.create)
  const canUpdateProduct = () => hasPermission(PRODUCTS_PERMISSIONS.update)
  const canDeleteProduct = () => hasPermission(PRODUCTS_PERMISSIONS.delete)
  const canViewFTI = () => hasPermission(PRODUCTS_PERMISSIONS.viewFTI)
  const canCreateFTI = () => hasPermission(PRODUCTS_PERMISSIONS.createFTI)
  const canUpdateFTI = () => hasPermission(PRODUCTS_PERMISSIONS.updateFTI)
  const canDeleteFTI = () => hasPermission(PRODUCTS_PERMISSIONS.deleteFTI)

  return {
    user,
    hasRole,
    canAccessBackoffice,
    hasPermission,
    
    // Dashboard
    canViewDashboardSummary,
    canViewCreditStats,
    canViewClientStats,
    canViewCreditTrend,
    canViewRiskDistribution,
    canViewRecentActivity,
    canViewAnalystPerformance,
    
    // Clientes
    canCreateClient,
    canViewClients,
    canUpdateClient,
    canDeleteClient,
    canViewClientStatistics,
    canUpdateClientEligibility,
    canUpdateClientStatus,
    
    // Documentos
    canUploadDocument,
    canViewDocuments,
    canValidateDocument,
    canDeleteDocument,
    canDownloadDocument,
    
    // Crédito
    canCreateCreditRequest,
    canViewCreditRequests,
    canUpdateCreditRequest,
    canDeleteCreditRequest,
    canAnalyseCreditRequest,
    canAssignAnalyst,
    canMakeCreditDecision,
    canViewCreditAnalysis,
    
    // Scoring
    canViewScoring,
    canCalculateScoring,
    canViewScoringDetails,
    
    // Risco
    canViewRisk,
    canAssessRisk,
    canViewRiskHistory,
    
    // Decisões
    canViewDecisions,
    canCreateDecision,
    canOverrideDecision,
    
    // Relatórios
    canViewReports,
    canGenerateReports,
    canExportReports,
    
    // Auditoria
    canViewAudit,
    canExportAudit,
    
    // Notificações
    canViewNotifications,
    canMarkNotificationsRead,
    
    // Utilizadores
    canCreateUser,
    canViewUsers,
    canUpdateUser,
    canDeleteUser,
    canToggleUserActive,
    canChangeUserRole,
    
    // Simulação
    canViewSimulation,
    canRunSimulation,
    
    // Produtos
    canViewProducts,
    canCreateProduct,
    canUpdateProduct,
    canDeleteProduct,
    canViewFTI,
    canCreateFTI,
    canUpdateFTI,
    canDeleteFTI,
  }
}
