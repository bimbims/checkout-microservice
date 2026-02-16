import { createHash, randomBytes } from 'crypto';
import supabase from './supabase';
import type { CheckoutSession, Booking } from '../types';

class CheckoutGenerator {
  private readonly DEPOSIT_AMOUNT = 1000; // R$ 1,000 fixed deposit
  private readonly EXPIRY_HOURS = 12;

  /**
   * Generate unique checkout token
   */
  private generateToken(bookingId: string): string {
    const hash = createHash('sha256')
      .update(`${bookingId}-${Date.now()}-${randomBytes(8).toString('hex')}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();

    return `CHK-${bookingId}-${hash}`;
  }

  /**
   * Create checkout session for approved booking
   */
  async createCheckoutSession(booking: Booking): Promise<CheckoutSession> {
    const token = this.generateToken(booking.id);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EXPIRY_HOURS);

    const sessionData = {
      booking_id: booking.id,
      token,
      stay_amount: booking.total_price,
      deposit_amount: this.DEPOSIT_AMOUNT,
      total_amount: booking.total_price + this.DEPOSIT_AMOUNT,
      status: 'PENDING',
      expires_at: expiresAt.toISOString(),
    };

    const { data, error } = await supabase
      .from('checkout_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create checkout session:', error);
      throw new Error('Failed to create checkout session');
    }

    // Log creation
    await this.logEvent(booking.id, 'CHECKOUT_CREATED', {
      token,
      expires_at: expiresAt.toISOString(),
      stay_amount: booking.total_price,
      deposit_amount: this.DEPOSIT_AMOUNT,
    });

    return data;
  }

  /**
   * Validate checkout token and check expiration
   */
  async validateToken(token: string): Promise<CheckoutSession | null> {
    const { data, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date() && data.status === 'PENDING') {
      await this.expireSession(data.id);
      return null;
    }

    return data;
  }

  /**
   * Expire checkout session
   */
  async expireSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('checkout_sessions')
      .update({ status: 'EXPIRED' })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to expire session:', error);
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: CheckoutSession['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('checkout_sessions')
      .update({ status })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update session status:', error);
      throw new Error('Failed to update session');
    }
  }

  /**
   * Log payment event
   */
  private async logEvent(
    bookingId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    await supabase.from('payment_logs').insert({
      booking_id: bookingId,
      event_type: eventType,
      details,
    });
  }

  /**
   * Get checkout URL
   */
  getCheckoutUrl(token: string): string {
    const baseUrl = window.location.origin || 'https://checkout.ibirahill.com';
    return `${baseUrl}/checkout/${token}`;
  }
}

export default new CheckoutGenerator();
