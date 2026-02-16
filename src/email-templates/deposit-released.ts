/**
 * Deposit Released Email Template
 * Sent when deposit pre-authorization is released (no damages)
 */

import { EMAIL_CONFIG, getEmailBaseStyles, getEmailFooter } from '../config/email-config';

export interface DepositReleasedEmailData {
  guestName: string;
  houseName: string;
  bookingId: string;
  depositAmount: number;
}

export function generateDepositReleasedEmail(data: DepositReleasedEmailData): string {
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
          <h1>✅ Caução Liberada</h1>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.guestName}</strong>!</p>
          
          <p>Obrigado por escolher o <strong>Ibirahill</strong> para sua estadia na <strong>${data.houseName}</strong>!</p>
          
          <div class="badge badge-paid">
            ${EMAIL_CONFIG.BADGES.DEPOSIT_RELEASED.text}
          </div>
          
          <p>Temos boas notícias! A caução da sua reserva foi liberada com sucesso. 🎉</p>
          
          <table class="info-table">
            <tr>
              <td class="label">Código da Reserva:</td>
              <td>${data.bookingId}</td>
            </tr>
            <tr>
              <td class="label">Casa:</td>
              <td>${data.houseName}</td>
            </tr>
            <tr>
              <td class="label">Valor da Caução:</td>
              <td>R$ ${data.depositAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr style="background-color: ${EMAIL_CONFIG.COLORS.bg_light};">
              <td class="label"><strong>Status:</strong></td>
              <td><strong style="color: ${EMAIL_CONFIG.COLORS.success};">LIBERADA</strong></td>
            </tr>
          </table>
          
          <div class="info-box">
            <strong>✅ O que isso significa?</strong><br>
            A pré-autorização de R$ ${data.depositAmount.toFixed(2).replace('.', ',')} foi cancelada no seu cartão. 
            O valor que estava reservado será liberado automaticamente pela sua operadora de cartão em até 5-7 dias úteis.
          </div>
          
          <p><strong>Por que a caução foi liberada?</strong></p>
          <ul>
            <li>✅ Você deixou a propriedade em perfeitas condições</li>
            <li>✅ Não foram identificados danos ou violações</li>
            <li>✅ Todas as regras da casa foram respeitadas</li>
          </ul>
          
          <div class="info-box" style="background-color: #D1FAE5; border-left-color: ${EMAIL_CONFIG.COLORS.success};">
            <strong>💚 Obrigado pela sua estadia!</strong><br>
            Esperamos recebê-lo novamente em breve no Ibirahill. Sua confiança e cuidado com nossas 
            propriedades fazem toda a diferença!
          </div>
          
          <p style="margin-top: 30px; color: ${EMAIL_CONFIG.COLORS.text_secondary};">
            <strong>Quer fazer uma nova reserva?</strong><br>
            Visite nosso site ou entre em contato:<br>
            📧 ${EMAIL_CONFIG.CONTACT.email} | 📞 ${EMAIL_CONFIG.CONTACT.phone}
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
