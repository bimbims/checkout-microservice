// Booking data from main system
export interface Booking {
  id: string; // REQ-{timestamp}
  house_id: string;
  house_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guest_counts: {
    adults: number;
    children: number;
    infants: number;
  };
  total_price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}

// Checkout session
export interface CheckoutSession {
  id: string;
  booking_id: string;
  token: string; // CHK-{bookingId}-{hash}
  stay_amount: number;
  deposit_amount: number;
  total_amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Transaction records
export interface Transaction {
  id: string;
  checkout_session_id: string;
  booking_id: string;
  type: 'STAY_PAYMENT' | 'DEPOSIT_PREAUTH';
  payment_method: 'PIX' | 'CREDIT_CARD';
  amount: number;
  pagbank_charge_id: string;
  pagbank_status: string;
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Deposit management
export interface DepositHold {
  id: string;
  booking_id: string;
  transaction_id: string;
  amount: number;
  pagbank_charge_id: string;
  status: 'AUTHORIZED' | 'RELEASED' | 'CAPTURED' | 'EXPIRED';
  authorized_at: string;
  released_at?: string;
  captured_at?: string;
  captured_amount?: number;
  notes?: string;
  house_name?: string;
  created_at?: string;
}

// PagBank API types
export interface PagBankCharge {
  id: string;
  reference_id: string;
  status: 'AUTHORIZED' | 'PAID' | 'DECLINED' | 'CANCELED';
  amount: {
    value: number;
    currency: string;
  };
  payment_method: {
    type: 'CREDIT_CARD' | 'PIX';
    card?: {
      holder: string;
      last_digits: string;
      brand: string;
    };
  };
  links: Array<{
    rel: string;
    href: string;
    media?: string;
  }>;
}

export interface PagBankCreateChargeRequest {
  reference_id: string;
  amount: {
    value: number;
    currency: string;
  };
  payment_method: {
    type: 'CREDIT_CARD' | 'PIX';
    installments?: number;
    capture?: boolean;
    card?: {
      encrypted: string;
      security_code: string;
      holder: {
        name: string;
      };
    };
  };
  notification_urls?: string[];
}

// Webhook payload
export interface PagBankWebhookPayload {
  id: string;
  reference_id: string;
  charges: PagBankCharge[];
  created_at: string;
}

// Email templates
export interface CheckoutEmailData {
  guestName: string;
  guestEmail: string;
  bookingId: string;
  houseName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  checkoutUrl?: string;
  expiresAt?: string;
  transactionId?: string;
  depositAmount?: number;
}

// Payment logs
export interface PaymentLog {
  id: string;
  booking_id: string;
  event_type: 'CHECKOUT_CREATED' | 'PAYMENT_INITIATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'WEBHOOK_RECEIVED' | 'EXPIRATION' | 'ADMIN_ACTION';
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Payment form data
export interface PaymentData {
  stayMethod: 'PIX' | 'CREDIT_CARD';
  depositCardData: {
    holderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    encryptedCard: string;
  };
  stayCardData?: {
    holderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    encryptedCard: string;
  };
}

// API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
