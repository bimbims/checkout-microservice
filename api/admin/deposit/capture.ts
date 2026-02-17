import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const PAGBANK_API_URL = process.env.PAGBANK_SANDBOX === 'true'
  ? 'https://sandbox.api.pagseguro.com'
  : 'https://api.pagseguro.com';

const PAGBANK_API_TOKEN = process.env.PAGBANK_API_TOKEN!;

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
    const { depositId, amount: captureAmount } = req.body;

    if (!depositId) {
      return res.status(400).json({ error: 'depositId é obrigatório' });
    }

    // Get deposit hold
    const { data: deposit, error: depositError } = await supabase
      .from('deposit_holds')
      .select('*')
      .eq('id', depositId)
      .single();

    if (depositError || !deposit) {
      return res.status(404).json({ error: 'Depósito não encontrado' });
    }

    // Check if deposit is in authorized status
    if (deposit.status !== 'AUTHORIZED') {
      return res.status(400).json({
        error: 'Depósito não pode ser capturado',
        details: `Status atual: ${deposit.status}`,
      });
    }

    // Determine amount to capture (partial or full)
    const fullDepositAmount = deposit.amount; // Already in cents from database
    const amountToCapture = captureAmount 
      ? Math.round(captureAmount * 100) // Convert BRL to cents
      : fullDepositAmount; // Capture full amount if not specified

    // Validate capture amount
    if (amountToCapture > fullDepositAmount) {
      return res.status(400).json({
        error: 'Valor de captura inválido',
        details: `Valor máximo permitido: R$ ${(fullDepositAmount / 100).toFixed(2)}`,
      });
    }

    if (amountToCapture <= 0) {
      return res.status(400).json({
        error: 'Valor de captura inválido',
        details: 'O valor deve ser maior que zero',
      });
    }

    console.log('[CAPTURE] Capturing deposit:', {
      depositId,
      fullAmount: fullDepositAmount / 100,
      captureAmount: amountToCapture / 100,
      isPartial: amountToCapture < fullDepositAmount,
    });

    // Capture the pre-authorization in PagBank
    let captureResponse;
    try {
      captureResponse = await axios.post(
        `${PAGBANK_API_URL}/charges/${deposit.pagbank_charge_id}/capture`,
        {
          amount: {
            value: amountToCapture, // Amount already in cents
          },
        },
        {
          headers: {
            Authorization: `Bearer ${PAGBANK_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('[CAPTURE] PagBank capture successful:', {
        chargeId: deposit.pagbank_charge_id,
        capturedAmount: amountToCapture / 100,
      });
    } catch (pagbankError: any) {
      console.error('[CAPTURE] PagBank capture error:', pagbankError.response?.data || pagbankError);
      return res.status(500).json({
        error: 'Erro ao capturar no PagBank',
        details: pagbankError.response?.data?.message || 'Erro desconhecido',
      });
    }

    // Update deposit status
    const { error: updateError } = await supabase
      .from('deposit_holds')
      .update({
        status: 'CAPTURED',
        captured_at: new Date().toISOString(),
        captured_amount: amountToCapture, // Store in cents
      })
      .eq('id', depositId);

    if (updateError) {
      console.error('[CAPTURE] Error updating deposit:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar depósito' });
    }

    console.log('[CAPTURE] Deposit updated successfully');

    // Log action
    await supabase.from('payment_logs').insert({
      booking_id: deposit.booking_id,
      action: 'DEPOSIT_CAPTURED',
      details: {
        depositId,
        chargeId: deposit.pagbank_charge_id,
        fullDepositAmount: fullDepositAmount / 100,
        capturedAmount: amountToCapture / 100,
        isPartialCapture: amountToCapture < fullDepositAmount,
        captureResponse: captureResponse.data,
      },
    });

    // TODO: Send email notification
    // Email sending temporarily disabled to fix deployment issues
    console.log('[CAPTURE] Deposit captured successfully:', depositId, 'Amount:', amountToCapture / 100);

    return res.status(200).json({
      success: true,
      message: amountToCapture < fullDepositAmount 
        ? `Captura parcial realizada: R$ ${(amountToCapture / 100).toFixed(2)} de R$ ${(fullDepositAmount / 100).toFixed(2)}`
        : 'Caução capturada integralmente com sucesso',
      depositId,
      status: 'CAPTURED',
      fullAmount: fullDepositAmount / 100,
      capturedAmount: amountToCapture / 100,
      remainingAmount: (fullDepositAmount - amountToCapture) / 100,
      isPartialCapture: amountToCapture < fullDepositAmount,
    });
  } catch (error) {
    console.error('Capture deposit error:', error);
    return res.status(500).json({
      error: 'Erro ao capturar caução',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
