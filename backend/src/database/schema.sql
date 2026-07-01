-- ================================================================
-- SISTEMA DE CRÉDITO BANCÁRIO - BANCO MILLENNIUM ATLÂNTICO
-- Schema da Base de Dados PostgreSQL (Supabase)
-- ================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABELA: users
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(200) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'cliente'
              CHECK (role IN ('admin', 'analista', 'gestor', 'supervisor', 'cliente')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: clients
-- ================================================================
CREATE TABLE IF NOT EXISTS clients (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name               VARCHAR(200) NOT NULL,
  bi_number               VARCHAR(20) NOT NULL UNIQUE,
  nif                     VARCHAR(20) NOT NULL UNIQUE,
  date_of_birth           DATE NOT NULL,
  marital_status          VARCHAR(30) NOT NULL
                          CHECK (marital_status IN ('solteiro','casado','divorciado','viuvo','uniao_de_facto')),
  address                 TEXT NOT NULL,
  phone                   VARCHAR(30) NOT NULL,
  email                   VARCHAR(200),
  employer                VARCHAR(200),
  job_title               VARCHAR(100),
  monthly_income          NUMERIC(15,2) NOT NULL DEFAULT 0,
  account_number          VARCHAR(50),
  account_balance         NUMERIC(15,2) NOT NULL DEFAULT 0,
  registration_status     VARCHAR(30) NOT NULL DEFAULT 'pendente'
                          CHECK (registration_status IN ('pendente','em_validacao','aprovado','rejeitado','incompleto')),
  is_eligible_for_credit  BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: addresses
-- ================================================================
CREATE TABLE IF NOT EXISTS addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  street        VARCHAR(300),
  number        VARCHAR(20),
  neighborhood  VARCHAR(100),
  city          VARCHAR(100),
  province      VARCHAR(100),
  postal_code   VARCHAR(20),
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: employment_data
-- ================================================================
CREATE TABLE IF NOT EXISTS employment_data (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employer_name   VARCHAR(200) NOT NULL,
  job_title       VARCHAR(100),
  employment_type VARCHAR(50) CHECK (employment_type IN ('efectivo','contrato','freelancer','outro')),
  start_date      DATE,
  end_date        DATE,
  is_current      BOOLEAN NOT NULL DEFAULT true,
  monthly_income  NUMERIC(15,2),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: income_records
-- ================================================================
CREATE TABLE IF NOT EXISTS income_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month         VARCHAR(7) NOT NULL,
  gross_income  NUMERIC(15,2) NOT NULL,
  net_income    NUMERIC(15,2) NOT NULL,
  source        VARCHAR(100),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: documents
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_type     VARCHAR(50) NOT NULL
                    CHECK (document_type IN ('bi','nif','comprovativo_vinculo',
                           'comprovativo_rendimento','passaporte','cartao_residente')),
  file_name         VARCHAR(300) NOT NULL,
  file_path         TEXT NOT NULL,
  file_size         INTEGER,
  mime_type         VARCHAR(100),
  status            VARCHAR(30) NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','em_validacao','aprovado','rejeitado','expirado')),
  expiry_date       DATE,
  confidence_score  NUMERIC(5,2),
  validation_notes  TEXT,
  validated_by      UUID REFERENCES users(id),
  validated_at      TIMESTAMP WITH TIME ZONE,
  uploaded_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: document_validations
-- ================================================================
CREATE TABLE IF NOT EXISTS document_validations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  validation_type   VARCHAR(50) NOT NULL CHECK (validation_type IN ('automatic','manual')),
  is_valid          BOOLEAN NOT NULL,
  confidence_score  NUMERIC(5,2),
  extracted_data    JSONB,
  validation_errors TEXT[],
  validated_by_ai   BOOLEAN NOT NULL DEFAULT false,
  validated_by_user UUID REFERENCES users(id),
  validation_date   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: transactions
-- ================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL
                   CHECK (transaction_type IN ('credito','debito','transferencia')),
  amount           NUMERIC(15,2) NOT NULL,
  balance_after    NUMERIC(15,2),
  description      TEXT,
  reference        VARCHAR(100),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: credit_requests
-- ================================================================
CREATE TABLE IF NOT EXISTS credit_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             UUID NOT NULL REFERENCES clients(id),
  requested_amount      NUMERIC(15,2) NOT NULL,
  approved_amount       NUMERIC(15,2),
  term_months           INTEGER NOT NULL CHECK (term_months BETWEEN 6 AND 360),
  interest_rate         NUMERIC(5,2),
  monthly_payment       NUMERIC(15,2),
  purpose               VARCHAR(50) NOT NULL
                        CHECK (purpose IN ('habitacao','automovel','educacao',
                               'saude','consolidacao','negocio','outros')),
  purpose_description   TEXT,
  status                VARCHAR(50) NOT NULL DEFAULT 'submetido'
                        CHECK (status IN ('rascunho','submetido','em_analise',
                               'aprovado','aprovado_condicional','rejeitado',
                               'cancelado','desembolsado')),
  analyst_id            UUID REFERENCES users(id),
  manager_id            UUID REFERENCES users(id),
  conditions            TEXT,
  rejection_reason      TEXT,
  submission_date       TIMESTAMP WITH TIME ZONE,
  analysis_start_date   TIMESTAMP WITH TIME ZONE,
  decision_date         TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: credit_analysis
-- ================================================================
CREATE TABLE IF NOT EXISTS credit_analysis (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_request_id     UUID NOT NULL REFERENCES credit_requests(id) ON DELETE CASCADE,
  analyst_id            UUID REFERENCES users(id),
  financial_capacity    NUMERIC(5,2),
  debt_ratio            NUMERIC(5,2),
  income_stability      NUMERIC(5,2),
  credit_history_score  NUMERIC(5,2),
  document_quality_score NUMERIC(5,2),
  overall_score         NUMERIC(5,2),
  recommendation        VARCHAR(50),
  analyst_notes         TEXT,
  analysis_date         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: credit_scores
-- ================================================================
CREATE TABLE IF NOT EXISTS credit_scores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  total_score           NUMERIC(5,2) NOT NULL,
  financial_score       NUMERIC(5,2),
  behavioral_score      NUMERIC(5,2),
  document_score        NUMERIC(5,2),
  credit_history_score  NUMERIC(5,2),
  risk_level            VARCHAR(20) CHECK (risk_level IN ('baixo','medio','alto')),
  details               JSONB,
  calculated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: risk_assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id                UUID NOT NULL REFERENCES clients(id),
  credit_request_id        UUID REFERENCES credit_requests(id),
  risk_level               VARCHAR(20) NOT NULL
                           CHECK (risk_level IN ('baixo','medio','alto','muito_alto')),
  risk_score               NUMERIC(5,2),
  debt_ratio               NUMERIC(5,2),
  payment_capacity         NUMERIC(15,2),
  max_recommended_amount   NUMERIC(15,2),
  risk_factors             JSONB,
  mitigating_factors       TEXT[],
  assessed_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: financial_indicators
-- ================================================================
CREATE TABLE IF NOT EXISTS financial_indicators (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id                   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  credit_request_id           UUID REFERENCES credit_requests(id),
  average_monthly_income      NUMERIC(15,2),
  average_monthly_balance     NUMERIC(15,2),
  payment_capacity            NUMERIC(15,2),
  total_debt                  NUMERIC(15,2),
  salary_commitment_rate      NUMERIC(5,2),
  financial_stability_score   NUMERIC(5,2),
  credit_history_score        NUMERIC(5,2),
  calculated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: decision_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS decision_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_request_id UUID REFERENCES credit_requests(id),
  client_id         UUID REFERENCES clients(id),
  recommendation    VARCHAR(50) NOT NULL
                    CHECK (recommendation IN ('aprovado','aprovado_condicional','revisao','rejeitado')),
  confidence        NUMERIC(5,2),
  justification     TEXT,
  scoring_data      JSONB,
  risk_data         JSONB,
  decided_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(300) NOT NULL,
  message     TEXT NOT NULL,
  entity_id   UUID,
  read        BOOLEAN NOT NULL DEFAULT false,
  read_at     TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- TABELA: audit_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    UUID,
  old_values   JSONB,
  new_values   JSONB,
  ip_address   VARCHAR(50),
  user_agent   TEXT,
  details      JSONB,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- ÍNDICES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_clients_bi ON clients(bi_number);
CREATE INDEX IF NOT EXISTS idx_clients_nif ON clients(nif);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_credit_requests_client_id ON credit_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_status ON credit_requests(status);
CREATE INDEX IF NOT EXISTS idx_credit_requests_analyst_id ON credit_requests(analyst_id);
CREATE INDEX IF NOT EXISTS idx_credit_scores_client_id ON credit_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_client_id ON risk_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);

-- ================================================================
-- TRIGGERS: updated_at automático
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_credit_requests_updated_at
  BEFORE UPDATE ON credit_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_credit_analysis_updated_at
  BEFORE UPDATE ON credit_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- DADOS INICIAIS: Utilizador admin padrão
-- Senha: Admin@123 (hash bcrypt)
-- ================================================================
INSERT INTO users (name, email, password, role)
VALUES (
  'Administrador Sistema',
  'admin@millenniumatlântico.ao',
  '$2b$10$rQnJqjLjJqjLjJqjLjJqjOxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'admin'
) ON CONFLICT (email) DO NOTHING;
