import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card'
import { SimulacaoCredito } from '../../components/backoffice/SimulacaoCredito'
import { Info } from 'lucide-react'

export default function SimulacaoPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Crédito</CardTitle>
          <CardDescription>
            Calcule prestações, totais de juros e consulte a tabela de amortização para qualquer cenário de crédito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimulacaoCredito />
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-700">Taxas de juro de referência do sistema</p>
          <ul className="mt-1.5 space-y-0.5 text-xs">
            <li>Prazo até 12 meses: <strong>18% ao ano</strong></li>
            <li>Prazo de 13 a 36 meses: <strong>20% ao ano</strong></li>
            <li>Prazo de 37 a 60 meses: <strong>22% ao ano</strong></li>
            <li>Prazo superior a 60 meses: <strong>24% ao ano</strong></li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            As taxas são indicativas e podem variar conforme o perfil do cliente e as condições do contrato.
          </p>
        </div>
      </div>
    </div>
  )
}

