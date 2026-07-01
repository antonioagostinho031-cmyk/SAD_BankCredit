import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { formatCurrency, getScoreColor, getRiskColor, getRiskLabel } from '../../lib/utils'
import { ShieldCheck, TrendingUp, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  creditId: string
  analysisResult: any
  open: boolean
  onClose: () => void
  onDecision: () => void
}

export default function CreditAnalysisModal({ analysisResult, open, onClose, onDecision }: Props) {
  if (!analysisResult) return null

  const { scoring, risk, decision, client, credit } = analysisResult

  const RECOMMENDATION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    aprovado: { label: 'Aprovação Recomendada', color: 'text-[#0097A9]', bg: 'bg-[#0097A9]/5 border-[#0097A9]/20' },
    aprovado_condicional: { label: 'Aprovação Condicional', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
    revisao: { label: 'Revisão Manual', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
    rejeitado: { label: 'Rejeição Recomendada', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  }

  const rec = RECOMMENDATION_CONFIG[decision?.recommendation] || RECOMMENDATION_CONFIG.revisao

  return (
    <Modal open={open} onClose={onClose} title="Resultado da Análise de Crédito" size="xl">
      <div className="space-y-6">
        {/* Recommendation Banner */}
        <div className={`rounded-xl border p-4 ${rec.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recomendação do Sistema</p>
              <p className={`mt-1 text-xl font-bold ${rec.color}`}>{rec.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Confiança</p>
              <p className={`text-2xl font-bold ${rec.color}`}>{decision?.confidence}%</p>
            </div>
          </div>
          {decision?.conditions?.length > 0 && (
            <div className="mt-3 border-t border-current/20 pt-3">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Condições:</p>
              <ul className="space-y-1">
                {decision.conditions.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Scores */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">Pontuação de Credito</p>
          <div className="grid grid-cols-4 gap-3">
            <ScoreBox
              label="Score Total"
              value={scoring?.total_score}
              icon={<ShieldCheck className="h-4 w-4" />}
              primary
            />
            <ScoreBox
              label="Financeiro"
              value={scoring?.financial_score}
              icon={<TrendingUp className="h-4 w-4" />}
              weight="60%"
            />
            <ScoreBox
              label="Comportamental"
              value={scoring?.behavioral_score}
              icon={<TrendingUp className="h-4 w-4" />}
              weight="30%"
            />
            <ScoreBox
              label="Documental"
              value={scoring?.document_score}
              icon={<FileCheck className="h-4 w-4" />}
              weight="10%"
            />
          </div>
        </div>

        {/* Risk Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Avaliação de Risco</p>
            <div className="space-y-2">
              <InfoRow label="Nível de Risco" value={
                <span className={`font-bold ${getRiskColor(risk?.risk_level)}`}>
                  {getRiskLabel(risk?.risk_level)}
                </span>
              } />
              <InfoRow label="Taxa de Endividamento" value={`${risk?.debt_ratio?.toFixed(1)}%`} />
              <InfoRow label="Capacidade de Pagamento" value={formatCurrency(risk?.payment_capacity)} />
              <InfoRow label="Montante Max. Recomendado" value={formatCurrency(risk?.max_recommended_amount)} />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Detalhes Financeiros</p>
            <div className="space-y-2">
              <InfoRow label="Rendimento Mensal" value={formatCurrency(client?.monthly_income)} />
              <InfoRow label="Montante Solicitado" value={formatCurrency(credit?.requested_amount)} />
              <InfoRow label="Prazo" value={`${credit?.term_months} meses`} />
              <InfoRow label="Prestação Estimada" value={formatCurrency(credit?.monthly_payment)} />
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {risk?.risk_factors?.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Factores de Risco</p>
            <div className="space-y-1.5">
              {risk.risk_factors.map((f: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs
                  ${f.severity === 'alto' ? 'bg-red-50 text-red-700' : f.severity === 'medio' ? 'bg-gray-50 text-gray-600' : 'bg-gray-50 text-gray-700'}`}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {f.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mitigating Factors */}
        {risk?.mitigating_factors?.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Factores Mitigantes</p>
            <div className="space-y-1.5">
              {risk.mitigating_factors.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-[#0097A9]/5 px-3 py-2 text-xs text-[#0097A9]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Justification */}
        {decision?.justification && (
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#0097A9]">
              Justificativa Gerada pelo Sistema
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{decision.justification}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={onDecision}>Registar Decisao Final</Button>
        </div>
      </div>
    </Modal>
  )
}

function ScoreBox({ label, value, icon, weight, primary = false }: any) {
  return (
    <div className={`rounded-lg p-3 text-center ${primary ? 'bg-[#0097A9] text-white' : 'bg-gray-50'}`}>
      <div className={`mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full ${primary ? 'bg-white/20' : 'bg-white'}`}>
        <span className={primary ? 'text-white' : getScoreColor(value)}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${primary ? 'text-white' : getScoreColor(value)}`}>{value}</p>
      <p className={`mt-0.5 text-xs ${primary ? 'text-white/90' : 'text-gray-500'}`}>{label}</p>
      {weight && <p className="mt-0.5 text-xs text-gray-400">Peso: {weight}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800">{value}</span>
    </div>
  )
}

