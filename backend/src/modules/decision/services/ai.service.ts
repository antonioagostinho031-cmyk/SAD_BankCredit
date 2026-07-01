import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('AI_MODEL') || 'gpt-3.5-turbo';
  }

  async generateCreditJustification(analysisData: any): Promise<string> {
    try {
      if (!this.apiKey) {
        return this.generateRuleBasedJustification(analysisData);
      }

      const prompt = this.buildAnalysisPrompt(analysisData);
      const response = await this.callOpenAI(prompt);
      return response;
    } catch (error) {
      console.error('Erro na chamada à IA, usando justificativa baseada em regras:', error);
      return this.generateRuleBasedJustification(analysisData);
    }
  }

  async analyseDocumentConsistency(documents: any[]): Promise<string> {
    try {
      if (!this.apiKey) {
        return this.generateDocumentAnalysis(documents);
      }

      const prompt = this.buildDocumentPrompt(documents);
      return await this.callOpenAI(prompt);
    } catch (error) {
      return this.generateDocumentAnalysis(documents);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um analista de crédito sénior do Banco Millennium Atlântico de Angola. ' +
              'Analise os dados fornecidos e gere uma justificativa técnica e fundamentada em português europeu. ' +
              'Seja objectivo, profissional e conciso. Máximo 200 palavras.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private buildAnalysisPrompt(data: any): string {
    return `
Analise os seguintes dados de um pedido de crédito e gere uma justificativa de decisão:

DADOS DO CLIENTE:
- Nome: ${data.client?.full_name}
- Rendimento Mensal: ${data.client?.monthly_income?.toLocaleString('pt-AO')} AOA
- Empregador: ${data.client?.employer}

PEDIDO DE CRÉDITO:
- Montante Solicitado: ${data.credit?.requested_amount?.toLocaleString('pt-AO')} AOA
- Prazo: ${data.credit?.term_months} meses
- Finalidade: ${data.credit?.purpose}

SCORING:
- Pontuação Total: ${data.scoring?.total_score}/100
- Score Financeiro: ${data.scoring?.financial_score}/100
- Score Comportamental: ${data.scoring?.behavioral_score}/100
- Score Documental: ${data.scoring?.document_score}/100

RISCO:
- Nível de Risco: ${data.risk?.risk_level}
- Taxa de Endividamento: ${data.risk?.debt_ratio}%
- Capacidade de Pagamento: ${data.risk?.payment_capacity?.toLocaleString('pt-AO')} AOA/mês

RECOMENDAÇÃO DO SISTEMA: ${data.recommendation}

Gere uma justificativa profissional para esta decisão.
    `;
  }

  private buildDocumentPrompt(documents: any[]): string {
    const docSummary = documents.map(d => `- ${d.document_type}: ${d.status}`).join('\n');
    return `Analise a consistência dos seguintes documentos submetidos:\n${docSummary}\nIdentifique possíveis inconsistências ou pontos de atenção.`;
  }

  private generateRuleBasedJustification(data: any): string {
    const score = data.scoring?.total_score || 0;
    const riskLevel = data.risk?.risk_level || 'alto';
    const debtRatio = data.risk?.debt_ratio || 0;
    const recommendation = data.recommendation;

    const parts: string[] = [];

    parts.push(
      `Com base na análise financeira e comportamental do cliente ${data.client?.full_name || ''}, ` +
      `o sistema atribuiu uma pontuação de crédito de ${score}/100 pontos.`,
    );

    if (score >= 70) {
      parts.push(
        `O perfil financeiro é satisfatório, com rendimento adequado e historial de crédito positivo.`,
      );
    } else if (score >= 50) {
      parts.push(
        `O perfil financeiro apresenta indicadores moderados que requerem atenção adicional.`,
      );
    } else {
      parts.push(
        `O perfil financeiro apresenta indicadores desfavoráveis que fundamentam a recomendação de rejeição.`,
      );
    }

    parts.push(
      `A taxa de endividamento estimada é de ${debtRatio.toFixed(1)}%, ` +
      (debtRatio <= 35
        ? 'situando-se dentro dos parâmetros aceitáveis.'
        : 'o que supera o limite máximo recomendado de 35%.'),
    );

    if (data.risk?.risk_factors?.length > 0) {
      const highRisk = data.risk.risk_factors.filter((f: any) => f.severity === 'alto');
      if (highRisk.length > 0) {
        parts.push(`Foram identificados ${highRisk.length} factor(es) de risco elevado que influenciam a decisão.`);
      }
    }

    if (data.risk?.mitigating_factors?.length > 0) {
      parts.push(`Factores mitigantes: ${data.risk.mitigating_factors.join(', ')}.`);
    }

    parts.push(
      `Face ao exposto, o sistema recomenda: ${this.translateRecommendation(recommendation)}.`,
    );

    return parts.join(' ');
  }

  private generateDocumentAnalysis(documents: any[]): string {
    const approved = documents.filter(d => d.status === 'aprovado').length;
    const total = documents.length;
    return `Análise documental: ${approved}/${total} documentos aprovados. Verificação automática concluída.`;
  }

  private translateRecommendation(rec: string): string {
    const map: any = {
      aprovado: 'Aprovação do crédito',
      aprovado_condicional: 'Aprovação condicional',
      revisao: 'Revisão manual pelo analista',
      rejeitado: 'Rejeição do pedido',
    };
    return map[rec] || rec;
  }
}
