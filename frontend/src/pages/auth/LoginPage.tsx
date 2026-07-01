import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { authService } from '../../services/auth.service'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      const response = await authService.login(data.email, data.password)

      if (['admin', 'analista', 'gestor', 'supervisor'].includes(response.user.role)) {
        navigate('/backoffice/dashboard')
      } else {
        setError('Acesso restrito ao portal backoffice.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciais inválidas. Tente novamente.'
      setError(typeof msg === 'string' ? msg : msg[0])
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0097A9] via-[#007A8A] to-[#005f6b]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Logo / Bank Name */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0">
              <span className="text-[#0097A9] text-2xl font-bold leading-none">φ</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white leading-tight">ATLÂNTICO</h1>
              <p className="text-[9px] text-white/60 uppercase tracking-widest leading-none">
                Banco Millennium Atlântico
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/90">Sistema de Apoio à Decisão de Crédito</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Portal Backoffice</h2>
            <p className="mt-0.5 text-sm text-white/90">Autentique-se para continuar</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="utilizador@millenniumatlântico.ao"
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/50 focus:border-[#F5A623] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/50 focus:border-[#F5A623] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5A623] py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#e09615] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A autenticar...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          Sistema restrito a colaboradores autorizados
        </p>
      </div>
    </div>
  )
}
