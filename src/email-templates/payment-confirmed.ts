/**
 * Payment Confirmed Email Template
 * Sent when payment is successfully processed
 */

import { EMAIL_CONFIG, getEmailBaseStyles, getEmailFooter } from '../config/email-config';

export interface PaymentConfirmedEmailData {
  guestName: string;
  houseName: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  depositAmount: number;
}

export function generatePaymentConfirmedEmail(data: PaymentConfirmedEmailData): string {
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
          <h1>✅ Pagamento Confirmado!</h1>
        </div>
        
        <div class="content">
          <p>Parabéns <strong>${data.guestName}</strong>! 🎉</p>
          
          <p>Seu pagamento foi confirmado com sucesso! Sua reserva na <strong>${data.houseName}</strong> está garantida.</p>
          
          <div class="badge badge-paid">
            ${EMAIL_CONFIG.BADGES.PAID.text}
          </div>
          
          <h3>📋 Detalhes da Reserva</h3>
          <table class="info-table">
            <tr>
              <td class="label">Código da Reserva:</td>
              <td><strong>${data.bookingId}</strong></td>
            </tr>
            <tr>
              <td class="label">Casa:</td>
              <td>${data.houseName}</td>
            </tr>
            <tr>
              <td class="label">Check-in:</td>
              <td>${new Date(data.checkIn).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td class="label">Check-out:</td>
              <td>${new Date(data.checkOut).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td class="label">Valor Pago:</td>
              <td>R$ ${data.totalPrice.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr>
              <td class="label">Caução Reservada:</td>
              <td>R$ ${data.depositAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
          </table>
          
          <div class="info-box">
            <strong>✅ Status do Pagamento:</strong><br>
            • Pagamento da estadia: <strong>CONFIRMADO</strong><br>
            • Caução de R$ ${data.depositAmount.toFixed(2).replace('.', ',')}: <strong>PRÉ-AUTORIZADA</strong> (será liberada após checkout)
          </div>
          
          <h3>🏠 Próximos Passos</h3>
          <ul>
            <li>✅ Pagamento confirmado (você está aqui)</li>
            <li>📧 Em breve você receberá as instruções de acesso</li>
            <li>🗓️ Aguardamos você no dia ${new Date(data.checkIn).toLocaleDateString('pt-BR')}</li>
            <li>🏡 Aproveite sua estadia no Ibirahill!</li>
          </ul>
          
          <div class="info-box">
            <strong>ℹ️ Sobre a Caução:</strong><br>
            O valor de R$ ${data.depositAmount.toFixed(2).replace('.', ',')} foi pré-autorizado no seu cartão como garantia. 
            Este valor será automaticamente liberado após o checkout, desde que não haja danos à propriedade.
          </div>
          
          <p style="margin-top: 30px; color: ${EMAIL_CONFIG.COLORS.text_secondary};">
            <strong>Dúvidas?</strong> Estamos aqui para ajudar:<br>
            📧 ${EMAIL_CONFIG.CONTACT.email} | 📞 ${EMAIL_CONFIG.CONTACT.phone}
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
