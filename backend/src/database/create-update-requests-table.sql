-- Tabela para solicitações de atualização de dados dos clientes

CREATE TABLE IF NOT EXISTS client_update_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Dados solicitados
  requested_data JSONB NOT NULL,
  
  -- Dados atuais no momento da solicitação
  current_data JSONB NOT NULL,
  
  -- Dados extraídos do OCR dos documentos
  ocr_data JSONB,
  
  -- Resultados da validação
  validation_results JSONB,
  confidence_score INTEGER DEFAULT 0,
  
  -- Status da solicitação
  status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
  -- Valores possíveis: pending_review, pending_approval, approved, rejected
  
  -- Motivo da solicitação
  reason TEXT,
  
  -- Aprovação/Rejeição
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_update_requests_client ON client_update_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_update_requests_status ON client_update_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_update_requests_created ON client_update_requests(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_client_update_requests_updated_at
  BEFORE UPDATE ON client_update_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE client_update_requests IS 'Solicitações de atualização de dados cadastrais dos clientes';
COMMENT ON COLUMN client_update_requests.confidence_score IS 'Score de confiança da validação (0-100)';
COMMENT ON COLUMN client_update_requests.validation_results IS 'Resultados detalhados da validação entre formulário, BD e OCR';
COMMENT ON COLUMN client_update_requests.ocr_data IS 'Dados extraídos dos documentos via OCR';
