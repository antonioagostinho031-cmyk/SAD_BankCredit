import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, User, CreditCard, BarChart3,
  FileText, CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react'
import { creditService } from '../../services/credit.service'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusLabel, getScoreColor, getRiskColor, getRiskLabel } from '../../lib/utils'
import CreditDecisionModal from '../../components/backoffice/CreditDecisionModal'

export default function CreditoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDecision, setShowDecision] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const { data: credit, isLoading } = useQuery({
    queryKey: ['credit-detail', id],
    queryFn: () => creditService.getOne(id!),
    enabled: !!id,
  })

  const { data: analyses = [] } = useQuery({
    queryKey: ['credit-analyses', id],
    queryFn: () => creditService.getAnalysis(id!),
    enabled: !!id,
  })

  const analyseMutation = useMutation({
    mutationFn: () => creditService.analyse(id!),
    onSuccess: (data) => {
      setAnalysisResult(data)
      queryClient.invalidateQueries({ queryKey: ['credit-analyses', id] })
      queryClient.invalidateQueries({ queryKey: ['credit-detail', id] })
    },
  })

  if (isLoading || !credit) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  const latestAnalysis = analyses[0]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/backoffice/credito')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pedido #{id?.slice(0, 8).toUpperCase()}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(credit.status)}`}>
              {getStatusLabel(credit.status)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(credit.status === 'submetido' || credit.status === 'em_analise') && (
            <Button
              variant="secondary"
              onClick={() => analyseMutation.mutate()}
              loading={analyseMutation.isPending}
            >
              <BarChart3 className="h-4 w-4" />
              {analyseMutation.isPending ? 'A analisar...' : 'Executar Analise'}
            </Button>
          )}
          {credit.status === 'em_analise' && (
            <Button onClick={() => setShowDecision(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Registar Decisao
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-5 xl:col-span-2">
          {/* Credit Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <CardTitle>Dados do Pedido</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoBlock label="Montante Solicitado" value={formatCurrency(credit.requested_amount)} large />
                <InfoBlock label="Montante Aprovado" value={credit.approved_amount ? formatCurrency(credit.approved_amount) : '-'} large />
                <InfoBlock label="Prazo" value={`${credit.term_months} meses`} />
                <InfoBlock label="Prestação Mensal" value={credit.monthly_payment ? formatCurrency(credit.monthly_payment) : '-'} />
                <InfoBlock label="Taxa de Juro" value={credit.interest_rate ? `${credit.interest_rate}% ao ano` : '-'} />
                <InfoBlock label="Finalidade" value={credit.purpose} />
                <InfoBlock label="Data de Submissao" value={credit.submission_date ? formatDate(credit.submission_date) : '-'} />
                <InfoBlock label="Data de Decisao" value={credit.decision_date ? formatDate(credit.decision_date) : '-'} />
                {credit.conditions && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Condicoes</p>
                    <p className="mt-1 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700">{credit.conditions}</p>
                  </div>
                )}
                {credit.rejection_reason && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo de Rejeicao</p>
                    <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{credit.rejection_reason}</p>
                  </div>
                )}
                {credit.purpose_description && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descricao da Finalidade</p>
                    <p className="mt-1 text-sm text-gray-700">{credit.purpose_description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {latestAnalysis && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <CardTitle>Ultima Analise Automatica</CardTitle>
                  <span className="ml-auto text-xs text-gray-400">
                    {formatDateTime(latestAnalysis.analysis_date)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Score Bars */}
                <div className="space-y-3 mb-5">
                  <ScoreBar label="Score Total" value={latestAnalysis.overall_score} primary />
                  <ScoreBar label="Componente Financeira (60%)" value={latestAnalysis.financial_capacity} />
                  <ScoreBar label="Componente Comportamental (30%)" value={latestAnalysis.income_stability} />
                  <ScoreBar label="Componente Documental (10%)" value={latestAnalysis.document_quality_score} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InfoBlock label="Taxa de Endividamento" value={`${latestAnalysis.debt_ratio?.toFixed(1)}%`} />
                  <InfoBlock label="Recomendação do Sistema"
                    value={
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(latestAnalysis.recommendation)}`}>
                        {getStatusLabel(latestAnalysis.recommendation)}
                      </span>
                    }
                  />
                </div>

                {latestAnalysis.analyst_notes && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Justificativa</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{latestAnalysis.analyst_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live analysis result from button click */}
          {analysisResult && !latestAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Analise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Score: <strong className={getScoreColor(analysisResult.scoring?.total_score)}>
                    {analysisResult.scoring?.total_score}/100
                  </strong> - Nível de Risco:{' '}
                  <strong className={getRiskColor(analysisResult.risk?.risk_level)}>
                    {getRiskLabel(analysisResult.risk?.risk_level)}
                  </strong>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <CardTitle>Cliente</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(credit as any).clients ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0097A9]/10 text-sm font-bold text-[#0097A9]">
                      {(credit as any).clients.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{(credit as any).clients.full_name}</p>
                      <p className="text-xs text-gray-500">{(credit as any).clients.bi_number}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <InfoBlock label="Rendimento Mensal" value={formatCurrency((credit as any).clients.monthly_income)} />
                    <InfoBlock label="Entidade Patronal" value={(credit as any).clients.employer || '-'} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Dados do cliente nao disponiveis</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <CardTitle>Linha de Tempo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-2 before:h-full before:w-px before:bg-gray-200">
                {credit.submission_date && (
                  <TimelineItem
                    label="Pedido Submetido"
                    date={credit.submission_date}
                    done
                  />
                )}
                {credit.analysis_start_date && (
                  <TimelineItem
                    label="Em Analise"
                    date={credit.analysis_start_date}
                    done
                  />
                )}
                {credit.decision_date && (
                  <TimelineItem
                    label="Decisao Tomada"
                    date={credit.decision_date}
                    done
                    status={credit.status}
                  />
                )}
                {!credit.decision_date && (
                  <TimelineItem
                    label="Aguarda Decisao"
                    pending
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decision Modal */}
      <CreditDecisionModal
        credit={credit}
        open={showDecision}
        onClose={() => setShowDecision(false)}
        onSuccess={() => {
          setShowDecision(false)
          queryClient.invalidateQueries({ queryKey: ['credit-detail', id] })
          navigate('/backoffice/credito')
        }}
      />
    </div>
  )
}

function InfoBlock({ label, value, large = false }: { label: string; value: any; large?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-0.5 ${large ? 'text-lg font-bold text-gray-900' : 'text-sm font-medium text-gray-700'}`}>
        {value}
      </p>
    </div>
  )
}

function ScoreBar({ label, value, primary = false }: { label: string; value: number; primary?: boolean }) {
  const pct = Math.min(100, Math.max(0, value || 0))
  const color = pct >= 70 ? 'bg-[#0097A9]' : pct >= 50 ? 'bg-gray-400' : 'bg-gray-600'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${primary ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
        <span className={`text-xs font-bold ${primary ? getScoreColor(pct) : 'text-gray-600'}`}>{pct}/100</span>
      </div>
      <div className={`h-1.5 rounded-full bg-gray-200 ${primary ? 'h-2' : ''}`}>
        <div className={`h-full rounded-full ${primary ? 'bg-[#0097A9]' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TimelineItem({ label, date, done = false, pending = false, status }: any) {
  return (
    <div className="relative flex items-start gap-3">
      <div className={`absolute -left-4 mt-0.5 h-3 w-3 rounded-full border-2 ${done ? 'border-[#0097A9] bg-[#0097A9]' : pending ? 'border-gray-300 bg-white' : 'border-gray-300 bg-white'}`} />
      <div>
        <p className={`text-sm font-medium ${done ? 'text-gray-800' : 'text-gray-400'}`}>{label}</p>
        {date && <p className="text-xs text-gray-400">{formatDateTime(date)}</p>}
        {status && (
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        )}
      </div>
    </div>
  )
}


