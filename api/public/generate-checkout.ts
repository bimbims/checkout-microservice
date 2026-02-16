import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Fetch default deposit amount from system settings
 * Falls back to R$ 1000.00 if not configured
 */
async function getDefaultDepositAmount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'deposit_amount')
      .single();

    if (error || !data) {
      console.warn('Could not fetch deposit_amount from settings, using default');
      return 1000.00; // Fallback to R$ 1000.00
    }

    // Value is stored in cents, convert to reais
    const amountInCents = data.value.amount || 100000;
    return amountInCents / 100;
  } catch (err) {
    console.error('Error fetching default deposit amount:', err);
    return 1000.00; // Fallback
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Support both formats: { booking: {...} } and { booking_id, booking_data, ... }
    const { booking, booking_id, booking_data, stay_amount, deposit_amount } = req.body;

    // Extract booking ID and data
    const finalBookingId = booking?.id || booking_id;
    const finalBookingData = booking || booking_data;
    
    if (!finalBookingId) {
      return res.status(400).json({ error: 'booking_id or booking.id é obrigatório' });
    }

    // Validate that we have either booking_data or valid booking ID for fetching
    if (!finalBookingData && !/^(REQ|TEST)-\d+$/.test(finalBookingId)) {
      return res.status(400).json({ error: 'Formato de booking_id inválido ou dados da reserva ausentes' });
    }

    const finalStayAmount = stay_amount || booking?.total_price || booking_data?.total_price || 0;
      
      // If deposit_amount is not provided in the request, fetch from system settings
      let finalDepositAmount = deposit_amount;
      if (!finalDepositAmount) {
        finalDepositAmount = await getDefaultDepositAmount();
        console.log(`Using deposit amount from settings: R$ ${finalDepositAmount.toFixed(2)}`);
      }
      

    // Check if checkout session already exists for this booking
    const { data: existingSession } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('booking_id', finalBookingId)
      .eq('status', 'PENDING')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingSession) {
      const baseUrl = 'https://checkout-microservice.vercel.app';
      return res.status(200).json({
        success: true,
        token: existingSession.token,
        url: `${baseUrl}/checkout/${existingSession.token}`,
        checkoutUrl: `${baseUrl}/checkout/${existingSession.token}`,
        expiresAt: existingSession.expires_at,
        stayAmount: existingSession.stay_amount,
        depositAmount: existingSession.deposit_amount,
        totalAmount: existingSession.total_amount,
      });
    }

    // Generate unique token
    const hash = crypto
      .createHash('sha256')
      .update(`${finalBookingId}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);

    const token = `CHK-${hash}`.toUpperCase();

    // Set expiration to 12 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    // Create checkout session
    const { data: session, error } = await supabase
      .from('checkout_sessions')
      .insert({
        token,
        booking_id: finalBookingId,
        stay_amount: finalStayAmount,
        deposit_amount: finalDepositAmount,
        total_amount: totalAmount,
        expires_at: expiresAt.toISOString(),
        status: 'PENDING',
        booking_data: finalBookingData || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }

    // Log creation
    await supabase.from('payment_logs').insert({
      booking_id: finalBookingId,
      event_type: 'CHECKOUT_CREATED',
      details: { token, expiresAt, stayAmount: finalStayAmount, depositAmount: finalDepositAmount },
    });

    const baseUrl = 'https://checkout-microservice.vercel.app';
    return res.status(200).json({
      success: true,
      token: session.token,
      url: `${baseUrl}/checkout/${session.token}`,
      checkoutUrl: `${baseUrl}/checkout/${session.token}`,
      expiresAt: session.expires_at,
      stayAmount: finalStayAmount,
      depositAmount: finalDepositAmount,
      totalAmount: totalAmount,
    });
  } catch (error) {
    console.error('Generate checkout error:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
