import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../ui/modal'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Button } from '../ui/button'
import { clientsService } from '../../services/clients.service'
import type { Client } from '../../types'

const schema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  bi_number: z.string().length(14, 'BI deve ter exactamente 14 caracteres'),
  nif: z.string().min(9, 'NIF invlido'),
  date_of_birth: z.string().min(1, 'Data de nascimento  obrigatria'),
  marital_status: z.string().min(1, 'Estado civil  obrigatrio'),
  address: z.string().min(5, 'Morada  obrigatria'),
  phone: z.string().min(9, 'Telefone invlido'),
  email: z.string().email('Email inválido'),
  employer: z.string().min(2, 'Entidade patronal  obrigatria'),
  job_title: z.string().min(2, 'Cargo  obrigatrio'),
  monthly_income: z.coerce.number().min(50000, 'Rendimento mnimo  50.000 AOA'),
  account_number: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const MARITAL_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Vivo(a)' },
  { value: 'uniao_de_facto', label: 'Uniao de Facto' },
]

interface Props {
  client: Client | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ClientFormModal({ client, open, onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (client) {
      reset({
        full_name: client.full_name,
        bi_number: client.bi_number,
        nif: client.nif,
        date_of_birth: client.date_of_birth?.slice(0, 10),
        marital_status: client.marital_status,
        address: client.address,
        phone: client.phone,
        email: client.email,
        employer: client.employer,
        job_title: client.job_title,
        monthly_income: client.monthly_income,
        account_number: client.account_number,
      })
    } else {
      reset({})
    }
  }, [client, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (client) {
        await clientsService.update(client.id, data as any)
      } else {
        await clientsService.create(data as any)
      }
      onSuccess()
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? 'Editar Cliente' : 'Novo Cliente'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Nome Completo"
              {...register('full_name')}
              error={errors.full_name?.message}
              placeholder="Nome completo do cliente"
            />
          </div>

          <Input
            label="Numero do BI"
            {...register('bi_number')}
            error={errors.bi_number?.message}
            placeholder="000000000XX000"
            maxLength={14}
          />

          <Input
            label="NIF"
            {...register('nif')}
            error={errors.nif?.message}
            placeholder="1234567890"
          />

          <Input
            label="Data de Nascimento"
            type="date"
            {...register('date_of_birth')}
            error={errors.date_of_birth?.message}
          />

          <Select
            label="Estado Civil"
            options={MARITAL_OPTIONS}
            {...register('marital_status')}
            error={errors.marital_status?.message}
            placeholder="Seleccione o estado civil"
          />

          <div className="col-span-2">
            <Input
              label="Morada"
              {...register('address')}
              error={errors.address?.message}
              placeholder="Rua, numero, bairro, municipio"
            />
          </div>

          <Input
            label="Telefone"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+244 900 000 000"
          />

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="cliente@exemplo.com"
          />

          <Input
            label="Entidade Patronal"
            {...register('employer')}
            error={errors.employer?.message}
            placeholder="Nome da empresa"
          />

          <Input
            label="Cargo"
            {...register('job_title')}
            error={errors.job_title?.message}
            placeholder="Cargo actual"
          />

          <Input
            label="Rendimento Mensal (AOA)"
            type="number"
            {...register('monthly_income')}
            error={errors.monthly_income?.message}
            placeholder="250000"
          />

          <Input
            label="Numero de Conta"
            {...register('account_number')}
            error={errors.account_number?.message}
            placeholder="AO06 0000 0000 0000 0000 0000 0"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {client ? 'Guardar Alteracoes' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

