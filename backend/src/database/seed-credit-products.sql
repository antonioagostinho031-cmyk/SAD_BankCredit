-- ================================================================
-- SEED: Produtos de Crédito e FTIs
-- Dados de exemplo para o sistema
-- ================================================================

-- Limpar dados existentes (cuidado em produção!)
-- DELETE FROM credit_product_history;
-- DELETE FROM credit_product_ftis;
-- DELETE FROM credit_products;

-- ================================================================
-- PRODUTOS DE CRÉDITO
-- ================================================================

-- 1. Crédito Pessoal Simples
INSERT INTO credit_products (
  id, name, code, description, category,
  min_amount, max_amount, min_term_months, max_term_months,
  base_interest_rate, min_interest_rate, max_interest_rate,
  min_income, max_age, requires_guarantor, requires_collateral,
  opening_fee_percent, opening_fee_fixed, management_fee_annual, early_payment_fee,
  active, priority_order
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Crédito Pessoal Simples',
  'CPS-001',
  'Crédito pessoal sem garantias, para necessidades rápidas e urgentes',
  'pessoal',
  50000, 1000000, 6, 48,
  18.50, 15.00, 22.00,
  80000, 65, false, false,
  2.00, 5000, 0, 3.00,
  true, 1
);

-- 2. Crédito Pessoal Premium
INSERT INTO credit_products (
  id, name, code, description, category,
  min_amount, max_amount, min_term_months, max_term_months,
  base_interest_rate, min_interest_rate, max_interest_rate,
  min_income, max_age, requires_guarantor, requires_collateral,
  opening_fee_percent, opening_fee_fixed, management_fee_annual, early_payment_fee,
  active, priority_order
) VALUES (
  '11111111-1111-1111-1111-111111111112',
  'Crédito Pessoal Premium',
  'CPP-001',
  'Crédito pessoal com condições especiais para clientes de alta renda',
  'pessoal',
  500000, 5000000, 12, 84,
  14.50, 12.00, 18.00,
  300000, 70, false, false,
  1.50, 10000, 0, 2.00,
  true, 2
);

-- 3. Crédito Habitação
INSERT INTO credit_products (
  id, name, code, description, category,
  min_amount, max_amount, min_term_months, max_term_months,
  base_interest_rate, min_interest_rate, max_interest_rate,
  min_income, max_age, requires_guarantor, requires_collateral,
  opening_fee_percent, opening_fee_fixed, management_fee_annual, early_payment_fee,
  active, priority_order
) VALUES (
  '11111111-1111-1111-1111-111111111113',
  'Crédito Habitação',
  'CH-001',
  'Crédito para aquisição de habitação própria permanente',
  'habitacao',
  2000000, 50000000, 120, 420,
  8.50, 7.00, 12.00,
  150000, 70, false, true,
  1.00, 50000, 10000, 1.00,
  true, 3
);

-- 4. Crédito Automóvel
INSERT INTO credit_products (
  id, name, code, description, category,
  min_amount, max_amount, min_term_months, max_term_months,
  base_interest_rate, min_interest_rate, max_interest_rate,
  min_income, max_age, requires_guarantor, requires_collateral,
  opening_fee_percent, opening_fee_fixed, management_fee_annual, early_payment_fee,
  active, priority_order
) VALUES (
  '11111111-1111-1111-1111-111111111114',
  'Crédito Automóvel',
  'CA-001',
  'Crédito para aquisição de viatura nova ou usada',
  'automovel',
  500000, 10000000, 12, 84,
  12.50, 10.00, 16.00,
  100000, 65, false, true,
  2.00, 15000, 0, 2.50,
  true, 4
);

-- 5. Crédito Consolidado
INSERT INTO credit_products (
  id, name, code, description, category,
  min_amount, max_amount, min_term_months, max_term_months,
  base_interest_rate, min_interest_rate, max_interest_rate,
  min_income, max_age, requires_guarantor, requires_collateral,
  opening_fee_percent, opening_fee_fixed, management_fee_annual, early_payment_fee,
  active, priority_order
) VALUES (
  '11111111-1111-1111-1111-111111111115',
  'Crédito Consolidado',
  'CC-001',
  'Consolidação de créditos existentes numa única prestação',
  'consolidacao',
  200000, 8000000, 24, 120,
  16.50, 14.00, 20.00,
  120000, 68, false, false,
  2.50, 20000, 0, 4.00,
  true, 5
);

-- ================================================================
-- FICHAS TÉCNICAS DE INFORMAÇÃO (FTIs)
-- ================================================================

-- FTI para Crédito Pessoal Simples
INSERT INTO credit_product_ftis (
  id, product_id, version, document_date, effective_date,
  product_description, target_customers, eligibility_criteria,
  interest_calculation, associated_costs, insurance_info,
  early_termination, contract_modification, dispute_resolution,
  regulatory_info, complaints_procedure, data_protection,
  active, approved, approved_at
) VALUES (
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  '1.0',
  '2026-01-01',
  '2026-01-15',
  
  'O Crédito Pessoal Simples é uma solução de financiamento flexível destinada a particulares que necessitam de liquidez imediata para fazer face a despesas imprevistas ou realizar projectos pessoais. Este produto permite financiar montantes entre 50.000 AOA e 1.000.000 AOA, com prazos de reembolso entre 6 e 48 meses.',
  
  'Este produto destina-se a clientes particulares, maiores de 18 anos, residentes em Angola, com rendimento mensal comprovado mínimo de 80.000 AOA e idade máxima de 65 anos no final do contrato.',
  
  'Critérios de Elegibilidade:
- Idade: Entre 18 e 65 anos
- Rendimento Mensal Mínimo: 80.000 AOA
- Residência: Angola
- Situação Laboral: Trabalhador por conta de outrem ou independente
- Histórico de Crédito: Sem incumprimentos nos últimos 12 meses
- Documentação: BI válido, comprovativo de rendimento, comprovativo de morada',
  
  'Taxa de Juro Anual Nominal (TAN): Entre 15% e 22%, variável consoante o perfil do cliente e prazo.
Taxa Anual Efectiva Global (TAEG): Inclui todos os custos associados.
Método de Cálculo: Sistema Francês (prestações constantes).
Revisão: TAN fixa durante todo o período do contrato.',
  
  'Custos Associados:
- Comissão de Abertura: 2% do montante (mínimo 5.000 AOA)
- Comissão de Reembolso Antecipado: 3% do capital em dívida
- Imposto de Selo: Conforme legislação em vigor
- Seguros: Opcionais mas recomendados (vida e desemprego)
Não existem comissões de gestão anuais.',
  
  'Seguros Disponíveis:
- Seguro de Vida: Recomendado, cobre o saldo devedor em caso de falecimento
- Seguro de Desemprego: Opcional, cobre até 6 prestações em caso de desemprego involuntário
- Prémios: Calculados com base no montante e prazo do crédito
Os seguros são facultativos mas altamente recomendados.',
  
  'Reembolso Antecipado:
O cliente pode reembolsar antecipadamente o crédito, total ou parcialmente, a qualquer momento.
Comissão: 3% sobre o capital reembolsado antecipadamente.
Procedimento: Comunicação prévia de 15 dias úteis.
Poupança: Redução dos juros futuros.',
  
  'Modificação Contratual:
Alterações ao contrato (prazo, montante) estão sujeitas a aprovação do banco.
Custos: Podem aplicar-se comissões de modificação.
Renegociação: Possível em caso de dificuldades financeiras comprovadas.',
  
  'Resolução de Litígios:
Em caso de litígio, o cliente pode recorrer a:
1. Serviço de Apoio ao Cliente do Banco
2. Banco Nacional de Angola (BNA) - Departamento de Protecção ao Consumidor
3. Tribunais competentes
4. Mediação ou arbitragem',
  
  'Informação Regulamentar:
- Supervisão: Banco Nacional de Angola (BNA)
- Legislação Aplicável: Lei das Instituições Financeiras de Angola
- Transparência: Informação pré-contratual obrigatória conforme regulamentação
- Central de Riscos: Informação reportada à Central de Riscos de Crédito do BNA',
  
  'Procedimento de Reclamações:
1. Contacto directo com a agência ou gestor de conta
2. Reclamação escrita ao Serviço de Apoio ao Cliente
3. Prazo de resposta: 15 dias úteis
4. Recurso ao BNA se insatisfeito com a resposta
Contactos: apoio.cliente@millenniumbanco.ao | +244 222 123 456',
  
  'Protecção de Dados:
Os dados pessoais são tratados em conformidade com a legislação angolana de protecção de dados.
Finalidades: Análise de crédito, gestão contratual, cumprimento legal.
Direitos: Acesso, rectificação, eliminação dos dados pessoais.
Partilha: Apenas com entidades legalmente autorizadas (BNA, seguradoras).
Segurança: Medidas técnicas e organizacionais adequadas.',
  
  true,
  true,
  NOW()
);

-- FTI para Crédito Habitação
INSERT INTO credit_product_ftis (
  id, product_id, version, document_date, effective_date,
  product_description, target_customers, eligibility_criteria,
  interest_calculation, associated_costs, insurance_info,
  early_termination, contract_modification, dispute_resolution,
  regulatory_info, complaints_procedure, data_protection,
  active, approved, approved_at
) VALUES (
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111113',
  '1.0',
  '2026-01-01',
  '2026-01-15',
  
  'O Crédito Habitação destina-se ao financiamento da aquisição de habitação própria e permanente. Permite financiar até 80% do valor de avaliação do imóvel, com prazos até 35 anos e condições especiais.',
  
  'Particulares residentes em Angola, com idade entre 18 e 70 anos no final do contrato, rendimento estável e capacidade de pagamento comprovada.',
  
  'Requisitos:
- Idade: 18 a 70 anos no fim do contrato
- Rendimento Mínimo: 150.000 AOA
- Entrada Própria: Mínimo 20% do valor do imóvel
- Garantia: Hipoteca sobre o imóvel financiado
- Seguros: Obrigatórios (vida e multirriscos)',
  
  'TAN: Entre 7% e 12% conforme perfil.
TAEG: Inclui todos os custos.
Sistema: Francês (prestações constantes).
Revisão: TAN fixa ou variável (indexada).',
  
  'Comissões:
- Abertura: 1% + 50.000 AOA fixos
- Gestão Anual: 10.000 AOA
- Reembolso Antecipado: 1%
- Avaliação do Imóvel: Por conta do cliente
- Registo e Escritura: Por conta do cliente',
  
  'Seguros Obrigatórios:
- Seguro de Vida: Cobertura do saldo devedor
- Seguro Multirriscos: Incêndio, explosão, danos no imóvel
Os prémios são incluídos na prestação mensal.',
  
  'Reembolso antecipado possível com comissão de 1%.
Amortizações parciais aceites (mínimo 10% do capital).',
  
  'Alterações contratuais sujeitas a análise e aprovação.
Possível renegociação de prazo e condições.',
  
  'Resolução através de canais normais, BNA ou tribunais.',
  
  'Produto regulado pelo BNA.
Reportado à Central de Riscos.
Conforme Lei das Instituições Financeiras.',
  
  'Reclamações ao Serviço de Apoio ao Cliente.
Resposta em 20 dias úteis.
Recurso ao BNA disponível.',
  
  'Dados protegidos conforme legislação.
Partilha com BNA, conservatória, seguradoras.
Direitos de acesso e rectificação garantidos.',
  
  true,
  true,
  NOW()
);

-- ================================================================
-- HISTÓRICO (exemplo)
-- ================================================================
INSERT INTO credit_product_history (
  product_id, change_type, changes, reason
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'created',
  '{"action": "product_created", "user": "system"}',
  'Criação inicial do produto'
);
