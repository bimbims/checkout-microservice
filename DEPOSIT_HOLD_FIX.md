# 🔧 Correção: Deposit Holds não aparecem no Admin

## Problema Identificado

O problema era que a tabela `deposit_holds` no Supabase tinha as seguintes restrições:

1. ❌ Campo `pagbank_charge_id` era **NOT NULL** 
2. ❌ Status só permitia: `AUTHORIZED`, `RELEASED`, `CAPTURED`, `EXPIRED`
3. ❌ Faltava campo `house_name`

Quando um pagamento era feito:
- Com PIX (sem cartão de depósito): `depositChargeId` = `null`, `status` = `SKIPPED`
- Com cartão de depósito que falhou: `depositChargeId` = `null`, `status` = `FAILED`

Como `pagbank_charge_id NOT NULL`, a inserção no banco falhava silenciosamente!

## Solução

### 1️⃣ Rode a Migration no Supabase

Acesse: https://supabase.com/dashboard/project/kminwgatqbhbcammpzxh/sql

Cole e execute o conteúdo do arquivo:
```
migrations/001_fix_deposit_holds.sql
```

Isso vai:
- ✅ Permitir `NULL` no campo `pagbank_charge_id`
- ✅ Adicionar status `SKIPPED` e `FAILED`
- ✅ Adicionar campo `house_name`

### 2️⃣ Deploy Automático

O código já foi atualizado e commitado. O Vercel vai fazer deploy automaticamente.

### 3️⃣ Teste

Após rodar a migration e o deploy completar:

```bash
node test-credit-card-payment.js
```

Depois verifique: https://checkout-microservice.vercel.app/admin

Os deposit holds devem aparecer!

## O que mudou no código

**Antes:**
```typescript
.insert({
  charge_id: depositChargeId,  // ❌ campo errado
  ...
})
```

**Depois:**
```typescript
.insert({
  pagbank_charge_id: depositChargeId,  // ✅ campo correto
  ...
})
```

E agora com logs detalhados para debug:
```typescript
if (depositError) {
  console.error('[PROCESS] Error saving deposit hold:', depositError);
}
```

## Verificar se funcionou

Console do Vercel deve mostrar:
```
[PROCESS] Deposit hold saved successfully: { id: '...', ... }
```

Se ainda mostrar erro, verifique se a migration foi executada no Supabase.
