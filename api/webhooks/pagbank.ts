import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // PagBank webhooks don't require CORS, but we'll add it anyway
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;

    // Log the webhook for debugging
    console.log('PagBank webhook received:', JSON.stringify(notification, null, 2));

    // PagBank sends charge updates with this structure:
    // {
    //   "id": "CHAR_XXXX",
    //   "reference_id": "REQ-123456-STAY" or "REQ-123456-DEPOSIT",
    //   "status": "PAID" | "AUTHORIZED" | "DECLINED" | "CANCELED",
    //   ...
    // }

    const chargeId = notification.id;
    const referenceId = notification.reference_id;
    const status = notification.status;

    if (!chargeId || !referenceId) {
      console.error('Invalid webhook data:', notification);
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Determine if this is a stay payment or deposit
    const isDeposit = referenceId.includes('-DEPOSIT');
    const isStay = referenceId.includes('-STAY');

    if (isDeposit) {
      // Update deposit hold status
      const { data: deposit, error } = await supabase
        .from('deposit_holds')
        .select('*')
        .eq('charge_id', chargeId)
        .single();

      if (error || !deposit) {
        console.error('Deposit not found for charge:', chargeId);
        return res.status(404).json({ error: 'Deposit not found' });
      }

      let newStatus = deposit.status;

      switch (status) {
        case 'AUTHORIZED':
          newStatus = 'AUTHORIZED';
          break;
        case 'PAID':
          newStatus = 'CAPTURED';
          break;
        case 'DECLINED':
        case 'CANCELED':
          newStatus = 'FAILED';
          break;
      }

      await supabase
        .from('deposit_holds')
        .update({ status: newStatus })
        .eq('id', deposit.id);

      await supabase.from('payment_logs').insert({
        booking_id: deposit.booking_id,
        action: 'WEBHOOK_DEPOSIT_UPDATE',
        details: { chargeId, status, newStatus, notification },
      });
    } else if (isStay) {
      // Update stay transaction status
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('charge_id', chargeId)
        .single();

      if (error || !transaction) {
        console.error('Transaction not found for charge:', chargeId);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      let newStatus = transaction.status;

      switch (status) {
        case 'PAID':
          newStatus = 'PAID';
          break;
        case 'AUTHORIZED':
          newStatus = 'AUTHORIZED';
          break;
        case 'WAITING':
          newStatus = 'WAITING_PIX';
          break;
        case 'DECLINED':
        case 'CANCELED':
          newStatus = 'FAILED';
          break;
      }

      await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transaction.id);

      await supabase.from('payment_logs').insert({
        booking_id: transaction.booking_id,
        action: 'WEBHOOK_STAY_UPDATE',
        details: { chargeId, status, newStatus, notification },
      });

      // If payment is confirmed, notify main system
      if (newStatus === 'PAID') {
        try {
          await fetch(`${process.env.MAIN_APP_URL}/api/webhooks/payment-confirmed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: transaction.booking_id,
              chargeId,
              amount: transaction.amount,
              status: 'PAID',
            }),
          });
        } catch (webhookError) {
          console.error('Error notifying main system:', webhookError);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('PagBank webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
