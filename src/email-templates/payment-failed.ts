/**
 * Payment Failed Email Template
 * Sent when payment processing fails
 */

import { EMAIL_CONFIG, getEmailBaseStyles, getEmailFooter } from '../config/email-config';

export interface PaymentFailedEmailData {
  guestName: string;
  houseName: string;
  checkoutUrl: string;
  errorReason?: string;
}

export function generatePaymentFailedEmail(data: PaymentFailedEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getEmailBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Erro no Pagamento</h1>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.guestName}</strong>,</p>
          
          <p>Infelizmente, não conseguimos processar o pagamento da sua reserva na <strong>${data.houseName}</strong>.</p>
          
          <div class="warning-box">
            <strong>⚠️ Status:</strong> PAGAMENTO NÃO APROVADO<br>
            ${data.errorReason ? `<strong>Motivo:</strong> ${data.errorReason}` : ''}
          </div>
          
          <p><strong>Possíveis causas:</strong></p>
          <ul>
            <li>💳 Cartão sem limite disponível</li>
            <li>🔒 Cartão bloqueado ou expirado</li>
            <li>❌ Dados do cartão incorretos</li>
            <li>🏦 Recusa da operadora do cartão</li>
            <li>🔐 Problemas na autenticação 3D Secure</li>
          </ul>
          
          <div class="info-box">
            <strong>✅ O que fazer agora?</strong><br>
            Você pode tentar novamente usando o mesmo link de pagamento. Certifique-se de:
            <ul>
              <li>Verificar os dados do cartão</li>
              <li>Confirmar limite disponível</li>
              <li>Tentar outro cartão, se preferir</li>
              <li>Escolher PIX como forma de pagamento (aprovação instantânea)</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.checkoutUrl}" class="button">
              🔄 TENTAR NOVAMENTE
            </a>
          </div>
          
          <div class="info-box">
            <strong>💡 Dica:</strong> Se o problema persistir, entre em contato com a operadora do seu cartão 
            para verificar se há algum bloqueio ou restrição para compras online.
          </div>
          
          <p style="margin-top: 30px; color: ${EMAIL_CONFIG.COLORS.text_secondary};">
            <strong>Precisa de ajuda?</strong> Estamos aqui para auxiliar!<br>
            📧 ${EMAIL_CONFIG.CONTACT.email} | 📞 ${EMAIL_CONFIG.CONTACT.phone}
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
