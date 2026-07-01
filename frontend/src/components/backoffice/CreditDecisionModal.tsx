import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { creditService } from '../../services/credit.service'
import { formatCurrency } from '../../lib/utils'
import type { CreditRequest } from '../../types'

const schema = z.object({
  decision: z.enum(['aprovado', 'aprovado_condicional', 'revisao', 'rejeitado']),
  approved_amount: z.coerce.number().optional(),
  conditions: z.string().optional(),
  rejection_reason: z.string().optional(),
}).refine((data) => {
  if (data.decision === 'rejeitado' && !data.rejection_reason) return false
  return true
}, { message: 'Motivo de rejeicao  obrigatrio', path: ['rejection_reason'] })

type FormData = z.infer<typeof schema>

const DECISIONS = [
  { value: 'aprovado', label: 'Aprovar', color: 'bg-[#0097A9] text-white hover:bg-[#007A8A]' },
  { value: 'aprovado_condicional', label: 'Aprovar com Condicoes', color: 'bg-[#0097A9] text-white hover:bg-[#007A8A]' },
  { value: 'revisao', label: 'Enviar para Revisao', color: 'bg-[#F5A623] text-white hover:bg-[#e09615]' },
  { value: 'rejeitado', label: 'Rejeitar', color: 'bg-red-600 text-white hover:bg-red-700' },
]

interface Props {
  credit: CreditRequest
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreditDecisionModal({ credit, open, onClose, onSuccess }: Props) {
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedDecision = watch('decision')

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      await creditService.makeDecision(credit.id, {
        decision: data.decision,
        approved_amount: data.approved_amount,
        conditions: data.conditions,
        rejection_reason: data.rejection_reason,
      })
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao registar decisao')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Decisao Final de Credito" size="md">
      <div className="space-y-5">
        {/* Credit Summary */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Resumo do Pedido</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="font-medium">{(credit as any).clients?.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Montante Solicitado</p>
              <p className="font-bold">{formatCurrency(credit.requested_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prazo</p>
              <p className="font-medium">{credit.term_months} meses</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prestação</p>
              <p className="font-medium">{formatCurrency(credit.monthly_payment)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Decision Buttons */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Decisao</p>
            <div className="grid grid-cols-2 gap-2">
              {DECISIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setValue('decision', d.value as any)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    selectedDecision === d.value
                      ? d.color + ' ring-2 ring-offset-1 ring-current'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {errors.decision && (
              <p className="mt-1 text-xs text-red-600">Seleccione uma decisao</p>
            )}
          </div>

          {/* Conditional Fields */}
          {(selectedDecision === 'aprovado' || selectedDecision === 'aprovado_condicional') && (
            <Input
              label="Montante Aprovado (AOA)"
              type="number"
              {...register('approved_amount')}
              defaultValue={credit.requested_amount}
              error={errors.approved_amount?.message}
              helperText="Deixe vazio para aprovar o montante total solicitado"
            />
          )}

          {selectedDecision === 'aprovado_condicional' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Condicoes</label>
              <textarea
                {...register('conditions')}
                rows={3}
                placeholder="Descreva as condicoes para a aprovacao..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
            </div>
          )}

          {selectedDecision === 'rejeitado' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Motivo da Rejeicao <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('rejection_reason')}
                rows={3}
                placeholder="Indique o motivo da rejeição..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
              {errors.rejection_reason && (
                <p className="mt-1 text-xs text-red-600">{errors.rejection_reason.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!selectedDecision}>
              Confirmar Decisao
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}


