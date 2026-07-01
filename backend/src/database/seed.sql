-- ================================================================
-- DADOS DE DEMONSTRACAO — BANCO MILLENNIUM ATLANTICO
-- Executar DEPOIS do schema.sql no Supabase SQL Editor
-- ================================================================

-- Utilizadores do backoffice (password: Test@1234)
-- Hash bcrypt de "Test@1234"
INSERT INTO users (id, name, email, password, role, active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Administrador Sistema',   'admin@banco.ao',      '$2b$10$K7J3gOyZkZ8J3gOyZkZ8JuQqVkZ8J3gOyZkZ8J3gOyZkZ8J3gOy', 'admin',      true),
  ('11111111-0000-0000-0000-000000000002', 'Ana Fernanda Lopes',      'ana.lopes@banco.ao',  '$2b$10$K7J3gOyZkZ8J3gOyZkZ8JuQqVkZ8J3gOyZkZ8J3gOyZkZ8J3gOy', 'analista',   true),
  ('11111111-0000-0000-0000-000000000003', 'Carlos Manuel Teixeira',  'c.teixeira@banco.ao', '$2b$10$K7J3gOyZkZ8J3gOyZkZ8JuQqVkZ8J3gOyZkZ8J3gOyZkZ8J3gOy', 'gestor',     true),
  ('11111111-0000-0000-0000-000000000004', 'Maria Jose Silva',        'mj.silva@banco.ao',   '$2b$10$K7J3gOyZkZ8J3gOyZkZ8JuQqVkZ8J3gOyZkZ8J3gOyZkZ8J3gOy', 'supervisor', true)
ON CONFLICT (email) DO NOTHING;

-- Clientes de demonstracao
INSERT INTO clients (
  id, full_name, bi_number, nif, date_of_birth, marital_status,
  address, phone, email, employer, job_title, monthly_income,
  account_number, account_balance, registration_status, is_eligible_for_credit
) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    'Joao Manuel Domingos da Silva',
    '006547891BA043',
    '1234567890',
    '1985-03-15',
    'casado',
    'Rua Comandante Gika, N. 45, Maianga, Luanda',
    '+244 923 456 789',
    'joao.silva@email.com',
    'Sonangol EP',
    'Engenheiro Senior',
    450000,
    'AO06 0040 0000 1234 5678 1012 3',
    1350000,
    'aprovado',
    true
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'Maria Conceicao Ferreira',
    '007891234AX021',
    '9876543210',
    '1990-07-22',
    'solteiro',
    'Av. 4 de Fevereiro, N. 12, Ingombota, Luanda',
    '+244 912 345 678',
    'maria.ferreira@email.com',
    'Governo Provincial de Luanda',
    'Tecnica Superior',
    280000,
    'AO06 0040 0000 9876 5432 1098 7',
    840000,
    'aprovado',
    true
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    'Pedro Antonio Neto Carvalho',
    '005678923CA012',
    '5678901234',
    '1978-11-30',
    'casado',
    'Talatona, Rua dos Jacarandas, N. 8, Luanda Sul',
    '+244 935 678 901',
    'pedro.carvalho@email.com',
    'Banco de Fomento Angola',
    'Gestor de Contas',
    620000,
    'AO06 0040 0000 5678 9012 3456 7',
    2480000,
    'aprovado',
    true
  ),
  (
    '22222222-0000-0000-0000-000000000004',
    'Ana Beatriz Loureiro Santos',
    '008234567BD034',
    '3456789012',
    '1995-04-18',
    'solteiro',
    'Bairro Maculusso, N. 23, Luanda',
    '+244 944 789 012',
    'ana.santos@email.com',
    'TPA — Televisao Publica de Angola',
    'Jornalista',
    185000,
    'AO06 0040 0000 3456 7890 1234 5',
    370000,
    'em_validacao',
    false
  ),
  (
    '22222222-0000-0000-0000-000000000005',
    'Francisco Miguel Rodrigues',
    '009345678CE045',
    '7890123456',
    '1982-09-05',
    'divorciado',
    'Sambizanga, Rua do Cruzeiro, N. 67, Luanda',
    '+244 956 890 123',
    'f.rodrigues@email.com',
    'Multicaixa Express',
    'Analista de Sistemas',
    350000,
    'AO06 0040 0000 7890 1234 5678 9',
    1050000,
    'aprovado',
    true
  )
ON CONFLICT (bi_number) DO NOTHING;

-- Pedidos de Credito de demonstracao
INSERT INTO credit_requests (
  id, client_id, requested_amount, term_months, interest_rate,
  monthly_payment, purpose, status, submission_date
) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    5000000, 60, 22, 141644, 'habitacao', 'em_analise',
    NOW() - INTERVAL '3 days'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000002',
    2000000, 36, 20, 74368, 'automovel', 'submetido',
    NOW() - INTERVAL '1 day'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000003',
    8000000, 84, 24, 148906, 'negocio', 'aprovado',
    NOW() - INTERVAL '10 days'
  ),
  (
    '33333333-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000005',
    1500000, 24, 20, 76750, 'educacao', 'aprovado_condicional',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Actualizar datas e analista nos pedidos
UPDATE credit_requests
SET
  approved_amount = requested_amount,
  analyst_id = '11111111-0000-0000-0000-000000000002',
  manager_id = '11111111-0000-0000-0000-000000000003',
  decision_date = NOW() - INTERVAL '7 days',
  analysis_start_date = NOW() - INTERVAL '9 days'
WHERE id IN (
  '33333333-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000004'
);

UPDATE credit_requests
SET
  analyst_id = '11111111-0000-0000-0000-000000000002',
  analysis_start_date = NOW() - INTERVAL '2 days'
WHERE id = '33333333-0000-0000-0000-000000000001';

-- Scores de credito de demonstracao
INSERT INTO credit_scores (
  client_id, total_score, financial_score, behavioral_score,
  document_score, credit_history_score, risk_level, details
) VALUES
  ('22222222-0000-0000-0000-000000000001', 78, 82, 74, 80, 70, 'baixo',  '{"monthly_income": 450000, "has_defaults": false}'::jsonb),
  ('22222222-0000-0000-0000-000000000002', 65, 68, 62, 78, 65, 'medio',  '{"monthly_income": 280000, "has_defaults": false}'::jsonb),
  ('22222222-0000-0000-0000-000000000003', 85, 88, 82, 85, 80, 'baixo',  '{"monthly_income": 620000, "has_defaults": false}'::jsonb),
  ('22222222-0000-0000-0000-000000000005', 72, 74, 70, 75, 68, 'baixo',  '{"monthly_income": 350000, "has_defaults": false}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Avaliacoes de risco
INSERT INTO risk_assessments (
  client_id, credit_request_id, risk_level, risk_score,
  debt_ratio, payment_capacity, max_recommended_amount,
  risk_factors, mitigating_factors
) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    'baixo', 22, 31.5, 157500, 6200000,
    '[{"factor": "none", "severity": "baixo", "description": "Sem factores de risco significativos"}]'::jsonb,
    ARRAY['Rendimento elevado', 'Vínculo laboral activo', 'Saldo médio saudável']
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000002',
    'medio', 35, 26.6, 98000, 3500000,
    '[{"factor": "low_income", "severity": "medio", "description": "Rendimento mensal moderado"}]'::jsonb,
    ARRAY['Vínculo laboral activo', 'Documentação completa']
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000003',
    'baixo', 15, 24.0, 217000, 10500000,
    '[]'::jsonb,
    ARRAY['Rendimento elevado', 'Saldo médio saudável', 'Vínculo laboral activo', '0 créditos anteriores liquidados']
  )
ON CONFLICT (id) DO NOTHING;

-- Logs de auditoria de demonstracao
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
VALUES
  ('11111111-0000-0000-0000-000000000002', 'credit_analyst_assigned',   'credit_request', '33333333-0000-0000-0000-000000000001', '{"analyst_id": "11111111-0000-0000-0000-000000000002"}'::jsonb),
  ('11111111-0000-0000-0000-000000000003', 'credit_decision_made',      'credit_request', '33333333-0000-0000-0000-000000000003', '{"decision": "aprovado", "approved_amount": 8000000}'::jsonb),
  ('11111111-0000-0000-0000-000000000003', 'credit_decision_made',      'credit_request', '33333333-0000-0000-0000-000000000004', '{"decision": "aprovado_condicional"}'::jsonb),
  ('11111111-0000-0000-0000-000000000002', 'credit_request_created',    'credit_request', '33333333-0000-0000-0000-000000000002', '{"amount": 2000000, "term": 36}'::jsonb);

-- Notificacoes de demonstracao para o gestor
INSERT INTO notifications (user_id, type, title, message, entity_id, read)
VALUES
  (
    '11111111-0000-0000-0000-000000000003',
    'credit_request_submitted',
    'Novo Pedido de Credito',
    'Maria Conceicao Ferreira submeteu um pedido de credito no valor de 2.000.000 AOA.',
    '33333333-0000-0000-0000-000000000002',
    false
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'credit_analyst_assigned',
    'Pedido Atribuido',
    'Foi-lhe atribuido o pedido de credito de Joao Manuel Domingos da Silva para analise.',
    '33333333-0000-0000-0000-000000000001',
    false
  );
