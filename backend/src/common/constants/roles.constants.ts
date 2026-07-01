/**
 * ROLES E PERMISSÕES DO SISTEMA
 * Sistema de Apoio à Decisão para Concessão de Crédito
 * Banco Millennium Atlântico
 */

// ====================================
// ROLES DISPONÍVEIS
// ====================================
export enum UserRole {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  ANALISTA = 'analista',
  SUPERVISOR = 'supervisor',
  CLIENTE = 'cliente',
}

// ====================================
// ROLES QUE PODEM ACESSAR O BACKOFFICE
// ====================================
export const BACKOFFICE_ROLES = [
  UserRole.ADMIN,
  UserRole.GESTOR,
  UserRole.ANALISTA,
  UserRole.SUPERVISOR,
];

// ====================================
// PERMISSÕES POR MÓDULO
// ====================================

/**
 * DASHBOARD
 * Visualização de estatísticas e métricas do sistema
 */
export const DASHBOARD_PERMISSIONS = {
  VIEW_SUMMARY: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  VIEW_CREDIT_STATS: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  VIEW_CLIENT_STATS: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  VIEW_CREDIT_TREND: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  VIEW_RISK_DISTRIBUTION: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  VIEW_RECENT_ACTIVITY: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  VIEW_ANALYST_PERFORMANCE: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
};

/**
 * CLIENTES
 * Gestão de clientes bancários
 */
export const CLIENTS_PERMISSIONS = {
  CREATE: [UserRole.ADMIN, UserRole.ANALISTA],
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  UPDATE: [UserRole.ADMIN, UserRole.ANALISTA, UserRole.GESTOR],
  DELETE: [UserRole.ADMIN],
  VIEW_STATS: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  UPDATE_ELIGIBILITY: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA],
  UPDATE_STATUS: [UserRole.ADMIN, UserRole.ANALISTA],
};

/**
 * DOCUMENTOS
 * Gestão de documentos dos clientes
 */
export const DOCUMENTS_PERMISSIONS = {
  UPLOAD: [UserRole.ADMIN, UserRole.ANALISTA],
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  VALIDATE: [UserRole.ADMIN, UserRole.ANALISTA],
  DELETE: [UserRole.ADMIN, UserRole.ANALISTA],
  DOWNLOAD: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
};

/**
 * PEDIDOS DE CRÉDITO
 * Gestão de solicitações de crédito
 */
export const CREDIT_PERMISSIONS = {
  CREATE: [UserRole.ADMIN, UserRole.ANALISTA],
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  UPDATE: [UserRole.ADMIN, UserRole.ANALISTA, UserRole.GESTOR],
  DELETE: [UserRole.ADMIN],
  ANALYSE: [UserRole.ADMIN, UserRole.ANALISTA],
  ASSIGN_ANALYST: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  MAKE_DECISION: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  VIEW_ANALYSIS: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
};

/**
 * SCORING E ANÁLISE DE CRÉDITO
 * Sistema de pontuação de crédito
 */
export const SCORING_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  CALCULATE: [UserRole.ADMIN, UserRole.ANALISTA],
  VIEW_DETAILS: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
};

/**
 * AVALIAÇÃO DE RISCO
 * Análise de risco de crédito
 */
export const RISK_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  ASSESS: [UserRole.ADMIN, UserRole.ANALISTA],
  VIEW_HISTORY: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
};

/**
 * DECISÕES AUTOMÁTICAS
 * Sistema de decisão automática de crédito
 */
export const DECISION_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  CREATE: [UserRole.ADMIN, UserRole.ANALISTA],
  OVERRIDE: [UserRole.ADMIN, UserRole.GESTOR],
};

/**
 * RELATÓRIOS
 * Geração de relatórios gerenciais
 */
export const REPORTS_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  GENERATE: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  EXPORT: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
};

/**
 * AUDITORIA
 * Logs de auditoria do sistema
 */
export const AUDIT_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.SUPERVISOR],
  EXPORT: [UserRole.ADMIN, UserRole.SUPERVISOR],
};

/**
 * NOTIFICAÇÕES
 * Sistema de notificações
 */
export const NOTIFICATIONS_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  MARK_READ: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
};

/**
 * UTILIZADORES
 * Gestão de utilizadores do sistema
 */
export const USERS_PERMISSIONS = {
  CREATE: [UserRole.ADMIN],
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR],
  UPDATE: [UserRole.ADMIN],
  DELETE: [UserRole.ADMIN],
  TOGGLE_ACTIVE: [UserRole.ADMIN],
  CHANGE_ROLE: [UserRole.ADMIN],
};

/**
 * SIMULADOR DE CRÉDITO
 * Simulação de cenários de crédito
 */
export const SIMULATION_PERMISSIONS = {
  VIEW: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
  RUN: [UserRole.ADMIN, UserRole.GESTOR, UserRole.ANALISTA, UserRole.SUPERVISOR],
};

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Verifica se um usuário tem uma role específica
 */
export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

/**
 * Verifica se uma role pode acessar o backoffice
 */
export function canAccessBackoffice(userRole: string): boolean {
  return BACKOFFICE_ROLES.includes(userRole as UserRole);
}

/**
 * Retorna descrição da role
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions = {
    [UserRole.ADMIN]: 'Administrador do Sistema - Acesso total',
    [UserRole.GESTOR]: 'Gestor de Crédito - Aprovação e supervisão',
    [UserRole.ANALISTA]: 'Analista de Crédito - Análise e recomendações',
    [UserRole.SUPERVISOR]: 'Supervisor - Auditoria e relatórios',
    [UserRole.CLIENTE]: 'Cliente - Portal Internet Banking',
  };
  return descriptions[role] || 'Role desconhecida';
}

/**
 * Retorna permissões disponíveis para uma role
 */
export function getRolePermissions(role: UserRole): string[] {
  const permissions: string[] = [];

  if (DASHBOARD_PERMISSIONS.VIEW_SUMMARY.includes(role)) {
    permissions.push('Dashboard Executivo');
  }
  if (CLIENTS_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Visualizar Clientes');
  }
  if (CLIENTS_PERMISSIONS.CREATE.includes(role)) {
    permissions.push('Criar Clientes');
  }
  if (DOCUMENTS_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Visualizar Documentos');
  }
  if (DOCUMENTS_PERMISSIONS.VALIDATE.includes(role)) {
    permissions.push('Validar Documentos');
  }
  if (CREDIT_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Visualizar Pedidos de Crédito');
  }
  if (CREDIT_PERMISSIONS.ANALYSE.includes(role)) {
    permissions.push('Analisar Pedidos de Crédito');
  }
  if (CREDIT_PERMISSIONS.MAKE_DECISION.includes(role)) {
    permissions.push('Decidir Pedidos de Crédito');
  }
  if (RISK_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Avaliação de Risco');
  }
  if (REPORTS_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Relatórios Gerenciais');
  }
  if (AUDIT_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Auditoria do Sistema');
  }
  if (USERS_PERMISSIONS.VIEW.includes(role)) {
    permissions.push('Gestão de Utilizadores');
  }

  return permissions;
}
