import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { addHoursFromNow } from '../../utils/timezone';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Fetch default deposit amount from system settings
 * CRITICAL: Must be configured in database - no fallback
 */
async function getDefaultDepositAmount(): Promise<number> {
  try {
    console.log('[getDefaultDepositAmount] Fetching from system_settings...');
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'deposit_amount')
      .single();

    if (error) {
      console.error('[getDefaultDepositAmount] Database error:', error);
      throw new Error('Failed to fetch deposit amount from database');
    }

    if (!data || !data.value || !data.value.amount) {
      console.error('[getDefaultDepositAmount] deposit_amount not configured in system_settings');
      throw new Error('deposit_amount not configured in database');
    }

    // Value is stored in cents, convert to reais
    const amountInCents = data.value.amount;
    const amountInReais = amountInCents / 100;
    
    console.log(`[getDefaultDepositAmount] ✅ Loaded from settings: R$ ${amountInReais.toFixed(2)} (${amountInCents} cents)`);
    return amountInReais;
  } catch (err) {
    console.error('[getDefaultDepositAmount] CRITICAL ERROR:', err);
    throw err; // No fallback - must be configured
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Return system settings (deposit amount)
  if (req.method === 'GET') {
    console.log('[generate-checkout] GET request for settings');
    try {
      const depositAmountReais = await getDefaultDepositAmount();
      const depositAmountCents = Math.round(depositAmountReais * 100);
      
      return res.status(200).json({
        success: true,
        depositAmount: depositAmountReais,
        depositAmountCents: depositAmountCents,
        depositAmountDisplay: `R$ ${depositAmountReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    } catch (error) {
      console.error('[generate-checkout] Error fetching settings:', error);
      return res.status(500).json({
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
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
      let finalDepositAmountReais = deposit_amount;
      if (!finalDepositAmountReais) {
        finalDepositAmountReais = await getDefaultDepositAmount();
        console.log(`[generate-checkout] Using deposit amount from settings: R$ ${finalDepositAmountReais.toFixed(2)}`);
      } else {
        // Validate deposit_amount: should be in reais (e.g., 800 not 80000)
        // If value seems too large, assume it's in cents and convert to reais
        if (finalDepositAmountReais > 10000) {
          console.warn(`[generate-checkout] deposit_amount looks like cents (${finalDepositAmountReais}), converting to reais`);
          finalDepositAmountReais = finalDepositAmountReais / 100;
        }
        console.log(`[generate-checkout] Using deposit amount from request: R$ ${finalDepositAmountReais.toFixed(2)}`);
      }
      
      // Convert to cents for storage (database stores in cents)
      const finalDepositAmount = Math.round(finalDepositAmountReais * 100);
      console.log(`[generate-checkout] Final deposit amount to save: ${finalDepositAmount} cents (R$ ${(finalDepositAmount/100).toFixed(2)})`);
      const totalAmount = finalStayAmount + finalDepositAmount;
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

    // Set expiration to 12 hours from now (Brazilian timezone)
    const expiresAt = addHoursFromNow(12);

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
      depositAmount: finalDepositAmount, // In cents
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
