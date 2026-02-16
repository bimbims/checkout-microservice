/**
 * Centralized Email Configuration for Checkout Microservice
 * Matches the styling and structure of the main Ibirahill system
 */

export const EMAIL_CONFIG = {
  // Contact Information
  CONTACT: {
    email: "contato@ibirahill.com",
    phone: "+55 (48) 99171-2500",
    phone_display: "(48) 99171-2500",
    company_name: "Ibirahill",
  },

  // Email Subjects
  SUBJECTS: {
    CHECKOUT_LINK: "💳 Link de Pagamento - Ibirahill",
    PAYMENT_CONFIRMED: "✓ Pagamento Confirmado - Sua Reserva está Garantida!",
    CHECKOUT_EXPIRING: "⏰ Lembrete: Link de Pagamento Expira em Breve",
    DEPOSIT_RELEASED: "✅ Caução Liberada - Ibirahill",
    DEPOSIT_CAPTURED: "⚠️ Caução Cobrada - Ibirahill",
    PAYMENT_FAILED: "❌ Erro no Pagamento - Ibirahill",
  },

  // Email Colors & Styling (matching main system)
  COLORS: {
    primary: "#233133", // Ibira green
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    text_primary: "#233133",
    text_secondary: "#6B7280",
    border: "#E5E7EB",
    bg_light: "#F9FAFB",
    beige: "#f4ece1",
  },

  // Badge styles
  BADGES: {
    PAYMENT_PENDING: {
      text: "PAGAMENTO PENDENTE",
      color: "#3B82F6",
      bg: "#DBEAFE",
    },
    PAID: {
      text: "PAGAMENTO CONFIRMADO",
      color: "#10B981",
      bg: "#D1FAE5",
    },
    DEPOSIT_RELEASED: {
      text: "CAUÇÃO LIBERADA",
      color: "#10B981",
      bg: "#D1FAE5",
    },
    DEPOSIT_CAPTURED: {
      text: "CAUÇÃO COBRADA",
      color: "#EF4444",
      bg: "#FEE2E2",
    },
  },

  FOOTER_TEXT: `Este é um email automático. Não responda diretamente a esta mensagem.`,
  FOOTER_CONTACT: `Para mais informações: contato@ibirahill.com | +55 (48) 99171-2500`,
};

/**
 * Email HTML Base Template
 * Provides consistent styling across all emails
 */
export const getEmailBaseStyles = (): string => {
  return `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: ${EMAIL_CONFIG.COLORS.text_primary};
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, ${EMAIL_CONFIG.COLORS.primary} 0%, #2a4a4d 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      .content {
        padding: 30px 20px;
      }
      .footer {
        background-color: ${EMAIL_CONFIG.COLORS.bg_light};
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: ${EMAIL_CONFIG.COLORS.text_secondary};
        border-top: 1px solid ${EMAIL_CONFIG.COLORS.border};
      }
      .badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin: 10px 0;
      }
      .badge-pending {
        background-color: ${EMAIL_CONFIG.BADGES.PAYMENT_PENDING.bg};
        color: ${EMAIL_CONFIG.BADGES.PAYMENT_PENDING.color};
      }
      .badge-paid {
        background-color: ${EMAIL_CONFIG.BADGES.PAID.bg};
        color: ${EMAIL_CONFIG.BADGES.PAID.color};
      }
      .info-box {
        background-color: ${EMAIL_CONFIG.COLORS.bg_light};
        border-left: 4px solid ${EMAIL_CONFIG.COLORS.primary};
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
      }
      .warning-box {
        background-color: #FEF3C7;
        border-left: 4px solid ${EMAIL_CONFIG.COLORS.warning};
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
      }
      .info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      .info-table td {
        padding: 10px;
        border: 1px solid ${EMAIL_CONFIG.COLORS.border};
      }
      .info-table .label {
        font-weight: 600;
        width: 40%;
        background-color: ${EMAIL_CONFIG.COLORS.bg_light};
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background-color: ${EMAIL_CONFIG.COLORS.primary};
        color: white !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 700;
        margin: 15px 0;
        font-size: 16px;
      }
      .button:hover {
        background-color: #1a2526;
      }
      ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      li {
        margin: 8px 0;
      }
      a {
        color: ${EMAIL_CONFIG.COLORS.primary};
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  `;
};

/**
 * Common email footer template
 */
export const getEmailFooter = (): string => {
  return `
    <div class="footer">
      <p style="margin: 0 0 10px 0; font-weight: 600;">${EMAIL_CONFIG.CONTACT.company_name}</p>
      <p style="margin: 5px 0;">📧 ${EMAIL_CONFIG.CONTACT.email} | 📞 ${EMAIL_CONFIG.CONTACT.phone}</p>
      <p style="margin: 10px 0 0 0; color: ${EMAIL_CONFIG.COLORS.text_secondary};">${EMAIL_CONFIG.FOOTER_TEXT}</p>
    </div>
  `;
};
