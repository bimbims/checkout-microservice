# 🧪 SANDBOX Mode - Important Information

## QR Code PIX em Sandbox

⚠️ **O QR Code gerado no ambiente SANDBOX NÃO FUNCIONA em apps bancários reais!**

### Por que não funciona?

O PagBank Sandbox é um ambiente de **testes isolado**. Os QR Codes gerados são "falsos" e servem apenas para:
- Testar a integração da API
- Verificar se os dados estão sendo enviados corretamente
- Simular fluxos de pagamento

### Como testar pagamentos PIX em Sandbox?

Para simular um pagamento PIX no sandbox, você deve:

1. **Usar a API de Webhook do PagBank**: Configure um webhook e envie manualmente uma notificação simulando pagamento aprovado

2. **Usar o Painel do PagBank Sandbox**: No painel administrativo, você pode marcar pagamentos como "pagos" manualmente

3. **Aguardar Produção**: Para testar com QR codes reais, use:
   ```
   PAGBANK_SANDBOX=false
   PAGBANK_TOKEN=<token de produção>
   ```

### Como saber que está em Sandbox?

Verifique a variável de ambiente:
```bash
PAGBANK_SANDBOX=true  # Ambiente de testes (QR codes não funcionam em apps)
PAGBANK_SANDBOX=false # Produção (QR codes funcionam normalmente)
```

### URLs dos ambientes

**Sandbox (Testes)**:
- API: `https://sandbox.api.pagseguro.com`
- QR Code: Não scaneia em apps bancários
- Email: deve usar `@sandbox.test` domínio

**Produção**:
- API: `https://api.pagseguro.com`
- QR Code: Funciona em qualquer app bancário com PIX
- Email: deve usar email real do cliente

## Valores em Centavos

A API do PagBank trabalha com valores em **centavos**:
- R$ 100,00 = 10000 centavos
- R$ 1.500,00 = 150000 centavos

Exemplo:
```javascript
deposit_amount: 1000    // R$ 1.000,00 (será convertido para 100000 centavos)
stay_amount: 1500       // R$ 1.500,00 (será convertido para 150000 centavos)
```

A API faz a conversão automaticamente ao enviar para o PagBank.

## Testando em Produção

Quando estiver pronto para produção:

1. Configure as variáveis de ambiente:
   ```env
   PAGBANK_SANDBOX=false
   PAGBANK_TOKEN=<seu token de produção>
   ```

2. Remova emails `@sandbox.test` - use emails reais

3. QR Codes agora funcionarão em apps bancários reais

4. **ATENÇÃO**: Pagamentos reais serão cobrados!
