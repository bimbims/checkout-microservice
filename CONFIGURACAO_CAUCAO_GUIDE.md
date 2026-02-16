# Guia: Configuração de Valor da Caução

## 🎯 O Que Foi Implementado

Agora você pode configurar o valor da caução diretamente no painel administrativo! Este valor será usado automaticamente em:
- ✅ Emails de confirmação
- ✅ Página de checkout
- ✅ Processamento de pagamentos
- ✅ Links de checkout gerados
- ✅ Admin panel

## 📝 Como Configurar

### 1. Acesse a Página de Configurações

```
https://checkout-microservice.vercel.app/admin/settings
```

Ou clique no botão **"Configurações"** no painel administrativo.

### 2. Altere o Valor da Caução

1. Digite o novo valor em reais (ex: `1500.00` para R$ 1.500,00)
2. Clique em **"Salvar"**
3. Pronto! O novo valor já está ativo

### 3. Limites e Validações

- **Mínimo:** R$ 50,00
- **Máximo:** R$ 50.000,00
- **Formato:** Use ponto para decimais (1500.00)

## 🧪 Como Testar

### Teste 1: Alterar Valor no Admin

```bash
# 1. Acesse
https://checkout-microservice.vercel.app/admin/settings

# 2. Mude de R$ 1.000,00 para R$ 1.500,00
# 3. Salve
# 4. Verifique que aparece: "Valor do depósito atualizado com sucesso!"
```

### Teste 2: Verificar em Novo Checkout

```bash
# Execute no terminal do projeto:
cd "/Users/leolebkuchen/Desktop/Projects - Local/checkout-microservice-standalone"
node scripts/generate-test-checkout.js
```

O link gerado deve mostrar o **novo valor** que você configurou.

### Teste 3: Verificar API Response

```bash
# Gere um checkout via API
curl -X POST https://checkout-microservice.vercel.app/api/public/generate-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "TEST-999",
    "booking_data": {
      "house_name": "Teste",
      "guest_counts": {"adults": 2, "children": 0, "infants": 0},
      "check_in": "2026-03-01",
      "check_out": "2026-03-05"
    },
    "stay_amount": 2000.00
  }'

# A resposta deve incluir:
# "depositAmount": 1500.00  (ou o valor que você configurou)
```

## 🔍 Fluxo Técnico

### Backend (generate-checkout.ts)

```typescript
// 1. Request não envia deposit_amount
const { deposit_amount } = req.body;

// 2. Busca das settings
if (!deposit_amount) {
  finalDepositAmount = await getDefaultDepositAmount();
  // Retorna o valor configurado no admin
}

// 3. Cria checkout com valor das settings
await supabase.from('checkout_sessions').insert({
  deposit_amount: finalDepositAmount, // Valor configurado ✅
  ...
});
```

### Frontend (SettingsPage.tsx)

```typescript
// 1. Carrega valor atual
const response = await fetch('/api/admin/settings');

// 2. Usuário altera
setDepositAmount('1500.00');

// 3. Salva (converte para centavos)
const cents = Math.round(1500.00 * 100); // 150000 cents

await fetch('/api/admin/settings', {
  method: 'PUT',
  body: JSON.stringify({
    key: 'deposit_amount',
    value: { amount: 150000, currency: 'BRL', display: 'R$ 1.500,00' }
  })
});
```

## 🗄️ Estrutura no Banco de Dados

```sql
-- Tabela: system_settings
SELECT * FROM system_settings WHERE key = 'deposit_amount';

-- Resultado:
{
  "key": "deposit_amount",
  "value": {
    "amount": 150000,           -- Em centavos (R$ 1.500,00)
    "currency": "BRL",
    "display": "R$ 1.500,00"
  },
  "description": "Valor padrão da caução em centavos",
  "updated_by": "admin",
  "updated_at": "2026-02-16 17:30:00"
}
```

## 📊 Logs e Auditoria

Cada alteração é registrada:

```sql
SELECT * FROM payment_logs 
WHERE action = 'SETTING_UPDATED' 
ORDER BY created_at DESC 
LIMIT 5;
```

## ⚠️ Observações Importantes

### 1. Novas Reservas vs Existentes

- **Novas reservas:** Usam o valor configurado ✅
- **Reservas existentes:** Mantém o valor original (do momento da criação)

### 2. Override via API

Se o sistema de reservas enviar um `deposit_amount` específico, ele tem prioridade:

```bash
# Este checkout terá R$ 2.000,00 de caução (override)
POST /api/public/generate-checkout
{
  "booking_id": "REQ-123",
  "deposit_amount": 2000.00  ← Override do valor padrão
}
```

### 3. Fallback de Segurança

Se houver erro ao buscar as settings:
- Sistema usa **R$ 1.000,00** (valor de segurança)
- Registra aviso no log

## 🔧 Troubleshooting

### Problema: Valor não mudou no checkout

**Causa:** Checkout já existia antes da alteração

**Solução:** 
- Checkouts existentes mantém o valor original
- Gere um novo checkout para testar

### Problema: Erro ao salvar configuração

**Causa:** Migration não foi executada

**Verificação:**
```sql
-- Execute no Supabase SQL Editor
SELECT * FROM system_settings;
-- Se der erro "relation does not exist", execute a migration
```

### Problema: API retorna R$ 1.000,00

**Causa:** Valor ainda não foi configurado no admin

**Verificação:**
```sql
SELECT value FROM system_settings WHERE key = 'deposit_amount';
-- Deve retornar: {"amount": 100000, "currency": "BRL", "display": "R$ 1.000,00"}
```

## 📈 Próximas Melhorias (Futuro)

- [ ] Configuração por casa (valores diferentes para cada imóvel)
- [ ] Histórico de alterações com diff visual
- [ ] Valores sazonais (alta/baixa temporada)
- [ ] Notificação quando valor for alterado
- [ ] API para consultar valor atual sem criar checkout

## 🎉 Resumo

Você agora tem controle total sobre o valor da caução! 

**Antes:**
- Valor fixo R$ 1.000,00 hardcoded no código
- Mudança exigia editar código e fazer deploy

**Agora:**
- Valor configurável via admin panel
- Mudança instantânea, sem tocar no código
- Auditado e registrado no banco
- Aplicado automaticamente em todo o sistema

## 📞 Suporte

Se tiver dúvidas sobre esta funcionalidade:
1. Verifique este guia
2. Consulte os logs de pagamento no Supabase
3. Teste com checkout de exemplo antes de usar em produção
