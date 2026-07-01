import { X, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RiskFactor {
  factor: string
  severity: 'baixo' | 'medio' | 'alto'
  description: string
}

interface Assessment {
  id: string
  client_id: string
  credit_request_id: string
  risk_level: 'baixo' | 'medio' | 'alto' | 'muito_alto'
  risk_score: number
  debt_ratio: number
  payment_capacity: number
  max_recommended_amount: number
  risk_factors: RiskFactor[]
  mitigating_factors: string[]
  assessed_at: string
  clients?: { full_name: string; email?: string }
  credit_requests?: {
    requested_amount: number
    term_months: number
    purpose: string
    status: string
    monthly_payment?: number
  }
}

interface Props {
  assessment: Assessment
  onClose: () => void
}

// ── Inferir factores a partir dos dados numéricos quando o array está vazio ───
// Acontece em registos inseridos directamente via SQL sem passar pelo engine

function inferRiskFactors(a: Assessment): RiskFactor[] {
  const factors: RiskFactor[] = []
  const rdi   = a.debt_ratio ?? 0
  const score = a.risk_score ?? 0  // risk_score = 100 - credit_score
  const cap   = a.payment_capacity ?? 0
  const req   = a.credit_requests

  if (rdi > 60) {
    factors.push({
      factor: 'debt_ratio_critical',
      severity: 'alto',
      description: `Rácio de endividamento de ${rdi.toFixed(1)}% excede criticamente o limite de 50%.`,
    })
  } else if (rdi > 45) {
    factors.push({
      factor: 'debt_ratio_high',
      severity: 'alto',
      description: `Rácio de endividamento de ${rdi.toFixed(1)}% supera o limite recomendado de 35%.`,
    })
  } else if (rdi > 35) {
    factors.push({
      factor: 'debt_ratio_moderate',
      severity: 'medio',
      description: `Rácio de endividamento de ${rdi.toFixed(1)}% próximo do limite de 35%.`,
    })
  }

  if (score >= 65) {
    factors.push({
      factor: 'high_risk_score',
      severity: 'alto',
      description: `Pontuação de risco elevada (${score}/100), indicando fragilidade significativa no perfil financeiro.`,
    })
  } else if (score >= 45) {
    factors.push({
      factor: 'medium_risk_score',
      severity: 'medio',
      description: `Pontuação de risco moderada (${score}/100), requerendo análise detalhada.`,
    })
  }

  if (cap > 0 && req?.requested_amount && req.requested_amount > cap * 60) {
    factors.push({
      factor: 'amount_exceeds_capacity',
      severity: 'alto',
      description: `Montante solicitado (${formatCurrency(req.requested_amount)}) desproporcional à capacidade de pagamento mensal disponível (${formatCurrency(cap)}).`,
    })
  }

  if (a.max_recommended_amount === 0) {
    factors.push({
      factor: 'no_credit_capacity',
      severity: 'alto',
      description: 'O perfil financeiro actual não suporta concessão de crédito — capacidade de pagamento insuficiente para cobrir qualquer prestação.',
    })
  } else if (req?.requested_amount && req.requested_amount > a.max_recommended_amount * 1.5) {
    factors.push({
      factor: 'exceeds_recommended_amount',
      severity: 'medio',
      description: `Montante pedido (${formatCurrency(req.requested_amount)}) ultrapassa significativamente o máximo recomendado de ${formatCurrency(a.max_recommended_amount)}.`,
    })
  }

  return factors
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  baixo:     { label: 'Baixo Risco',     color: 'text-[#0097A9]',  bg: 'bg-[#0097A9]/10',  border: 'border-[#0097A9]/30',  Icon: ShieldCheck  },
  medio:     { label: 'Médio Risco',     color: 'text-amber-600',  bg: 'bg-amber-50',       border: 'border-amber-200',      Icon: ShieldAlert  },
  alto:      { label: 'Alto Risco',      color: 'text-red-600',    bg: 'bg-red-50',         border: 'border-red-200',        Icon: AlertTriangle },
  muito_alto:{ label: 'Muito Alto Risco',color: 'text-red-700',    bg: 'bg-red-100',        border: 'border-red-300',        Icon: AlertTriangle },
}

const SEVERITY_CONFIG = {
  baixo: { label: 'Baixo',  color: 'text-[#0097A9]', bg: 'bg-[#0097A9]/10' },
  medio: { label: 'Médio',  color: 'text-amber-700', bg: 'bg-amber-50' },
  alto:  { label: 'Alto',   color: 'text-red-600',   bg: 'bg-red-50' },
}

const PURPOSE_LABELS: Record<string, string> = {
  habitacao:        'Habitação',
  automovel:        'Automóvel',
  educacao:         'Educação',
  negocio:          'Negócio',
  saude:            'Saúde',
  consumo_pessoal:  'Consumo Pessoal',
  consolidacao:     'Consolidação de Dívidas',
  outro:            'Outro',
}

// ── Gerador de recomendação dinâmica ─────────────────────────────────────────

function generateRecommendation(a: Assessment): { title: string; paragraphs: string[] } {
  const req     = a.credit_requests
  const factors = a.risk_factors ?? []
  const miti    = a.mitigating_factors ?? []
  const rdi     = a.debt_ratio
  const cfg     = RISK_CONFIG[a.risk_level]

  const hasDefault    = factors.some(f => f.factor.includes('default') || f.factor.includes('incumprimento'))
  const rdiHigh       = rdi > 45
  const rdiCritical   = rdi > 60
  const noEmployment  = factors.some(f => f.factor === 'no_employment')
  const lowIncome     = factors.some(f => f.factor === 'low_income')
  const hasMiti       = miti.length > 0

  const paragraphs: string[] = []

  // Parágrafo 1 — contexto geral
  if (a.risk_level === 'baixo') {
    paragraphs.push(
      `O cliente apresenta um perfil de risco ${cfg.label.toLowerCase()}, com indicadores financeiros dentro dos parâmetros aceitáveis. ` +
      `O rácio de endividamento de ${rdi.toFixed(1)}% encontra-se ${rdi <= 35 ? 'abaixo do limite recomendado de 35%' : 'próximo do limite'}, ` +
      `e a capacidade de pagamento mensal disponível é de ${formatCurrency(a.payment_capacity)}.`
    )
  } else if (a.risk_level === 'medio') {
    paragraphs.push(
      `O cliente apresenta um perfil de risco moderado que requer análise cuidadosa. ` +
      `O rácio de endividamento de ${rdi.toFixed(1)}% ${rdi > 35 ? 'supera o limite recomendado de 35%' : 'está próximo do limiar de atenção'}, ` +
      `condicionando a capacidade de resposta a novos encargos.`
    )
  } else {
    paragraphs.push(
      `O cliente apresenta um perfil de ${cfg.label.toLowerCase()}, com múltiplos indicadores que exigem atenção antes de qualquer decisão de concessão. ` +
      (rdiCritical
        ? `O rácio de endividamento de ${rdi.toFixed(1)}% está criticamente acima do limite de 50%, o que representa um risco significativo de incumprimento.`
        : `O rácio de endividamento de ${rdi.toFixed(1)}% supera os limites recomendados.`
      )
    )
  }

  // Parágrafo 2 — factores específicos
  if (hasDefault) {
    paragraphs.push(
      `Existe registo de incumprimento activo ou anterior que compromete a fiabilidade de pagamento do cliente. ` +
      `Este factor é determinante para a avaliação e deve ser regularizado antes de qualquer nova concessão.`
    )
  }

  if (noEmployment) {
    paragraphs.push(
      `A ausência de vínculo laboral comprovado representa um risco acrescido, uma vez que não é possível verificar a estabilidade do rendimento mensal. ` +
      `Recomenda-se a apresentação de declaração de empresa actualizada ou comprovativos de rendimento alternativos.`
    )
  } else if (lowIncome) {
    paragraphs.push(
      `O rendimento mensal verificado está abaixo do nível mínimo recomendado para suportar os encargos do crédito solicitado. ` +
      `A prestação mensal estimada${req?.monthly_payment ? ' de ' + formatCurrency(req.monthly_payment) : ''} representa uma carga elevada face ao rendimento disponível.`
    )
  }

  // Parágrafo 3 — factores mitigantes
  if (hasMiti) {
    paragraphs.push(
      `Em sentido positivo, destacam-se os seguintes factores mitigantes: ${miti.join('; ')}. ` +
      `Estes elementos devem ser ponderados na decisão final e podem fundamentar uma aprovação condicional.`
    )
  }

  // Parágrafo 4 — recomendação de montante
  if (req) {
    const overAmount = req.requested_amount > a.max_recommended_amount && a.max_recommended_amount > 0
    if (overAmount) {
      paragraphs.push(
        `O montante solicitado de ${formatCurrency(req.requested_amount)} excede o máximo recomendado de ${formatCurrency(a.max_recommended_amount)} ` +
        `calculado com base na capacidade de pagamento actual. Caso seja aprovado, o montante deverá ser ajustado ao tecto recomendado, ` +
        `preferencialmente com prazo de ${req.term_months} meses para minimizar a prestação mensal.`
      )
    } else if (a.risk_level === 'baixo') {
      paragraphs.push(
        `O montante solicitado de ${formatCurrency(req.requested_amount)} está dentro da capacidade financeira do cliente. ` +
        `A operação pode avançar nas condições propostas.`
      )
    }
  }

  // Título dinâmico
  const title =
    a.risk_level === 'baixo'      ? 'Operação Viável — Aprovação Recomendada' :
    a.risk_level === 'medio'      ? 'Atenção — Aprovação Condicionada' :
    a.risk_level === 'alto'       ? 'Risco Elevado — Revisão Manual Obrigatória' :
                                    'Risco Crítico — Rejeição Recomendada'

  return { title, paragraphs }
}

// ── Score Arc (semicircle gauge) ──────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  // score aqui é risk_score (inverso do credit score), 0 = melhor, 100 = pior
  const safeScore = Math.max(0, Math.min(100, score))
  const color = safeScore <= 30 ? '#0097A9' : safeScore <= 60 ? '#d97706' : '#dc2626'
  const r = 44
  const cx = 56
  const cy = 56
  const circumference = Math.PI * r          // semicircle
  const dashoffset = circumference * (1 - safeScore / 100)

  return (
    <div className="flex flex-col items-center">
      <svg width="112" height="64" viewBox="0 0 112 64">
        {/* track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <p className="text-2xl font-bold -mt-4" style={{ color }}>{safeScore}</p>
      <p className="text-xs text-gray-400 mt-0.5">Pontuação de Risco</p>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function RiskDetailModal({ assessment: raw, onClose }: Props) {
  const navigate = useNavigate()

  // Normalizar campos JSONB que podem chegar como string
  const a: Assessment = {
    ...raw,
    risk_factors:       Array.isArray(raw.risk_factors)       ? raw.risk_factors       : (typeof raw.risk_factors       === 'string' ? JSON.parse(raw.risk_factors)       : []),
    mitigating_factors: Array.isArray(raw.mitigating_factors) ? raw.mitigating_factors : (typeof raw.mitigating_factors === 'string' ? JSON.parse(raw.mitigating_factors) : []),
  }

  // Se risk_factors está vazio mas o risco é alto/muito_alto, inferir a partir dos dados numéricos
  const isInferred = a.risk_factors.length === 0 && (a.risk_level === 'alto' || a.risk_level === 'muito_alto' || a.risk_level === 'medio')
  const displayFactors = a.risk_factors.length > 0 ? a.risk_factors : inferRiskFactors(a)

  const cfg  = RISK_CONFIG[a.risk_level] ?? RISK_CONFIG.alto
  const reco = generateRecommendation({ ...a, risk_factors: displayFactors })
  const req  = a.credit_requests

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-2xl bg-white px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.bg} ${cfg.border} border`}>
              <cfg.Icon className={`h-5 w-5 ${cfg.color}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {a.clients?.full_name ?? 'Cliente'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-gray-400">{formatDate(a.assessed_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {a.credit_request_id && (
              <button
                onClick={() => { onClose(); navigate(`/backoffice/credito/${a.credit_request_id}`) }}
                className="flex items-center gap-1.5 rounded-lg border border-[#0097A9]/30 bg-[#0097A9]/5 px-3 py-1.5 text-xs font-medium text-[#0097A9] hover:bg-[#0097A9]/10 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver pedido
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5 pt-5">

          {/* ── Métricas principais ─────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Pontuação de Risco" value={String(a.risk_score)} sub="0 = melhor" accent={a.risk_score <= 30} />
            <MetricCard label="Endividamento" value={`${a.debt_ratio?.toFixed(1)}%`} sub="limite 35%" warn={a.debt_ratio > 35} danger={a.debt_ratio > 50} />
            <MetricCard label="Capacidade Pagamento" value={formatCurrency(a.payment_capacity)} sub="mensal livre" />
            <MetricCard label="Montante Máximo" value={formatCurrency(a.max_recommended_amount)} sub="recomendado" />
          </div>

          {/* ── Pedido de crédito ────────────────────────── */}
          {req && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Pedido Associado</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Montante</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(req.requested_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Prazo</p>
                  <p className="font-semibold text-gray-900">{req.term_months} meses</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Finalidade</p>
                  <p className="font-semibold text-gray-900">{PURPOSE_LABELS[req.purpose] ?? req.purpose}</p>
                </div>
                {req.monthly_payment && (
                  <div>
                    <p className="text-xs text-gray-400">Prestação Est.</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(req.monthly_payment)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Factores de risco + mitigantes ─────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Factores de risco */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Factores de Risco
                </p>
                {displayFactors.length > 0 && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600 font-medium">
                    {displayFactors.length}
                  </span>
                )}
                {isInferred && displayFactors.length > 0 && (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-xs text-amber-600 font-medium">
                    inferido
                  </span>
                )}
              </div>
              {displayFactors.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum factor de risco identificado</p>
              ) : (
                <ul className="space-y-2">
                  {displayFactors.map((f, i) => {
                    const sc = SEVERITY_CONFIG[f.severity] ?? SEVERITY_CONFIG.medio
                    return (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white p-2.5">
                        <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                        <p className="text-xs text-gray-600 leading-relaxed">{f.description}</p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Factores mitigantes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Factores Mitigantes
                {(a.mitigating_factors?.length ?? 0) > 0 && (
                  <span className="ml-2 rounded-full bg-[#0097A9]/10 px-1.5 py-0.5 text-[#0097A9] normal-case font-medium">
                    {a.mitigating_factors.length}
                  </span>
                )}
              </p>
              {(a.mitigating_factors?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400 italic">Sem factores mitigantes registados</p>
              ) : (
                <ul className="space-y-2">
                  {a.mitigating_factors.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border border-[#0097A9]/20 bg-[#0097A9]/5 p-2.5">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0097A9]" />
                      <p className="text-xs text-gray-700 leading-relaxed">{m}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Recomendação dinâmica ────────────────────── */}
          <div className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${cfg.color}`}>
              Recomendação
            </p>
            <p className={`text-sm font-semibold mb-3 ${cfg.color}`}>{reco.title}</p>
            <div className="space-y-2">
              {reco.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent, warn, danger
}: {
  label: string; value: string; sub?: string
  accent?: boolean; warn?: boolean; danger?: boolean
}) {
  const color = danger ? 'text-red-600' : warn ? 'text-amber-600' : accent ? 'text-[#0097A9]' : 'text-gray-900'
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
