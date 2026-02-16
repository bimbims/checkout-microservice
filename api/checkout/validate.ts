import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }

    // Find checkout session
    const { data: session, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Sessão de checkout não encontrada' });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now > expiresAt) {
      // Update status to expired if not already
      if (session.status === 'PENDING') {
        await supabase
          .from('checkout_sessions')
          .update({ status: 'EXPIRED' })
          .eq('id', session.id);

        await supabase.from('payment_logs').insert({
          booking_id: session.booking_id,
          action: 'CHECKOUT_EXPIRED',
          details: { token, expiredAt: now.toISOString() },
        });
      }

      return res.status(410).json({ error: 'Sessão de checkout expirada' });
    }

    // Check if already used
    if (session.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Esta sessão de checkout já foi utilizada' });
    }

    // Check if cancelled
    if (session.status === 'EXPIRED' || session.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Esta sessão de checkout não está mais disponível' });
    }

    // Return valid session with booking data
    return res.status(200).json({
      success: true,
      booking_id: session.booking_id,
      booking_data: session.booking_data,
      stay_amount: session.stay_amount,
      deposit_amount: session.deposit_amount,
      total_amount: session.total_amount,
      expires_at: session.expires_at,
      status: session.status,
    });
  } catch (error) {
    console.error('Validate checkout error:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
