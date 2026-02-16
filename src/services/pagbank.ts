import axios from 'axios';
import type { PagBankCharge, PagBankCreateChargeRequest } from '../types';

const PAGBANK_API_URL = import.meta.env.VITE_PAGBANK_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

const PAGBANK_TOKEN = import.meta.env.VITE_PAGBANK_TOKEN;

if (!PAGBANK_TOKEN) {
  console.warn('PagBank token not configured');
}

class PagBankService {
  private apiUrl: string;
  private token: string;

  constructor() {
    this.apiUrl = PAGBANK_API_URL;
    this.token = PAGBANK_TOKEN;
  }

  /**
   * Create a PIX charge
   */
  async createPixCharge(
    amount: number,
    referenceId: string
  ): Promise<PagBankCharge> {
    const payload: PagBankCreateChargeRequest = {
      reference_id: referenceId,
      amount: {
        value: Math.round(amount * 100), // Convert to cents
        currency: 'BRL',
      },
      payment_method: {
        type: 'PIX',
      },
      notification_urls: [
        `${window.location.origin}/api/webhooks/pagbank`,
      ],
    };

    const response = await axios.post<PagBankCharge>(
      `${this.apiUrl}/charges`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Create a credit card charge (with optional pre-auth)
   */
  async createCreditCardCharge(
    amount: number,
    referenceId: string,
    encryptedCard: string,
    cvv: string,
    holderName: string,
    capture: boolean = true
  ): Promise<PagBankCharge> {
    const payload: PagBankCreateChargeRequest = {
      reference_id: referenceId,
      amount: {
        value: Math.round(amount * 100),
        currency: 'BRL',
      },
      payment_method: {
        type: 'CREDIT_CARD',
        installments: 1,
        capture, // false = pre-auth only
        card: {
          encrypted: encryptedCard,
          security_code: cvv,
          holder: {
            name: holderName,
          },
        },
      },
      notification_urls: [
        `${window.location.origin}/api/webhooks/pagbank`,
      ],
    };

    const response = await axios.post<PagBankCharge>(
      `${this.apiUrl}/charges`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Capture a pre-authorized charge (e.g., deposit)
   */
  async captureCharge(chargeId: string, amount?: number): Promise<void> {
    const payload = amount
      ? {
          amount: {
            value: Math.round(amount * 100),
            currency: 'BRL',
          },
        }
      : {};

    await axios.post(
      `${this.apiUrl}/charges/${chargeId}/capture`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      }
    );
  }

  /**
   * Cancel/release a pre-authorized charge
   */
  async cancelCharge(chargeId: string): Promise<void> {
    await axios.post(
      `${this.apiUrl}/charges/${chargeId}/cancel`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      }
    );
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<PagBankCharge> {
    const response = await axios.get<PagBankCharge>(
      `${this.apiUrl}/charges/${chargeId}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Encrypt card data using PagBank SDK (call from frontend)
   */
  static async encryptCard(
    cardNumber: string,
    expiryMonth: string,
    expiryYear: string,
    holderName?: string
  ): Promise<string> {
    console.log('[PagBankService] Encrypting card...');
    // @ts-ignore - PagSeguro SDK is loaded via script tag
    console.log('[PagBankService] SDK available:', typeof PagSeguro !== 'undefined');
    console.log('[PagBankService] Token available:', !!PAGBANK_TOKEN);
    console.log('[PagBankService] Card number length:', cardNumber.length);
    console.log('[PagBankService] Expiry:', expiryMonth + '/' + expiryYear);
    console.log('[PagBankService] Holder:', holderName || 'NOT PROVIDED');
    
    // @ts-ignore - PagSeguro SDK is loaded via script tag
    if (typeof PagSeguro === 'undefined') {
      console.error('[PagBankService] PagBank SDK not loaded!');
      throw new Error('PagBank SDK not loaded');
    }

    try {
      // @ts-ignore
      const card = PagSeguro.encryptCard({
        publicKey: PAGBANK_TOKEN,
        holder: holderName || 'CARD HOLDER',
        number: cardNumber.replace(/\s/g, ''),
        expMonth: expiryMonth,
        expYear: expiryYear,
      });

      console.log('[PagBankService] Encryption result:', card);
      console.log('[PagBankService] Encryption result keys:', Object.keys(card || {}));
      console.log('[PagBankService] Encryption result stringified:', JSON.stringify(card, null, 2));
      console.log('[PagBankService] Has encryptedCard:', 'encryptedCard' in (card || {}));
      console.log('[PagBankService] Encrypted card value:', card?.encryptedCard);
      
      if (!card || !card.encryptedCard) {
        console.error('[PagBankService] SDK returned invalid data');
        throw new Error('Criptografia falhou - SDK não retornou dados criptografados');
      }

      return card.encryptedCard;
    } catch (error) {
      console.error('[PagBankService] Card encryption error:', error);
      throw new Error('Falha ao criptografar cartão');
    }
  }
}

const pagBankServiceInstance = new PagBankService();
export default pagBankServiceInstance;
export { PagBankService };
