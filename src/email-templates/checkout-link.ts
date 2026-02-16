/**
 * Checkout Link Sent Email Template
 * Sent when checkout link is generated and sent to client
 */

import { EMAIL_CONFIG, getEmailBaseStyles, getEmailFooter } from '../config/email-config';

export interface CheckoutLinkEmailData {
  guestName: string;
  houseName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  depositAmount: number;
  checkoutUrl: string;
  expiresAt: string;
}

export function generateCheckoutLinkEmail(data: CheckoutLinkEmailData): string {
  const expiryDate = new Date(data.expiresAt);
  const expiryFormatted = expiryDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
          <h1>💳 Link de Pagamento</h1>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.guestName}</strong>! 🎉</p>
          
          <p>Sua reserva na <strong>${data.houseName}</strong> foi aprovada pelo Ibirahill!</p>
          
          <p>Para confirmar sua estadia, complete o pagamento em até <strong>12 horas</strong>.</p>
          
          <div class="badge badge-pending">
            ${EMAIL_CONFIG.BADGES.PAYMENT_PENDING.text}
          </div>
          
          <h3>📅 Detalhes da Reserva</h3>
          <table class="info-table">
            <tr>
              <td class="label">Casa:</td>
              <td>${data.houseName}</td>
            </tr>
            <tr>
              <td class="label">Check-in:</td>
              <td>${new Date(data.checkIn).toLocaleDateString('pt-BR')}</td>
            </tr>
            <tr>
              <td class="label">Check-out:</td>
              <td>${new Date(data.checkOut).toLocaleDateString('pt-BR')}</td>
            </tr>
            <tr>
              <td class="label">Valor da Estadia:</td>
              <td>R$ ${data.totalPrice.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr>
              <td class="label">Caução (Pré-autorização):</td>
              <td>R$ ${data.depositAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr style="background-color: ${EMAIL_CONFIG.COLORS.bg_light};">
              <td class="label"><strong>Total:</strong></td>
              <td><strong>R$ ${(data.totalPrice + data.depositAmount).toFixed(2).replace('.', ',')}</strong></td>
            </tr>
          </table>
          
          <div class="warning-box">
            <strong>⏰ Este link expira em:</strong><br>
            <span style="font-size: 18px; color: ${EMAIL_CONFIG.COLORS.warning};">${expiryFormatted}</span>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.checkoutUrl}" class="button">
              💳 PAGAR AGORA
            </a>
          </div>
          
          <div class="info-box">
            <strong>ℹ️ Sobre a Caução de R$ ${data.depositAmount.toFixed(2).replace('.', ',')}:</strong><br>
            Este é um valor de <strong>pré-autorização</strong> que será reservado no seu cartão, mas <strong>NÃO será cobrado</strong>. 
            Serve como garantia de segurança e será automaticamente liberado após o checkout, desde que não haja danos à propriedade.
          </div>
          
          <h3>Como Pagar</h3>
          <ul>
            <li>💳 <strong>PIX ou Cartão</strong> para o valor da estadia</li>
            <li>💳 <strong>Cartão (pré-autorização)</strong> para a caução</li>
            <li>🔒 Pagamento 100% seguro via PagBank</li>
          </ul>
          
          <p style="margin-top: 30px; color: ${EMAIL_CONFIG.COLORS.text_secondary};">
            <strong>Dúvidas?</strong> Entre em contato conosco:<br>
            📧 ${EMAIL_CONFIG.CONTACT.email} | 📞 ${EMAIL_CONFIG.CONTACT.phone}
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
