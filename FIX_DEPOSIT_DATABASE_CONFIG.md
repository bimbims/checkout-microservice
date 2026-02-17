# 🚨 FIX NECESSÁRIO: Configure Depósito de R$ 800,00 no Banco de Dados

## ❌ Problema Atual

O sistema está mostrando erro: **"⚠️ Erro: Não foi possível carregar o valor da caução"**

**Causa**: A tabela `system_settings` no banco de dados Supabase não tem o valor de `deposit_amount` configurado, ou está configurado como R$ 1.000,00 em vez de R$ 800,00.

**Por que aconteceu**: 
- Removemos TODOS os valores hardcoded do código (como você pediu)
- Agora o sistema REQUER que o valor esteja no banco de dados
- Sem fallbacks, o sistema falha se não achar a configuração

## ✅ Solução: Rodar SQL no Supabase

### Passo 1: Acessar SQL Editor

1. Acesse: https://supabase.com/dashboard/project/kminwgatqbhbcammpzxh/sql
2. Faça login com sua conta Supabase

### Passo 2: Executar o Script SQL

1. Clique em **"New Query"** (+ no canto superior direito)
2. Copie TODO o conteúdo do arquivo: 
   ```
   checkout-microservice-standalone/migrations/004_update_deposit_to_800.sql
   ```
3. Cole no editor SQL
4. Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)

### Passo 3: Verificar o Resultado

Você deve ver uma tabela com:
```
key             | amount_cents | display_value | updated_at
deposit_amount  | 80000       | R$ 800,00     | 2026-02-26 ...
```

Se aparecer **"Success. No rows returned"** mas depois mostrar a tabela de verificação, está OK!

## 🧪 Testar se Funcionou

### Teste 1: API Manual
No terminal, rode:
```bash
curl https://checkout-microservice.vercel.app/api/admin/settings?public=true
```

**Resultado esperado**:
```json
{
  "success": true,
  "depositAmount": 800,
  "depositDisplay": "R$ 800,00"
}
```

**Se ainda der erro 500**, aguarde 1-2 minutos (cache do Vercel) e tente novamente.

### Teste 2: Interface de Reserva

1. Acesse o sistema de reservas: https://ibirahill.com (ou seu domínio)
2. Selecione uma casa e datas
3. Preencha dados do hóspede
4. **Antes**: Aparecia erro "⚠️ Erro: Não foi possível carregar o valor da caução"
5. **Agora**: Deve aparecer "💳 Hold Proteção (R$ 800)"

### Teste 3: Fazer Reserva Completa

1. Complete o fluxo de reserva
2. Clique em "Pagar Hospedagem" no email de aprovação
3. Veja a página de checkout
4. **Valor da Caução deve mostrar**: R$ 800,00 (não R$ 8,00 ou R$ 80.000,00)

## 📊 Como Funciona Agora

### Conversão de Valores

1. **Banco de Dados**: 80000 (centavos)
2. **API retorna**: 800 (reais)
3. **Display no site**: R$ 800,00

### Fluxo do Sistema

```
BookingFlow.tsx
  ↓ (carrega ao abrir)
checkoutSettingsService.getDepositAmount()
  ↓ (faz requisição)
https://checkout-microservice.vercel.app/api/admin/settings?public=true
  ↓ (consulta banco)
Supabase: SELECT value FROM system_settings WHERE key = 'deposit_amount'
  ↓ (retorna)
{"amount": 80000, "currency": "BRL", "display": "R$ 800,00"}
  ↓ (converte)
API: depositAmount = 80000 / 100 = 800
  ↓ (exibe)
UI: R$ 800
```

## 🔒 Garantias Implementadas

✅ **Sem valores hardcoded**: Todo valor vem do banco de dados  
✅ **Sem fallbacks**: Sistema falha claramente se não configurado  
✅ **Timezone brasileiro**: Todos timestamps em horário de São Paulo  
✅ **Conversão correta**: Sempre mostra R$ 800,00 (nem mais, nem menos)

## 🛠️ Se Algo Der Errado

### Erro: "relation 'system_settings' does not exist"

**Causa**: Tabela não foi criada ainda  
**Solução**: 
1. Rode primeiro: `migrations/002_add_system_settings.sql`
2. Depois rode: `migrations/004_update_deposit_to_800.sql`

### Erro: API ainda retorna 500

**Possíveis causas**:
1. **Cache do Vercel**: Aguarde 2-3 minutos
2. **Environment Variables erradas**: Verifique `SUPABASE_SERVICE_ROLE_KEY` no Vercel
3. **RLS bloqueando acesso**: Rode `migrations/003_add_settings_rls_policies.sql`

**Debug**:
```bash
# Ver logs do Vercel
vercel logs checkout-microservice.vercel.app --follow

# Testar direto no Supabase
# No SQL Editor, rode:
SELECT * FROM system_settings WHERE key = 'deposit_amount';
```

### Erro: Valor aparece como null ou undefined

**Causa**: API retornou 200 mas sem dados  
**Solução**: Verifique se o JSON está correto:
```sql
SELECT value->>'amount' as amount FROM system_settings WHERE key = 'deposit_amount';
-- Deve retornar: 80000
```

## 📝 Alterações Deployadas

### Commit 6aae3e4 (Timezone Fix)
- ✅ Timestamps de reserva agora usam horário de São Paulo
- ✅ Importado `getBrazilianISOString()` em `services/booking-request.ts`
- ✅ Fix: `createdAt: new Date().toISOString()` → `createdAt: getBrazilianISOString()`

### Commits Anteriores (Remoção de Hard-coded)
- ✅ `8aa34bf`: Removido DEPOSIT_AMOUNT constant
- ✅ `509b7e3`: Removido último fallback no CheckoutPage
- ✅ `1a7a052`: APIs retornam erro 500 em vez de fallback
- ✅ `a819e75`: Atualizado constant de 1000→800 (depois removido)

## 🎯 Próximos Passos

1. ✅ **Rode o SQL** (arquivo `004_update_deposit_to_800.sql`)
2. ⏳ **Aguarde 2 minutos** (cache do Vercel)
3. 🧪 **Teste a API** (curl command acima)
4. ✅ **Teste o site** (faça uma reserva)
5. 🎉 **Confirme que mostra R$ 800,00**

## ❓ Perguntas Frequentes

**P: Por que não deixar um valor padrão hardcoded?**  
R: Você solicitou: "Em lugar nenhum deve ser o valor hard-coded". Agora o sistema é configurável via banco de dados, sem valores mágicos no código.

**P: E se eu quiser mudar para R$ 900,00 no futuro?**  
R: Basta rodar um UPDATE no Supabase:
```sql
UPDATE system_settings 
SET value = '{"amount": 90000, "currency": "BRL", "display": "R$ 900,00"}'
WHERE key = 'deposit_amount';
```

**P: Preciso fazer deploy depois de rodar o SQL?**  
R: NÃO! O sistema já está deployado esperando a configuração. Basta configurar o banco de dados.

## 📞 Suporte

Se após rodar o SQL e aguardar 2-3 minutos o erro persistir:

1. **Tire print** do resultado do SQL no Supabase
2. **Copie** o resultado do comando curl
3. **Mande** os dois para debug

---

**Status**: 🚨 CRÍTICO - Sistema não funciona até rodar o SQL  
**Impacto**: Clientes não conseguem fazer reservas  
**Tempo estimado para fix**: 5 minutos  
**Última atualização**: 2026-02-26
