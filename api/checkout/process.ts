import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { randomUUID } from 'crypto';

/**
 * PAYMENT PROCESSING ENDPOINT - VERSION 2.0
 * Last updated: 2026-02-16
 * 
 * This endpoint handles both PIX and Credit Card payments for stays,
 * plus optional deposit pre-authorization.
 * 
 * Changes in v2.0:
 * - Deposit card is now optional (not required for PIX-only payments)
 * - UUID-based email generation for guaranteed uniqueness 
 * - Enhanced logging for debugging
 */

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('[PROCESS] Missing Supabase credentials');
}

if (!process.env.PAGBANK_API_TOKEN) {
  console.error('[PROCESS] Missing PagBank API token');
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const IS_SANDBOX = process.env.PAGBANK_SANDBOX === 'true';

const PAGBANK_API_URL = IS_SANDBOX
  ? 'https://sandbox.api.pagseguro.com'
  : 'https://api.pagseguro.com';

// Use different tokens for sandbox vs production
const PAGBANK_API_TOKEN = (IS_SANDBOX 
  ? process.env.PAGBANK_API_TOKEN_SANDBOX 
  : process.env.PAGBANK_API_TOKEN)?.trim() || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[PROCESS] Request received:', req.method);
  console.log('[PROCESS] Version: 2026-02-16-v2 - Deposit optional');
  console.log('[PROCESS] IS_SANDBOX:', IS_SANDBOX);
  console.log('[PROCESS] PAGBANK_API_URL:', PAGBANK_API_URL);
  console.log('[PROCESS] Using token:', PAGBANK_API_TOKEN ? 'Token configured' : 'NO TOKEN!');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[PROCESS] Body received:', JSON.stringify(req.body).substring(0, 200));
    const { token, bookingId, paymentData } = req.body;

    if (!token || !bookingId || !paymentData) {
      console.log('[PROCESS] Missing data - token:', !!token, 'bookingId:', !!bookingId, 'paymentData:', !!paymentData);
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Validate payment data structure
    if (!paymentData.stayMethod) {
      console.log('[PROCESS] Missing stayMethod in paymentData');
      return res.status(400).json({ error: 'Método de pagamento não especificado' });
    }

    if (paymentData.stayMethod === 'CREDIT_CARD' && !paymentData.stayCardData?.encryptedCard) {
      console.log('[PROCESS] Missing encrypted card data for credit card payment');
      return res.status(400).json({ error: 'Dados do cartão não fornecidos' });
    }

    // Deposit card is optional - can be added later or not required for PIX-only payments
    const hasDepositCard = paymentData.depositCardData?.encryptedCard;
    console.log('[PROCESS] Deposit card provided:', hasDepositCard ? 'YES' : 'NO');

    console.log('[PROCESS] Validating session for booking:', bookingId);

    // Validate checkout session
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('token', token)
      .eq('booking_id', bookingId)
      .single();

    if (sessionError || !session) {
      console.log('[PROCESS] Session not found or error:', sessionError?.message);
      return res.status(404).json({ error: 'Sessão de checkout inválida' });
    }

    console.log('[PROCESS] Session found, status:', session.status);

    if (session.status !== 'PENDING') {
      console.log('[PROCESS] Session status is not PENDING:', session.status);
      return res.status(400).json({ error: 'Sessão de checkout não está disponível' });
    }

    // Check expiration
    if (new Date() > new Date(session.expires_at)) {
      console.log('[PROCESS] Session expired');
      await supabase
        .from('checkout_sessions')
        .update({ status: 'EXPIRED' })
        .eq('id', session.id);
      return res.status(410).json({ error: 'Sessão de checkout expirada' });
    }

    // Get booking data from session (cached from approval)
    const booking = session.booking_data;

    if (!booking) {
      console.log('[PROCESS] No booking data in session');
      return res.status(400).json({ error: 'Dados da reserva não encontrados' });
    }

    console.log('[PROCESS] Booking data found for:', booking.guest_name);

    const totalAmount = session.stay_amount;
    const depositAmount = session.deposit_amount;

    console.log('[PROCESS] Amounts - Stay:', totalAmount, 'Deposit:', depositAmount);
    console.log('[PROCESS] Payment method:', paymentData.stayMethod);

    // Sanitize customer data
    const sanitizedTaxId = (booking.guest_document || '').replace(/\D/g, '');
    // Use valid test CPF ONLY if no document provided (required by PagBank API)
    // PRODUCTION: Should always have real CPF from booking
    // SANDBOX: Falls back to valid test CPF '12345678909'
    const validTaxId = sanitizedTaxId.length === 11 ? sanitizedTaxId : '12345678909';
    
    const sanitizedPhone = (booking.guest_phone || '').replace(/\D/g, '');
    const phoneArea = sanitizedPhone.length >= 10 ? sanitizedPhone.substring(0, 2) : '11';
    const phoneNumber = sanitizedPhone.length >= 10 ? sanitizedPhone.substring(2, 11) : '999999999';
    
    // Use real customer data from booking when available
    // PRODUCTION: Should always have real email/name from booking
    // SANDBOX: Always use unique test email to avoid merchant email conflict
    const uniqueId = randomUUID().slice(0, 8); // Use first 8 chars of UUID for shorter email
    const customerEmail = IS_SANDBOX
      ? `buyer-${uniqueId}@sandbox.test` // Always unique in sandbox (e.g., buyer-a1b2c3d4@sandbox.test)
      : (booking.guest_email && booking.guest_email.trim() 
          ? booking.guest_email.trim() 
          : `buyer-${uniqueId}@test.com`); // Fallback for production
      
    const customerName = booking.guest_name && booking.guest_name.trim() 
      ? booking.guest_name.trim() 
      : 'Test Customer';
    
    console.log('[PROCESS] Customer data - Name:', customerName, 'Email:', customerEmail, 'Tax ID:', validTaxId, 'Phone:', `${phoneArea}${phoneNumber}`);

    // Notification URL (opcional - remover se não configurado)
    const notificationUrl = process.env.CHECKOUT_BASE_URL 
      ? `${process.env.CHECKOUT_BASE_URL}/api/webhooks/pagbank`
      : undefined;

    // Process stay payment (PIX or Credit Card)
    let stayChargeId: string | null = null;
    let stayStatus = 'PENDING';
    let pixData: any = null; // Store PIX QR code data
    
    // Generate unique email for stay payment (guaranteed unique with UUID)
    const stayEmail = IS_SANDBOX ? `stay-${randomUUID().slice(0, 8)}@sandbox.test` : customerEmail;
    console.log('[PROCESS] Stay email generated:', stayEmail, 'IS_SANDBOX:', IS_SANDBOX);

    try {
      if (paymentData.stayMethod === 'PIX') {
        console.log('[PROCESS] Processing PIX payment with email:', stayEmail);
        // Create PIX order
        const pixPayload = {
          reference_id: `${bookingId}-STAY`,
          customer: {
            name: customerName,
            email: stayEmail,
            tax_id: validTaxId
          },
          items: [{
            reference_id: `stay-${bookingId}`,
            name: `Estadia ${booking.house_name}`,
            quantity: 1,
            unit_amount: Math.round(totalAmount * 100)
          }],
          qr_codes: [{
            amount: {
              value: Math.round(totalAmount * 100)
            },
            expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          }],
          ...(notificationUrl ? { notification_urls: [notificationUrl] } : {})
        };
        
        console.log('[PROCESS] PIX payload customer email:', pixPayload.customer.email);
        
        const pixResponse = await axios.post(
          `${PAGBANK_API_URL}/orders`,
          pixPayload,
          {
            headers: {
              Authorization: `Bearer ${PAGBANK_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        stayChargeId = pixResponse.data.id;
        stayStatus = 'WAITING_PIX';
        // Store PIX QR code data for frontend
        pixData = pixResponse.data.qr_codes?.[0];
        console.log('[PROCESS] PIX order created:', stayChargeId);
        console.log('[PROCESS] PIX QR Code data:', JSON.stringify(pixData));
        console.log('[PROCESS] PIX QR Code text length:', pixData?.text?.length);
        console.log('[PROCESS] PIX QR Code links:', pixData?.links?.map(l => l.rel));
      } else if (paymentData.stayMethod === 'CREDIT_CARD') {
        console.log('[PROCESS] Processing credit card payment with email:', stayEmail);
        
        const cardPayload = {
          reference_id: `${bookingId}-STAY`,
          customer: {
            name: customerName,
            email: stayEmail,
            tax_id: validTaxId,
            phones: [{
              country: '55',
              area: phoneArea,
              number: phoneNumber,
              type: 'MOBILE'
            }]
          },
          items: [{
            reference_id: `stay-${bookingId}`,
            name: `Estadia ${booking.house_name}`,
            quantity: 1,
            unit_amount: Math.round(totalAmount * 100)
          }],
          charges: [{
            reference_id: `${bookingId}-STAY-CHARGE`,
            description: `Pagamento estadia ${booking.house_name}`,
            amount: {
              value: Math.round(totalAmount * 100),
              currency: 'BRL'
            },
            payment_method: {
              type: 'CREDIT_CARD',
              installments: 1,
              capture: true,
              card: {
                encrypted: paymentData.stayCardData!.encryptedCard
              }
            }
          }],
          ...(notificationUrl ? { notification_urls: [notificationUrl] } : {})
        };
        
        console.log('[PROCESS] Calling PagBank API with payload:', JSON.stringify({
          ...cardPayload,
          charges: cardPayload.charges.map(c => ({
            ...c,
            payment_method: { ...c.payment_method, card: { encrypted: '[REDACTED]' } }
          }))
        }, null, 2));
        console.log('[PROCESS] PagBank URL:', `${PAGBANK_API_URL}/orders`);
        console.log('[PROCESS] Has API Token:', !!PAGBANK_API_TOKEN);
        console.log('[PROCESS] Token length:', PAGBANK_API_TOKEN?.length);
        
        // Create order with credit card payment
        const cardResponse = await axios.post(
          `${PAGBANK_API_URL}/orders`,
          cardPayload,
          {
            headers: {
              Authorization: `Bearer ${PAGBANK_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        stayChargeId = cardResponse.data.id;
        stayStatus = cardResponse.data.charges?.[0]?.status === 'PAID' ? 'PAID' : 'PENDING';
        console.log('[PROCESS] Order created:', stayChargeId, 'Status:', stayStatus);
      }
    } catch (pagbankError: any) {
      console.error('[PROCESS] PagBank API error - Full details:');
      console.error('[PROCESS] Status:', pagbankError.response?.status);
      console.error('[PROCESS] Headers:', JSON.stringify(pagbankError.response?.headers));
      console.error('[PROCESS] Data:', JSON.stringify(pagbankError.response?.data, null, 2));
      console.error('[PROCESS] Message:', pagbankError.message);
      
      const errorDetails = {
        status: pagbankError.response?.status,
        data: pagbankError.response?.data,
        message: pagbankError.message,
        url: pagbankError.config?.url,
        method: pagbankError.config?.method
      };
      
      return res.status(500).json({
        error: 'Erro ao processar pagamento com PagBank',
        pagbankError: errorDetails,
        // Include full error response for debugging
        fullError: pagbankError.response?.data || pagbankError.message
      });
    }

    // Process deposit pre-authorization (Credit Card only, no capture)
    // Only process if deposit card data is provided
    console.log('[PROCESS] Processing deposit pre-authorization');
    let depositChargeId: string | null = null;
    let depositStatus = 'PENDING';
    
    if (!hasDepositCard) {
      console.log('[PROCESS] No deposit card provided - skipping deposit authorization');
      depositStatus = 'SKIPPED';
    } else {
      // Generate unique email for deposit (guaranteed unique with UUID)
      const depositEmail = IS_SANDBOX ? `deposit-${randomUUID().slice(0, 8)}@sandbox.test` : customerEmail;
      console.log('[PROCESS] Deposit email generated:', depositEmail, 'IS_SANDBOX:', IS_SANDBOX);

      try {
        console.log('[PROCESS] Creating deposit order with email:', depositEmail);
        const depositResponse = await axios.post(
        `${PAGBANK_API_URL}/orders`,
        {
          reference_id: `${bookingId}-DEPOSIT`,
          customer: {
            name: customerName,
            email: depositEmail,
            tax_id: validTaxId
          },
          items: [{
            reference_id: `deposit-${bookingId}`,
            name: `Caução ${booking.house_name}`,
            quantity: 1,
            unit_amount: Math.round(depositAmount * 100)
          }],
          charges: [{
            reference_id: `${bookingId}-DEPOSIT-CHARGE`,
            description: `Caução ${booking.house_name}`,
            amount: {
              value: Math.round(depositAmount * 100),
              currency: 'BRL'
            },
            payment_method: {
              type: 'CREDIT_CARD',
              installments: 1,
              capture: false,
              card: {
                encrypted: paymentData.depositCardData.encryptedCard
              }
            }
          }],
          ...(notificationUrl ? { notification_urls: [notificationUrl] } : {})
        },
        {
          headers: {
            Authorization: `Bearer ${PAGBANK_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      depositChargeId = depositResponse.data.id;
      depositStatus = depositResponse.data.charges?.[0]?.status === 'AUTHORIZED' ? 'AUTHORIZED' : 'FAILED';
      console.log('[PROCESS] Deposit order created:', depositChargeId, 'Status:', depositStatus);
      } catch (depositError: any) {
        console.error('[PROCESS] Deposit authorization error:', depositError.response?.data || depositError.message);
        // Don't fail the whole transaction if deposit fails - just log it
        depositStatus = 'FAILED';
      }
    }

    console.log('[PROCESS] Saving transactions to database');

    // Save transactions
    const { data: stayTransaction } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        charge_id: stayChargeId,
        amount: totalAmount,
        type: 'STAY',
        method: paymentData.stayMethod,
        status: stayStatus,
      })
      .select()
      .single();

    console.log('[PROCESS] Stay transaction saved');

    const { data: depositHold } = await supabase
      .from('deposit_holds')
      .insert({
        booking_id: bookingId,
        charge_id: depositChargeId,
        amount: depositAmount,
        status: depositStatus,
        house_name: booking.house_name,
      })
      .select()
      .single();

    console.log('[PROCESS] Deposit hold saved');

    // Update checkout session
    await supabase
      .from('checkout_sessions')
      .update({
        status: 'COMPLETED',
        stay_amount: totalAmount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    console.log('[PROCESS] Checkout session updated to COMPLETED');

    // Log payment
    await supabase.from('payment_logs').insert({
      booking_id: bookingId,
      action: 'PAYMENT_PROCESSED',
      details: {
        stayChargeId,
        depositChargeId,
        stayMethod: paymentData.stayMethod,
        stayStatus,
        depositStatus,
      },
    });

    console.log('[PROCESS] Payment logged');

    // Notify main system (webhook)
    try {
      console.log('[PROCESS] Notifying main system');
      await axios.post(`${process.env.MAIN_APP_URL}/api/webhooks/payment-confirmed`, {
        bookingId,
        stayChargeId,
        depositChargeId,
        stayStatus,
        depositStatus,
        totalAmount,
        depositAmount,
      });
    } catch (webhookError) {
      console.error('[PROCESS] Error notifying main system:', webhookError);
      // Don't fail the request if webhook fails
    }

    // TODO: Send payment confirmed email
    // Temporarily disabled to debug 500 error
    console.log('[PROCESS] Email notification skipped (temporarily disabled for debugging)');

    console.log('[PROCESS] Payment processed successfully');
    console.log('[PROCESS] Final pixData before response:', pixData ? 'PRESENT' : 'NULL');
    console.log('[PROCESS] pixData structure:', pixData ? Object.keys(pixData) : 'no data');

    return res.status(200).json({
      success: true,
      message: 'Pagamento processado com sucesso',
      stayChargeId,
      depositChargeId,
      stayStatus,
      depositStatus,
      // Include PIX QR code data if available
      ...(pixData ? {
        pix: {
          qrCode: pixData.text,
          qrCodeImage: pixData.links?.[0]?.href,
          expirationDate: pixData.expiration_date
        }
      } : {})
    });
  } catch (error: any) {
    console.error('[PROCESS] Critical error:', error);
    console.error('[PROCESS] Error details:', error.message);
    console.error('[PROCESS] Error stack:', error.stack);

    // Log error
    try {
      if (req.body?.bookingId) {
        await supabase.from('payment_logs').insert({
          booking_id: req.body.bookingId,
          action: 'PAYMENT_ERROR',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : null,
          },
        });
      }
    } catch (logError) {
      console.error('[PROCESS] Error logging failed:', logError);
    }

    return res.status(500).json({
      error: 'Erro ao processar pagamento',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
