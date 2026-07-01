# Sistema de Crédito Bancário

**Banco Millennium Atlântico**  
Sistema completo de gestão de crédito bancário com análise automatizada, controle de permissões e auditoria.

---

## Status do Projeto

**Versão:** 1.0.0  
**Status:** PRONTO PARA PRODUÇÃO  
**Última Atualização:** 14 de Junho de 2026

---

## Início Rápido

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Supabase (gratuita)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone [url-do-repositorio]
   cd SAD_BankCredit
   ```

2. **Configure o Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edite .env com suas credenciais Supabase
   ```

3. **Configure o Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Execute o Schema SQL**
   - Acesse https://supabase.com
   - Abra SQL Editor
   - Execute `backend/src/database/schema.sql`
   - Execute `backend/src/database/seed.sql` (opcional)

5. **Inicie o Sistema**
   ```powershell
   # Na raiz do projeto
   .\start-dev.ps1
   ```

Acesse: http://localhost:5173

---

## Funcionalidades Principais

### Gestão de Crédito
- Criação e análise de pedidos de crédito
- Scoring automático de clientes
- Avaliação de risco
- Aprovação em múltiplos níveis
- Simulação de crédito

### Perfil Financeiro Completo
- 30+ métricas calculadas automaticamente
- Score de crédito (0-100)
- Recomendações de montante e prazo
- Análise de elegibilidade
- Histórico de transações
- Identificação de fatores de risco

### Controle de Acesso
- 5 roles diferentes: Admin, Gestor, Analista, Supervisor, Cliente
- Permissões granulares por funcionalidade
- Proteção de rotas e endpoints
- Auditoria completa de ações

### Gestão de Clientes
- CRUD completo
- Validação de elegibilidade
- Upload de documentos
- Histórico de créditos

### Dashboard Executivo
- Estatísticas em tempo real
- Tendências de crédito
- Performance de analistas
- Distribuição de risco

### Auditoria e Compliance
- Logs de todas as ações
- Rastreabilidade completa
- Relatórios gerenciais
- Sistema de notificações

---

## Tecnologias

### Backend
- NestJS + TypeScript
- PostgreSQL (Supabase)
- JWT Authentication
- Passport

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Hook Form + Zod

---

## Documentação

- `backend/src/database/schema.sql` — Schema completo da base de dados
- `backend/src/database/seed.sql` — Dados iniciais (produtos, configurações)
- `backend/.env.example` — Variáveis de ambiente necessárias
- `frontend/.env.example` — Variáveis de ambiente do frontend
- `render.yaml` — Configuração de deploy no Render

---

## Usuários de Teste

| Role | Email | Senha |
|------|-------|-------|
| Admin | admin@banco.ao | Admin@1234 |
| Gestor | gestor@banco.ao | Gestor@1234 |
| Analista | analista@banco.ao | Analista@1234 |
| Supervisor | supervisor@banco.ao | Supervisor@1234 |

---

## Estrutura do Projeto

```
SAD_BankCredit/
├── backend/               # API NestJS
│   ├── src/
│   │   ├── common/       # Guards, decorators, filters
│   │   ├── database/     # Schema e seeds
│   │   └── modules/      # Módulos de negócio
│   └── package.json
├── frontend/             # Aplicação React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── hooks/       # Hooks customizados
│   │   └── services/    # API clients
│   └── package.json
└── docs/                # Documentação (arquivos .md)
```

---

## Scripts

### Backend
```bash
cd backend
npm run start:dev    # Desenvolvimento
npm run build        # Build
npm run start:prod   # Produção
```

### Frontend
```bash
cd frontend
npm run dev          # Desenvolvimento
npm run build        # Build
npm run preview      # Preview do build
```

---

## Segurança

- Autenticação JWT
- Autorização baseada em roles
- Validação de dados em todas as camadas
- Proteção contra SQL injection
- Logs de auditoria
- Senhas hasheadas (bcrypt)

---

## Deploy no Render

O projecto usa um `render.yaml` (Render Blueprint) que define automaticamente os dois serviços.

### Pré-requisitos
- Conta em [render.com](https://render.com)
- Repositório no GitHub

### Passo a Passo

**1. Fazer push para o GitHub**
```bash
git init
git add .
git commit -m "chore: initial commit"
git remote add origin https://github.com/SEU_USER/SAD_BankCredit.git
git push -u origin main
```

**2. Criar os serviços no Render**

Opção A — Blueprint automático:
- Render Dashboard → *New* → *Blueprint*
- Ligar o repositório GitHub → o `render.yaml` configura tudo automaticamente

Opção B — Manual:
- Criar um **Web Service** (backend) e um **Static Site** (frontend) separadamente

**3. Configurar variáveis de ambiente**

No Web Service (`sad-bankcredit-api`), definir no dashboard:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | URL do projecto Supabase |
| `SUPABASE_SERVICE_KEY` | Service Role Key do Supabase |
| `JWT_SECRET` | Gerado automaticamente pelo Blueprint |
| `FRONTEND_URL` | URL do static site após o deploy |

No Static Site (`sad-bankcredit-web`):

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://sad-bankcredit-api.onrender.com/api/v1` |

> Nota: O `VITE_API_URL` é processado em build time pelo Vite.
> Após definir esta variável, é necessário fazer *Manual Deploy* no Static Site.

**4. Ordem de deploy recomendada**
1. Deploy do **backend** → copiar a URL gerada (ex: `https://sad-bankcredit-api.onrender.com`)
2. Definir `FRONTEND_URL` no backend com a URL do frontend
3. Deploy do **frontend** com `VITE_API_URL` apontando para o backend

**5. Health Check**

O backend expõe `GET /api/v1/health` para verificação de disponibilidade.

---

## Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

## Roadmap Futuro

- Portal do cliente (internet banking)
- Aplicativo mobile
- Integração com bureau de crédito
- Assinaturas digitais
- Relatórios avançados
- Dashboard em tempo real
- Exportação PDF/Excel

---

## Licença

Proprietário - Banco Millennium Atlântico  
Todos os direitos reservados.

---

## Créditos

**Desenvolvido por:** Kiro AI  
**Cliente:** Banco Millennium Atlântico  
**Ano:** 2026

---

Para mais informações, consulte **STATUS_FINAL_PROJETO.md**
