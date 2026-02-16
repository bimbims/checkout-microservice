/**
 * Deposit Captured Email Template
 * Sent when deposit is captured due to damages
 */

import { EMAIL_CONFIG, getEmailBaseStyles, getEmailFooter } from '../config/email-config';

export interface DepositCapturedEmailData {
  guestName: string;
  houseName: string;
  bookingId: string;
  depositAmount: number;
  damageReason?: string;
}

export function generateDepositCapturedEmail(data: DepositCapturedEmailData): string {
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
          <h1>⚠️ Caução Cobrada</h1>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.guestName}</strong>,</p>
          
          <p>Informamos que a caução da sua reserva na <strong>${data.houseName}</strong> foi cobrada.</p>
          
          <div class="badge" style="background-color: ${EMAIL_CONFIG.BADGES.DEPOSIT_CAPTURED.bg}; color: ${EMAIL_CONFIG.BADGES.DEPOSIT_CAPTURED.color};">
            ${EMAIL_CONFIG.BADGES.DEPOSIT_CAPTURED.text}
          </div>
          
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
              <td class="label">Valor Cobrado:</td>
              <td>R$ ${data.depositAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
            <tr style="background-color: #FEE2E2;">
              <td class="label"><strong>Status:</strong></td>
              <td><strong style="color: ${EMAIL_CONFIG.COLORS.danger};">COBRADA</strong></td>
            </tr>
          </table>
          
          <div class="warning-box">
            <strong>⚠️ Motivo da Cobrança:</strong><br>
            ${data.damageReason || 'Foram identificados danos à propriedade durante a vistoria pós-checkout.'}
          </div>
          
          <div class="info-box">
            <strong>ℹ️ O que isso significa?</strong><br>
            A pré-autorização de R$ ${data.depositAmount.toFixed(2).replace('.', ',')} que estava reservada no seu cartão 
            foi convertida em cobrança efetiva. O valor será debitado na fatura do seu cartão.
          </div>
          
          <p><strong>Por que a caução foi cobrada?</strong></p>
          <ul>
            <li>Foram identificados danos à propriedade, equipamentos ou móveis</li>
            <li>O valor da caução será utilizado para cobrir os custos de reparo/reposição</li>
            <li>Caso os custos excedam o valor da caução, entraremos em contato</li>
          </ul>
          
          <div class="info-box">
            <strong>❓ Tem dúvidas ou discorda desta cobrança?</strong><br>
            Se você acredita que houve algum erro ou gostaria de mais detalhes sobre os danos identificados, 
            entre em contato conosco. Estamos à disposição para esclarecer e, se necessário, fornecer evidências fotográficas.
          </div>
          
          <p style="margin-top: 30px; color: ${EMAIL_CONFIG.COLORS.text_secondary};">
            <strong>Entre em contato:</strong><br>
            📧 ${EMAIL_CONFIG.CONTACT.email}<br>
            📞 ${EMAIL_CONFIG.CONTACT.phone}
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}
