# 💰 Captura Parcial de Caução

## Nova Funcionalidade

Agora você pode capturar apenas uma parte do valor da caução e liberar automaticamente o restante!

## Como Funciona

### Cenário de Exemplo

**Caução autorizada**: R$ 1.000,00  
**Dano identificado**: R$ 250,00  
**Resultado**: Cobra R$ 250,00 e libera R$ 750,00

### Passo a Passo

1. **Acesse o Admin Panel:**
   ```
   https://checkout-microservice.vercel.app/admin
   ```

2. **Encontre a caução** que deseja capturar (status: `AUTHORIZED`)

3. **Clique em "Capturar"**

4. **Digite o valor** a ser capturado:
   ```
   Digite o valor a ser capturado (R$):
   
   Valor total da caução: R$ 1000.00
   
   Exemplos:
   - "1000" = captura total
   - "250" = captura parcial de R$ 250,00
   - "0" ou vazio = cancelar
   ```

5. **Confirme** a operação:
   - **Captura Parcial**: Mostra valor a cobrar e valor a liberar
   - **Captura Total**: Mostra valor total

6. **Resultado**:
   - ✅ Valor especificado é cobrado do cartão
   - ✅ Restante é automaticamente liberado
   - ✅ Status atualizado para `CAPTURED`
   - ✅ Email enviado ao cliente informando o valor cobrado
   - ✅ Log completo da operação

### Validações

❌ **Valor inválido** (não é número, negativo, zero)  
❌ **Valor maior que a caução** (não pode capturar mais do que está autorizado)  
✅ **Qualquer valor entre R$ 0,01 e o valor total** da caução

## No Admin Panel

### Antes da Captura
```
Reserva     Casa         Valor          Status      Ações
REQ-123     Casa Lago    R$ 1.000,00    Autorizado  [Liberar] [Capturar]
```

### Após Captura Parcial
```
Reserva     Casa         Valor                       Status     Ações
REQ-123     Casa Lago    R$ 1.000,00                Capturado   -
                         Capturado: R$ 250,00 (parcial)
```

### Após Captura Total
```
Reserva     Casa         Valor                       Status     Ações
REQ-123     Casa Lago    R$ 1.000,00                Capturado   -
                         Capturado: R$ 1.000,00
```

## Resposta da API

### Captura Parcial

**Request:**
```json
{
  "depositId": "uuid-aqui",
  "amount": 250
}
```

**Response:**
```json
{
  "success": true,
  "message": "Captura parcial realizada: R$ 250.00 de R$ 1000.00",
  "depositId": "uuid-aqui",
  "status": "CAPTURED",
  "fullAmount": 1000.00,
  "capturedAmount": 250.00,
  "remainingAmount": 750.00,
  "isPartialCapture": true
}
```

### Captura Total

**Request:**
```json
{
  "depositId": "uuid-aqui"
  // Sem 'amount' = captura total
}
```

**Response:**
```json
{
  "success": true,
  "message": "Caução capturada integralmente com sucesso",
  "depositId": "uuid-aqui",
  "status": "CAPTURED",
  "fullAmount": 1000.00,
  "capturedAmount": 1000.00,
  "remainingAmount": 0.00,
  "isPartialCapture": false
}
```

## Logs

Todas as capturas são registradas em `payment_logs`:

```json
{
  "booking_id": "REQ-123",
  "action": "DEPOSIT_CAPTURED",
  "details": {
    "depositId": "uuid",
    "chargeId": "CHAR_XXX",
    "fullDepositAmount": 1000.00,
    "capturedAmount": 250.00,
    "isPartialCapture": true
  }
}
```

## Email ao Cliente

O cliente recebe email com:
- ✉️ **Assunto**: "Caução Cobrada - Ibirahill"
- 📄 **Conteúdo**: Valor cobrado (R$ 250,00)
- 📋 **Motivo**: Descrição dos danos
- 🏠 **Casa**: Nome da propriedade
- 🔑 **Reserva**: ID da reserva

## Banco de Dados

Campo `captured_amount` armazena o valor capturado:

```sql
SELECT 
  booking_id,
  amount / 100.0 as deposit_total,
  captured_amount / 100.0 as deposit_captured,
  (amount - captured_amount) / 100.0 as deposit_released
FROM deposit_holds
WHERE status = 'CAPTURED';
```

## Casos de Uso

### 1. Dano Pequeno
- **Caução**: R$ 1.000
- **Dano**: Copo quebrado = R$ 50
- **Ação**: Captura R$ 50, libera R$ 950

### 2. Dano Médio
- **Caução**: R$ 1.000
- **Dano**: Toalha manchada = R$ 300
- **Ação**: Captura R$ 300, libera R$ 700

### 3. Dano Total
- **Caução**: R$ 1.000
- **Dano**: Múltiplos danos = R$ 1.000
- **Ação**: Captura R$ 1.000 (total)

### 4. Sem Danos
- **Caução**: R$ 1.000
- **Dano**: Nenhum
- **Ação**: **Liberar** (não capturar)

## Diferença: Capturar vs Liberar

### 🔒 **Capturar**
- Cobra do cartão do cliente
- Use quando houver danos
- Pode ser parcial ou total
- Status final: `CAPTURED`

### 🔓 **Liberar**
- NÃO cobra do cliente
- Use quando NÃO houver danos
- Sempre libera o valor total
- Status final: `RELEASED`

## Importante

⚠️ **Após capturar (parcial ou total), não é possível liberar!**
⚠️ **Após liberar, não é possível capturar!**
⚠️ **Escolha com cuidado antes de executar a ação!**

---

**Deploy**: Já está no ar em produção! 🎉
