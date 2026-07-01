-- Migration: associar cada cliente a um gestor de conta
-- Executar no Supabase SQL Editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS account_manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_account_manager
  ON clients(account_manager_id);

COMMENT ON COLUMN clients.account_manager_id IS
  'Gestor de conta responsável por este cliente. NULL = por atribuir.';

-- Associar cliente afonso.kiluanje@gmail.com ao gestor gestor@bancobai.ao
-- Usa user_id (via users.email) OU clients.email — cobre ambos os casos
UPDATE clients
SET account_manager_id = (
  SELECT id FROM users
  WHERE email = 'gestor@bancobai.ao'
    AND role   = 'gestor'
  LIMIT 1
)
WHERE email = 'afonso.kiluanje@gmail.com'
   OR user_id = (SELECT id FROM users WHERE email = 'afonso.kiluanje@gmail.com' LIMIT 1);

-- ── Diagnóstico: verificar estado actual ─────────────────────────────
-- Corre esta secção separadamente para confirmar a associação

SELECT
  c.id              AS client_id,
  c.full_name       AS cliente,
  c.email           AS email_na_tabela_clients,
  c.account_manager_id,
  u.name            AS gestor,
  u.email           AS email_gestor,
  u.role            AS role_gestor
FROM clients c
LEFT JOIN users u ON u.id = c.account_manager_id
WHERE c.email = 'afonso.kiluanje@gmail.com'
   OR c.user_id = (SELECT id FROM users WHERE email = 'afonso.kiluanje@gmail.com' LIMIT 1);
