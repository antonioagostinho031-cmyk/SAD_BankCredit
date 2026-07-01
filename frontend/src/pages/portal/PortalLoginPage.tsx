import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, MapPin } from 'lucide-react'
import { authService } from '../../services/auth.service'

export default function PortalLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authService.portalLogin(username, accessCode)
      const user = authService.getStoredUser()
      
      if (user?.role === 'cliente') {
        navigate('/portal/dashboard')
      } else {
        setError('Acesso apenas para clientes')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097A9] via-[#0097A9] to-[#007A8A]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-[#0097A9] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">φ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0097A9]">ATLÂNTICO</h1>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Banco Millennium Atlântico</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>PT | EN</span>
            <span className="font-semibold">Bem-vindo</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-light text-[#0097A9] mb-2">ENTRAR</h2>
              <p className="text-gray-500 text-lg">Bem-vindo ao ATLÂNTICO</p>
            </div>

            <p className="text-center text-gray-600 mb-8">
              Para entrar, introduza o seu código
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Utilizador"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-[#0097A9] outline-none text-gray-700 placeholder-gray-400"
                    required
                  />
                  <div className="absolute right-3 top-3">
                    <div className="h-6 w-6 rounded-full bg-[#F5A623] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Código de Acesso"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-[#0097A9] outline-none text-gray-700 placeholder-gray-400"
                    required
                  />
                  <div className="absolute right-3 top-3">
                    <div className="h-6 w-6 rounded-full bg-[#F5A623] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-[#0097A9]">
                <span className="text-xl">→</span>
                <button type="button" className="text-sm hover:underline">
                  Não me recordo do meu código
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F5A623] hover:bg-[#E09615] text-white font-semibold py-4 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'A entrar...' : 'ENTRAR'}
              </button>
            </form>

            {/* Footer Icons */}
            <div className="flex justify-center gap-8 mt-12">
              <button className="h-16 w-16 rounded-full border-2 border-white bg-[#0097A9]/10 flex items-center justify-center hover:bg-[#0097A9]/20 transition-colors">
                <Phone className="h-6 w-6 text-[#0097A9]" />
              </button>
              <button className="h-16 w-16 rounded-full border-2 border-white bg-[#0097A9]/10 flex items-center justify-center hover:bg-[#0097A9]/20 transition-colors">
                <MapPin className="h-6 w-6 text-[#0097A9]" />
              </button>
              <button className="h-16 w-16 rounded-full border-2 border-white bg-[#0097A9]/10 flex items-center justify-center hover:bg-[#0097A9]/20 transition-colors">
                <span className="text-[#0097A9] font-bold text-xl">EN</span>
              </button>
            </div>
          </div>

          {/* Right Side - Image/Info */}
          <div className="hidden lg:block">
            <div className="relative">
              <img 
                src="/devices-banking.png" 
                alt="Internet Banking" 
                className="w-full max-w-2xl mx-auto drop-shadow-2xl"
                onError={(e) => {
                  // Fallback se imagem não existir
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Security Alert */}
        <div className="mt-16 bg-white/95 rounded-xl shadow-xl p-8 max-w-4xl mx-auto">
          <div className="flex gap-6">
            <div className="shrink-0">
              <div className="h-20 w-20 rounded-full bg-[#0097A9]/10 flex items-center justify-center">
                <svg className="h-10 w-10 text-[#0097A9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[#0097A9] mb-3">ALERTA DE SEGURANÇA</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                O ATLÂNTICO não envia emails a solicitar elementos de carácter confidencial, como por exemplo códigos de acesso. Desconfie de qualquer email ou SMS em caso de dúvida ou necessidade ligue para o nosso número: <strong className="text-[#0097A9]">+244 933 168 400/244 236 400 400</strong>
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                O acesso ao serviço ATLÂNTICO Directo é reservado a clientes do ATLÂNTICO que já tenham feito a sua adesão. Com permissão especial de utilizações de ATLÂNTICO Directo a não tenha acesso às suas contas on-line. Contacte o ATLÂNTICO Directo <strong>+244 933 168 400/244 236 400 400</strong> ou visitando um dos nossos balcões.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
