import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, CreditCard, FileText, UserCog, User,
  TrendingUp, ChevronRight, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/utils'
import { PortalLayout } from '../../components/portal/PortalLayout'

// ── Donut chart ────────────────────────────────────────────────────────────────

interface Segment { value: number; color: string; label: string }

function DonutChart({ segments }: { segments: Segment[] }) {
  const r    = 66
  const cx   = 88
  const cy   = 88
  const sw   = 20          // strokeWidth
  const circ = 2 * Math.PI * r  // ≈ 414.69
  const total = segments.reduce((s, seg) => s + seg.value, 0)

  let cumulative = 0
  const rendered = segments.map((seg) => {
    const pct     = seg.value / total
    const len     = pct * circ
    const gap     = circ - len
    const offset  = -(cumulative / total) * circ
    cumulative   += seg.value
    return { ...seg, dashArray: `${len.toFixed(2)} ${gap.toFixed(2)}`, dashOffset: offset.toFixed(2) }
  })

  return (
    <svg
      viewBox="0 0 176 176"
      className="h-44 w-44 shrink-0"
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={sw} />
      {/* Segments */}
      {rendered.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={sw}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
        />
      ))}
    </svg>
  )
}

// ── Quick action tile ──────────────────────────────────────────────────────────

function ActionTile({
  icon,
  label,
  description,
  onClick,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left group ${
        highlight
          ? 'border-[#0097A9] bg-[#0097A9]/5 hover:bg-[#0097A9]/10'
          : 'border-gray-200 bg-white hover:border-[#0097A9]/40 hover:bg-gray-50'
      }`}
    >
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          highlight
            ? 'bg-[#0097A9] text-white'
            : 'bg-gray-100 text-gray-500 group-hover:bg-[#0097A9]/10 group-hover:text-[#0097A9]'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${highlight ? 'text-[#0097A9]' : 'text-gray-800'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1 ml-auto group-hover:text-[#0097A9] transition-colors" />
    </button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PortalDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showBalance, setShowBalance] = useState(true)

  // ── Mock account data ─────────────────────────────────────
  const account = {
    name:     'Conta Atlântico',
    number:   '656 442 10 001',
    balance:  381_063.90,
    currency: 'AKZ',
  }

  // ── Posição Integrada (mock, calculada a partir do saldo) ──
  const saldoOrdem     = account.balance         // 79.09 %
  const outrosActivos  = 100_286.11              // 20.91 %
  const totalPositon   = saldoOrdem + outrosActivos

  const donutSegments: Segment[] = [
    { value: saldoOrdem,    color: '#0097A9', label: 'Saldo à Ordem'  },
    { value: outrosActivos, color: '#4CAF50', label: 'Outros Activos' },
  ]

  return (
    <PortalLayout>
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left Column (2/3) ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Account card ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  {account.name}
                </p>
                <p className="text-sm text-gray-500 font-mono">{account.number}</p>
              </div>
              <button
                onClick={() => setShowBalance((v) => !v)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
              >
                {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs text-gray-400 mb-1">Saldo disponível</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-[#4CAF50] leading-none">
                  {showBalance
                    ? formatCurrency(account.balance, account.currency)
                    : '● ● ● ● ● ●'}
                </span>
                {showBalance && (
                  <span className="text-xs text-gray-400 mb-1">{account.currency}</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/portal/credito')}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0097A9] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#007A8A] transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Solicitar Crédito
              </button>
              <button
                onClick={() => navigate('/portal/credito/pedidos')}
                className="flex-1 flex items-center justify-center gap-2 border border-[#0097A9] text-[#0097A9] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0097A9]/5 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Ver Pedidos
              </button>
            </div>
          </div>

          {/* ── Posição Integrada (donut chart) ─────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Posição Integrada
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Resumo financeiro da sua conta</p>
              </div>
              <TrendingUp className="h-5 w-5 text-gray-300" />
            </div>

            <div className="flex items-center gap-8">
              {/* Donut */}
              <div className="relative shrink-0">
                <DonutChart segments={donutSegments} />
                {/* Center label (not rotated — absolute overlay) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-base font-bold text-gray-900 text-center leading-tight px-3">
                    {showBalance
                      ? formatCurrency(totalPositon, account.currency)
                      : '● ● ●'}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-4">
                {donutSegments.map((seg) => {
                  const pct = ((seg.value / totalPositon) * 100).toFixed(1)
                  return (
                    <div key={seg.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-xs text-gray-600">{seg.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: seg.color }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {showBalance
                          ? formatCurrency(seg.value, account.currency)
                          : '● ● ●'}
                      </p>
                    </div>
                  )
                })}

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Total Posição</span>
                  <span className="text-sm font-bold text-gray-900">
                    {showBalance ? formatCurrency(totalPositon, account.currency) : '● ● ●'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column (1/3) ────────────────────────────── */}
        <div className="space-y-5">

          {/* ── Acções Rápidas ────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Acções Rápidas
            </h3>
            <div className="space-y-2.5">
              <ActionTile
                highlight
                icon={<CreditCard className="h-4 w-4" />}
                label="Solicitar Crédito"
                description="Explore os produtos disponíveis"
                onClick={() => navigate('/portal/credito')}
              />
              <ActionTile
                icon={<FileText className="h-4 w-4" />}
                label="Ver Pedidos"
                description="Acompanhe as suas solicitações"
                onClick={() => navigate('/portal/credito/pedidos')}
              />
              <ActionTile
                icon={<UserCog className="h-4 w-4" />}
                label="Actualizar Conta"
                description="Actualize os seus dados pessoais"
                onClick={() => navigate('/portal/perfil/atualizacoes')}
              />
              <ActionTile
                icon={<User className="h-4 w-4" />}
                label="Perfil"
                description="Consulte as suas informações"
                onClick={() => navigate('/portal/perfil')}
              />
            </div>
          </div>

          {/* ── Informação financeira compacta ────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Resumo da Conta
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">Saldo Disponível</span>
                <span className="text-sm font-semibold text-[#4CAF50]">
                  {showBalance ? formatCurrency(account.balance, account.currency) : '● ● ●'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">Outros Activos</span>
                <span className="text-sm font-semibold text-gray-700">
                  {showBalance ? formatCurrency(outrosActivos, account.currency) : '● ● ●'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-semibold text-gray-600">Total</span>
                <span className="text-sm font-bold text-gray-900">
                  {showBalance ? formatCurrency(totalPositon, account.currency) : '● ● ●'}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/portal/credito')}
              className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-[#0097A9] font-semibold hover:underline"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Ver produtos de crédito disponíveis
            </button>
          </div>

        </div>
      </div>
    </PortalLayout>
  )
}
