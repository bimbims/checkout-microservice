# Checkout Microservice - Ibirahill

Microserviço independente para processamento de pagamentos via PagBank com sistema de caução (pré-autorização).

## 🎯 Funcionalidades

- **Checkout de 12 horas**: Links temporários e seguros para pagamento
- **Pagamento híbrido**: PIX ou Cartão para estadia + Cartão (pré-auth) para caução
- **Caução inteligente**: R$ 1.000 pré-autorizado, liberar ou capturar após estadia
- **Painel Admin**: Gerenciamento de cauções (liberar/capturar)
- **Notificações**: Emails automáticos em todas as etapas
- **Webhooks**: Integração automática com sistema principal

## 🏗️ Arquitetura

```
Frontend: React 19 + TypeScript + Vite + TailwindCSS
Backend: Vercel Serverless Functions (Node.js)
Database: Supabase (PostgreSQL)
Pagamentos: PagBank API v4 (Checkout Transparente)
Email: Resend
Hosting: Vercel
```

## 📦 Estrutura do Projeto

```
checkout-microservice/
├── src/
│   ├── pages/              # Páginas React
│   │   ├── CheckoutPage.tsx
│   │   ├── AdminPanel.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/         # Componentes reutilizáveis
│   │   ├── PaymentForm.tsx
│   │   ├── BookingSummary.tsx
│   │   ├── Alert.tsx
│   │   ├── Logo.tsx
│   │   └── LoadingSpinner.tsx
│   ├── services/           # Lógica de negócio
│   │   ├── supabase.ts
│   │   ├── pagbank.ts
│   │   ├── booking-reader.ts
│   │   └── checkout-generator.ts
│   └── types.ts            # TypeScript interfaces
├── api/                    # Vercel Serverless Functions
│   ├── public/
│   │   └── generate-checkout.ts
│   ├── checkout/
│   │   ├── validate.ts
│   │   └── process.ts
│   ├── admin/
│   │   ├── deposits.ts
│   │   └── deposit/
│   │       ├── release.ts
│   │       └── capture.ts
│   ├── webhooks/
│   │   └── pagbank.ts
│   └── cron/
│       └── expire-checkouts.ts
└── README.md
```

## 🗄️ Banco de Dados (Supabase)

### Tabelas

**1. checkout_sessions**
```sql
- id (uuid, PK)
- token (text, unique)
- booking_id (text)
- stay_amount (numeric)
- deposit_amount (numeric)
- status (text) -- PENDING, COMPLETED, EXPIRED, CANCELLED
- expires_at (timestamp)
- completed_at (timestamp)
- created_at (timestamp)
```

**2. transactions**
```sql
- id (uuid, PK)
- booking_id (text)
- charge_id (text, unique)
- amount (numeric)
- type (text) -- STAY, DEPOSIT
- method (text) -- PIX, CREDIT_CARD
- status (text) -- PENDING, PAID, FAILED, WAITING_PIX
- created_at (timestamp)
```

**3. deposit_holds**
```sql
- id (uuid, PK)
- booking_id (text)
- charge_id (text, unique)
- amount (numeric)
- status (text) -- AUTHORIZED, CAPTURED, RELEASED, FAILED
- house_name (text)
- released_at (timestamp)
- captured_at (timestamp)
- created_at (timestamp)
```

**4. payment_logs**
```sql
- id (uuid, PK)
- booking_id (text)
- action (text)
- details (jsonb)
- created_at (timestamp)
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Supabase (nova instância isolada)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... # Para API routes

# PagBank
PAGBANK_API_TOKEN=seu_token_aqui
PAGBANK_SANDBOX=true # false para produção

# URLs
MAIN_APP_URL=https://ibirahill.com.br
CHECKOUT_BASE_URL=https://checkout.ibirahill.com # ou URL Vercel

# Cron Jobs
CRON_SECRET=seu_secret_aleatorio_aqui

# Email (Resend - mesmo do sistema principal)
RESEND_API_KEY=re_...
```

## 🚀 Setup Local

### 1. Instalar dependências
```bash
cd checkout-microservice
npm install
```

### 2. Configurar Supabase

Crie uma nova instância no [Supabase](https://supabase.com) (ou use a existente se preferir):

```bash
# Execute o SQL em src/services/supabase.ts
# Isso criará as 4 tabelas + RLS policies
```

### 3. Configurar PagBank

1. Acesse [PagBank Developers](https://dev.pagbank.uol.com.br/)
2. Crie uma aplicação
3. Obtenha o token de API (sandbox para testes)
4. Configure o SDK no `index.html` (já está configurado)

### 4. Rodar em desenvolvimento

```bash
npm run dev
# Servidor em http://localhost:3001
```

### 5. Testar o fluxo

1. Gere um checkout: `POST http://localhost:3001/api/public/generate-checkout` com `{ "bookingId": "REQ-123456" }`
2. Acesse: `http://localhost:3001/checkout/CHK-REQ-123456-abc123`
3. Preencha o formulário de pagamento
4. Verifique o painel admin: `http://localhost:3001/admin`

## 📤 Deploy no Vercel

### 1. Conectar repositório

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 2. Configurar variáveis de ambiente

No Vercel Dashboard:
1. Project Settings > Environment Variables
2. Adicione todas as variáveis do `.env`
3. Marque para Production, Preview e Development

### 3. Configurar domínio customizado

1. Vercel Dashboard > Domains
2. Adicione `checkout.ibirahill.com`
3. Configure CNAME no DNS:
   ```
   CNAME checkout -> cname.vercel-dns.com
   ```

### 4. Configurar Cron Job

O cron já está configurado em `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-checkouts",
      "schedule": "0 * * * *"  // A cada hora
    }
  ]
}
```

O Vercel executará automaticamente.

### 5. Configurar Webhook PagBank

1. Acesse PagBank > Configurações > Webhooks
2. Adicione: `https://checkout.ibirahill.com/api/webhooks/pagbank`
3. Selecione eventos: `charge.paid`, `charge.authorized`, `charge.declined`

## 🔗 Integração com Sistema Principal

### 1. Endpoint para gerar checkout

O sistema principal deve chamar:

```typescript
POST https://checkout.ibirahill.com/api/public/generate-checkout
Content-Type: application/json

{
  "bookingId": "REQ-1234567890"
}

// Resposta
{
  "success": true,
  "token": "CHK-REQ-1234567890-abc123def456",
  "checkoutUrl": "https://checkout.ibirahill.com/checkout/CHK-REQ-1234567890-abc123def456",
  "expiresAt": "2026-02-14T02:00:00.000Z"
}
```

### 2. Webhook de confirmação

O microserviço notifica o sistema principal em:

```typescript
POST https://ibirahill.com.br/api/webhooks/payment-confirmed
Content-Type: application/json

{
  "bookingId": "REQ-1234567890",
  "stayChargeId": "CHAR_ABC123",
  "depositChargeId": "CHAR_DEF456",
  "stayStatus": "PAID",
  "depositStatus": "AUTHORIZED",
  "totalAmount": 2500.00,
  "depositAmount": 1000.00
}
```

O sistema principal deve criar este endpoint para:
- Atualizar status da reserva para "CONFIRMED"
- Enviar email de confirmação
- Processar lógica adicional

### 3. Endpoint para ler reserva

O microserviço precisa ler dados da reserva:

```typescript
GET https://ibirahill.com.br/api/bookings/REQ-1234567890

// Resposta esperada
{
  "id": "REQ-1234567890",
  "house_name": "Casa dos Sonhos",
  "check_in": "2026-03-15",
  "check_out": "2026-03-20",
  "guests": 4,
  "total_price": 2500.00,
  "status": "APPROVED"
}
```

Este endpoint pode já existir no `BookingRequestManager`.

## 📧 Email Templates (TODO)

Criar templates em `email-templates/checkout/`:

1. **checkout-link.html** - Link enviado ao cliente
2. **payment-confirmed.html** - Confirmação de pagamento
3. **checkout-expiring.html** - Lembrete 2h antes de expirar
4. **deposit-released.html** - Caução liberada
5. **deposit-captured.html** - Caução cobrada
6. **payment-failed.html** - Pagamento falhou

## 🔍 Monitoramento

### Logs
- Vercel Dashboard > Functions > View Logs
- Supabase Dashboard > Logs > Postgres Logs

### Métricas importantes
- Taxa de conversão de checkout (completo/gerado)
- Tempo médio de pagamento
- Taxa de expiração
- Cauções liberadas vs. capturadas

### Debugging
```bash
# Ver logs em tempo real
vercel logs --follow

# Testar função específica
vercel dev
```

## 🧪 Testes

### Testar no Sandbox PagBank

Use os cartões de teste:
```
Aprovado:
  Número: 4111 1111 1111 1111
  CVV: 123
  Validade: 12/2030

Negado:
  Número: 4000 0000 0000 0002
  CVV: 123
  Validade: 12/2030
```

### PIX de teste
No sandbox, o PIX será marcado como pago automaticamente após alguns segundos.

## 🛠️ Troubleshooting

### Erro: "Sessão expirada"
- Verifique se o cron está rodando corretamente
- Confirme timezone no Supabase (UTC)

### Erro: "Token inválido"
- Verifique formato: CHK-{bookingId}-{hash}
- Confirme que booking_id é REQ-{timestamp}

### Erro PagBank: "Unauthorized"
- Verifique se PAGBANK_API_TOKEN está correto
- Confirme se está usando sandbox/production correto

### Webhook não recebe notificações
- Verifique URL configurada no PagBank
- Teste manualmente: `curl -X POST https://checkout.ibirahill.com/api/webhooks/pagbank`

## 📋 Checklist Final

Antes de ir para produção:

- [ ] Supabase configurado com RLS habilitado
- [ ] Todas as variáveis de ambiente em Produção
- [ ] PagBank em modo produção (não sandbox)
- [ ] Domínio `checkout.ibirahill.com` configurado
- [ ] Webhook PagBank apontando para produção
- [ ] Cron job ativo no Vercel
- [ ] Email templates criados e testados
- [ ] Sistema principal integrado com webhooks
- [ ] Testes end-to-end realizados
- [ ] Monitoramento configurado

## 🤝 Suporte

Dúvidas ou problemas:
- Ver logs: Vercel Dashboard
- Banco de dados: Supabase Dashboard > Table Editor
- PagBank: https://dev.pagbank.uol.com.br/docs

---

**Desenvolvido para Ibirahill** | Fev 2026
