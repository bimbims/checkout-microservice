/**
 * Email Service for Checkout Microservice
 * Uses Resend API (same as main system)
 */

const FROM_EMAIL = process.env.FROM_EMAIL || 'Ibirahill <onboarding@resend.dev>';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  /**
   * Send email via Resend API
   */
  static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('[EmailService] RESEND_API_KEY not configured');
      // In development, just log instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('[EmailService] DEV MODE - Email would be sent:', {
          to: options.to,
          subject: options.subject,
          htmlLength: options.html.length,
        });
        return true;
      }
      throw new Error('RESEND_API_KEY not configured');
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[EmailService] Resend API error:', errorData);
        throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('[EmailService] Email sent successfully:', data.id);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      throw error;
    }
  }
}
