import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface FinancialMetrics {
  // Rendimentos
  monthly_income: number;
  average_income_6m: number;
  income_stability: number; // 0-100
  
  // Saldo e movimentações
  current_balance: number;
  average_balance_6m: number;
  total_credits_6m: number;
  total_debits_6m: number;
  
  // Capacidade de pagamento
  disposable_income: number;
  debt_ratio: number; // Percentual
  payment_capacity: number;
  max_installment: number;
  
  // Créditos anteriores
  total_credits: number;
  active_credits: number;
  completed_credits: number;
  rejected_credits: number;
  total_approved_amount: number;
  
  // Histórico de crédito
  has_defaults: boolean;
  default_count: number;
  credit_score: number;
  
  // Recomendações
  max_credit_amount: number;
  recommended_term: number;
  is_eligible: boolean;
  eligibility_factors: string[];
  risk_factors: string[];
}

export interface TransactionSummary {
  month: string;
  credits: number;
  debits: number;
  balance: number;
  transactions_count: number;
}

@Injectable()
export class ClientsFinancialService {
  constructor(private supabaseService: SupabaseService) {}

  async getFinancialMetrics(clientId: string): Promise<FinancialMetrics> {
    const client = await this.getClient(clientId);
    const transactions = await this.getTransactions(clientId, 6);
    const creditHistory = await this.getCreditHistory(clientId);
    const incomeRecords = await this.getIncomeRecords(clientId, 6);

    // Calcular métricas
    const monthlyIncome = client.monthly_income || 0;
    const averageIncome = this.calculateAverageIncome(incomeRecords, monthlyIncome);
    const incomeStability = this.calculateIncomeStability(incomeRecords);
    
    const currentBalance = client.account_balance || 0;
    const averageBalance = this.calculateAverageBalance(transactions);
    const { totalCredits, totalDebits } = this.calculateTransactionTotals(transactions);
    
    const activeCreditPayments = this.calculateActiveCreditPayments(creditHistory);
    const disposableIncome = monthlyIncome - activeCreditPayments;
    const debtRatio = monthlyIncome > 0 ? (activeCreditPayments / monthlyIncome) * 100 : 0;
    const paymentCapacity = disposableIncome * 0.35; // 35% do rendimento disponível
    const maxInstallment = Math.floor(paymentCapacity);
    
    const { hasDefaults, defaultCount } = this.analyzeDefaults(creditHistory);
    const creditScore = this.calculateCreditScore(client, creditHistory, transactions, incomeRecords);
    
    const maxCreditAmount = this.calculateMaxCreditAmount(
      disposableIncome,
      debtRatio,
      creditScore,
      currentBalance
    );
    
    const recommendedTerm = this.calculateRecommendedTerm(maxCreditAmount, maxInstallment);
    
    const { isEligible, eligibilityFactors, riskFactors } = this.evaluateEligibility(
      creditScore,
      debtRatio,
      hasDefaults,
      monthlyIncome,
      incomeStability
    );

    return {
      monthly_income: monthlyIncome,
      average_income_6m: averageIncome,
      income_stability: incomeStability,
      current_balance: currentBalance,
      average_balance_6m: averageBalance,
      total_credits_6m: totalCredits,
      total_debits_6m: totalDebits,
      disposable_income: disposableIncome,
      debt_ratio: debtRatio,
      payment_capacity: paymentCapacity,
      max_installment: maxInstallment,
      total_credits: creditHistory.length,
      active_credits: creditHistory.filter(c => c.status === 'aprovado' || c.status === 'aprovado_condicional').length,
      completed_credits: creditHistory.filter(c => c.status === 'concluido').length,
      rejected_credits: creditHistory.filter(c => c.status === 'rejeitado').length,
      total_approved_amount: creditHistory
        .filter(c => c.status === 'aprovado' || c.status === 'aprovado_condicional')
        .reduce((sum, c) => sum + (c.approved_amount || 0), 0),
      has_defaults: hasDefaults,
      default_count: defaultCount,
      credit_score: creditScore,
      max_credit_amount: maxCreditAmount,
      recommended_term: recommendedTerm,
      is_eligible: isEligible,
      eligibility_factors: eligibilityFactors,
      risk_factors: riskFactors,
    };
  }

  async getTransactionHistory(clientId: string, months: number = 6): Promise<TransactionSummary[]> {
    const transactions = await this.getTransactions(clientId, months);
    
    type GroupedData = { credits: number; debits: number; count: number; lastBalance: number };
    
    const grouped = transactions.reduce((acc, t) => {
      const month = t.transaction_date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { credits: 0, debits: 0, count: 0, lastBalance: 0 };
      }
      
      if (t.transaction_type === 'credito') {
        acc[month].credits += t.amount;
      } else {
        acc[month].debits += t.amount;
      }
      acc[month].count++;
      acc[month].lastBalance = t.balance_after || 0;
      
      return acc;
    }, {} as Record<string, GroupedData>);

    return (Object.entries(grouped) as [string, GroupedData][])
      .map(([month, data]) => ({
        month,
        credits: data.credits,
        debits: data.debits,
        balance: data.lastBalance,
        transactions_count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getClient(clientId: string) {
    const { data } = await this.supabaseService.getClient()
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    return data || {};
  }

  private async getTransactions(clientId: string, months: number) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    
    const { data } = await this.supabaseService.getClient()
      .from('transactions')
      .select('*')
      .eq('client_id', clientId)
      .gte('transaction_date', date.toISOString())
      .order('transaction_date', { ascending: false });
    
    return data || [];
  }

  private async getCreditHistory(clientId: string) {
    const { data } = await this.supabaseService.getClient()
      .from('credit_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    return data || [];
  }

  private async getIncomeRecords(clientId: string, months: number) {
    const { data } = await this.supabaseService.getClient()
      .from('income_records')
      .select('*')
      .eq('client_id', clientId)
      .order('month', { ascending: false })
      .limit(months);
    
    return data || [];
  }

  private calculateAverageIncome(records: any[], currentIncome: number): number {
    if (records.length === 0) return currentIncome;
    const sum = records.reduce((acc, r) => acc + (r.net_income || 0), 0);
    return sum / records.length;
  }

  private calculateIncomeStability(records: any[]): number {
    if (records.length < 3) return 50; // Dados insuficientes
    
    const incomes = records.map(r => r.net_income || 0);
    const avg = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const variance = incomes.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / incomes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avg > 0 ? (stdDev / avg) * 100 : 100;
    
    // Quanto menor a variação, maior a estabilidade
    return Math.max(0, Math.min(100, 100 - coefficientOfVariation));
  }

  private calculateAverageBalance(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    const balances = transactions.map(t => t.balance_after || 0).filter(b => b > 0);
    if (balances.length === 0) return 0;
    return balances.reduce((a, b) => a + b, 0) / balances.length;
  }

  private calculateTransactionTotals(transactions: any[]) {
    return transactions.reduce(
      (acc, t) => {
        if (t.transaction_type === 'credito') {
          acc.totalCredits += t.amount;
        } else {
          acc.totalDebits += t.amount;
        }
        return acc;
      },
      { totalCredits: 0, totalDebits: 0 }
    );
  }

  private calculateActiveCreditPayments(creditHistory: any[]): number {
    const activeCredits = creditHistory.filter(
      c => c.status === 'aprovado' || c.status === 'aprovado_condicional'
    );
    return activeCredits.reduce((sum, c) => sum + (c.monthly_payment || 0), 0);
  }

  private analyzeDefaults(creditHistory: any[]) {
    const defaults = creditHistory.filter(c => c.status === 'incumprimento' || c.rejection_reason?.includes('incumprimento'));
    return {
      hasDefaults: defaults.length > 0,
      defaultCount: defaults.length,
    };
  }

  private calculateCreditScore(client: any, creditHistory: any[], transactions: any[], incomeRecords: any[]): number {
    let score = 50; // Base

    // Histórico de crédito (30 pontos)
    const completedCredits = creditHistory.filter(c => c.status === 'concluido').length;
    const totalCredits = creditHistory.length;
    if (totalCredits > 0) {
      score += (completedCredits / totalCredits) * 30;
    } else {
      score += 15; // Sem histórico = neutro
    }

    // Estabilidade de rendimento (20 pontos)
    const stability = this.calculateIncomeStability(incomeRecords);
    score += (stability / 100) * 20;

    // Movimentação bancária (20 pontos)
    if (transactions.length >= 10) {
      score += 20;
    } else if (transactions.length >= 5) {
      score += 10;
    }

    // Saldo médio (15 pontos)
    const avgBalance = this.calculateAverageBalance(transactions);
    const monthlyIncome = client.monthly_income || 1;
    const balanceRatio = avgBalance / monthlyIncome;
    if (balanceRatio >= 1) score += 15;
    else if (balanceRatio >= 0.5) score += 10;
    else if (balanceRatio >= 0.25) score += 5;

    // Penalizações
    const { hasDefaults, defaultCount } = this.analyzeDefaults(creditHistory);
    if (hasDefaults) {
      score -= defaultCount * 10;
    }

    const rejectedCredits = creditHistory.filter(c => c.status === 'rejeitado').length;
    score -= rejectedCredits * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateMaxCreditAmount(
    disposableIncome: number,
    debtRatio: number,
    creditScore: number,
    currentBalance: number
  ): number {
    // Base: 12x o rendimento disponível
    let maxAmount = disposableIncome * 12;

    // Ajustar por score
    if (creditScore >= 80) {
      maxAmount *= 2;
    } else if (creditScore >= 70) {
      maxAmount *= 1.5;
    } else if (creditScore >= 60) {
      maxAmount *= 1.2;
    } else if (creditScore < 40) {
      maxAmount *= 0.5;
    }

    // Ajustar por endividamento
    if (debtRatio > 50) {
      maxAmount *= 0.3;
    } else if (debtRatio > 35) {
      maxAmount *= 0.6;
    }

    // Considerar saldo atual como garantia (até 50%)
    const balanceContribution = currentBalance * 0.5;
    maxAmount += balanceContribution;

    return Math.round(maxAmount);
  }

  private calculateRecommendedTerm(maxAmount: number, maxInstallment: number): number {
    if (maxInstallment === 0) return 12;
    
    const months = Math.ceil(maxAmount / maxInstallment);
    
    // Limitar entre 12 e 72 meses
    return Math.max(12, Math.min(72, months));
  }

  private evaluateEligibility(
    creditScore: number,
    debtRatio: number,
    hasDefaults: boolean,
    monthlyIncome: number,
    incomeStability: number
  ) {
    const eligibilityFactors: string[] = [];
    const riskFactors: string[] = [];
    let isEligible = true;

    // Verificar critérios mínimos
    if (monthlyIncome < 50000) {
      isEligible = false;
      riskFactors.push('Rendimento mensal abaixo do mínimo exigido (50.000 AOA)');
    } else {
      eligibilityFactors.push(`Rendimento mensal adequado (${(monthlyIncome / 1000).toFixed(0)}K AOA)`);
    }

    if (creditScore < 40) {
      isEligible = false;
      riskFactors.push(`Score de crédito insuficiente (${creditScore}/100)`);
    } else if (creditScore >= 70) {
      eligibilityFactors.push(`Excelente histórico de crédito (${creditScore}/100)`);
    } else if (creditScore >= 50) {
      eligibilityFactors.push(`Score de crédito satisfatório (${creditScore}/100)`);
    }

    if (debtRatio > 50) {
      isEligible = false;
      riskFactors.push(`Endividamento excessivo (${debtRatio.toFixed(1)}%)`);
    } else if (debtRatio <= 35) {
      eligibilityFactors.push(`Baixo endividamento (${debtRatio.toFixed(1)}%)`);
    }

    if (hasDefaults) {
      isEligible = false;
      riskFactors.push('Histórico de incumprimento');
    } else {
      eligibilityFactors.push('Sem histórico de incumprimento');
    }

    if (incomeStability < 40) {
      riskFactors.push('Rendimento instável');
    } else if (incomeStability >= 70) {
      eligibilityFactors.push('Rendimento estável');
    }

    return { isEligible, eligibilityFactors, riskFactors };
  }
}
