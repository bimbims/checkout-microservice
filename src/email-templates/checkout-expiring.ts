/**
 * Checkout Expiring Soon Email Template
 * Sent 2 hours before checkout link expires
 */

import { EMAIL_CONFIG, getEmailBaseStyles, getEmailFooter } from '../config/email-config';

export interface CheckoutExpiringEmailData {
  guestName: string;
  houseName: string;
  checkoutUrl: string;
  expiresAt: string;
}

export function generateCheckoutExpiringEmail(data: CheckoutExpiringEmailData): string {
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
          <h1>⏰ Lembrete: Link Expira em Breve</h1>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.guestName}</strong>,</p>
          
          <p>Este é um lembrete de que o link de pagamento da sua reserva na <strong>${data.houseName}</strong> expira em breve.</p>
          
          <div class="warning-box">
            <strong>⚠️ ATENÇÃO:</strong><br>
            Seu link de pagamento expira em:<br>
            <span style="font-size: 20px; color: ${EMAIL_CONFIG.COLORS.warning}; font-weight: bold;">${expiryFormatted}</span>
          </div>
          
          <p>Para garantir sua reserva, complete o pagamento o quanto antes:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.checkoutUrl}" class="button">
              💳 PAGAR AGORA
            </a>
          </div>
          
          <div class="info-box">
            <strong>ℹ️ Por que meu link expira?</strong><br>
            Para garantir a disponibilidade das propriedades para outros hóspedes, os links de pagamento 
            têm validade de 12 horas. Após esse período, será necessário solicitar um novo link.
          </div>
          
          <p><strong>O que fazer se meu link expirar?</strong></p>
          <ul>
            <li>Entre em contato conosco para solicitar um novo link</li>
            <li>📧 ${EMAIL_CONFIG.CONTACT.email}</li>
            <li>📞 ${EMAIL_CONFIG.CONTACT.phone}</li>
          </ul>
          
          <p style="margin-top: 30px; color: ${EMAIL_CONFIG.COLORS.text_secondary};">
            <strong>Precisa de ajuda?</strong> Estamos à disposição!<br>
            📧 ${EMAIL_CONFIG.CONTACT.email} | 📞 ${EMAIL_CONFIG.CONTACT.phone}
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
