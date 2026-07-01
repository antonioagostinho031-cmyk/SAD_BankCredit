-- ================================================================
-- ADICIONAR TABELA DE PRODUTOS DE CRÉDITO E FTIs
-- Sistema de Crédito Bancário - Banco Millennium Atlântico
-- ================================================================

-- ================================================================
-- TABELA: credit_products
-- Produtos de crédito disponíveis no banco
-- ================================================================
CREATE TABLE IF NOT EXISTS credit_products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(200) NOT NULL,
  code                  VARCHAR(50) NOT NULL UNIQUE,
  description           TEXT,
  category              VARCHAR(50) NOT NULL
                        CHECK (category IN ('pessoal','habitacao','automovel','consolidacao','empresarial')),
  min_amount            NUMERIC(15,2) NOT NULL,
  max_amount            NUMERIC(15,2) NOT NULL,
  min_term_months       INTEGER NOT NULL,
  max_term_months       INTEGER NOT NULL,
  base_interest_rate    NUMERIC(5,2) NOT NULL,
  min_interest_rate     NUMERIC(5,2) NOT NULL,
  max_interest_rate     NUMERIC(5,2) NOT NULL,
  
  -- Requisitos
  min_income            NUMERIC(15,2),
  max_age               INTEGER,
  min_age               INTEGER DEFAULT 18,
  requires_guarantor    BOOLEAN DEFAULT false,
  requires_collateral   BOOLEAN DEFAULT false,
  
  -- Comissões
  opening_fee_percent   NUMERIC(5,2) DEFAULT 0,
  opening_fee_fixed     NUMERIC(15,2) DEFAULT 0,
  management_fee_annual NUMERIC(15,2) DEFAULT 0,
  early_payment_fee     NUMERIC(5,2) DEFAULT 0,
  
  -- Status e controle
  active                BOOLEAN NOT NULL DEFAULT true,
  priority_order        INTEGER DEFAULT 0,
  
  -- Metadados
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by            UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_credit_products_category ON credit_products(category);
CREATE INDEX IF NOT EXISTS idx_credit_products_active ON credit_products(active);
CREATE INDEX IF NOT EXISTS idx_credit_products_code ON credit_products(code);

-- ================================================================
-- TABELA: credit_product_ftis
-- Fichas Técnicas de Informação (FTI) dos produtos
-- ================================================================
CREATE TABLE IF NOT EXISTS credit_product_ftis (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES credit_products(id) ON DELETE CASCADE,
  version               VARCHAR(20) NOT NULL,
  
  -- Informações do documento
  document_date         DATE NOT NULL,
  effective_date        DATE NOT NULL,
  expiry_date           DATE,
  
  -- Conteúdo da FTI
  product_description   TEXT NOT NULL,
  target_customers      TEXT,
  eligibility_criteria  TEXT,
  
  -- Custos detalhados
  interest_calculation  TEXT,
  associated_costs      TEXT,
  insurance_info        TEXT,
  
  -- Termos e condições
  early_termination     TEXT,
  contract_modification TEXT,
  dispute_resolution    TEXT,
  
  -- Informações legais
  regulatory_info       TEXT,
  complaints_procedure  TEXT,
  data_protection       TEXT,
  
  -- Anexos e links
  full_document_url     TEXT,
  annexes               JSONB,
  
  -- Status
  active                BOOLEAN NOT NULL DEFAULT true,
  approved              BOOLEAN NOT NULL DEFAULT false,
  approved_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at           TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Garantir que só há uma FTI ativa por produto
  CONSTRAINT unique_active_fti_per_product 
    UNIQUE NULLS NOT DISTINCT (product_id, active) 
    WHERE active = true
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_fti_product_id ON credit_product_ftis(product_id);
CREATE INDEX IF NOT EXISTS idx_fti_active ON credit_product_ftis(active);
CREATE INDEX IF NOT EXISTS idx_fti_version ON credit_product_ftis(version);

-- ================================================================
-- TABELA: credit_product_history
-- Histórico de alterações nos produtos
-- ================================================================
CREATE TABLE IF NOT EXISTS credit_product_history (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES credit_products(id) ON DELETE CASCADE,
  changed_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  change_type           VARCHAR(50) NOT NULL
                        CHECK (change_type IN ('created','updated','activated','deactivated','deleted')),
  changes               JSONB NOT NULL,
  reason                TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_history_product_id ON credit_product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_changed_by ON credit_product_history(changed_by);

-- ================================================================
-- COMENTÁRIOS DAS TABELAS
-- ================================================================
COMMENT ON TABLE credit_products IS 'Produtos de crédito disponíveis no banco';
COMMENT ON TABLE credit_product_ftis IS 'Fichas Técnicas de Informação dos produtos de crédito';
COMMENT ON TABLE credit_product_history IS 'Histórico de alterações nos produtos de crédito';

COMMENT ON COLUMN credit_products.category IS 'Categoria: pessoal, habitacao, automovel, consolidacao, empresarial';
COMMENT ON COLUMN credit_products.base_interest_rate IS 'Taxa de juro base (TAN) em percentagem';
COMMENT ON COLUMN credit_product_ftis.version IS 'Versão da FTI (ex: 1.0, 1.1, 2.0)';
COMMENT ON COLUMN credit_product_ftis.approved IS 'FTI aprovada pelo compliance/legal';
