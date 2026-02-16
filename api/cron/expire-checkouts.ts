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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Vercel-Cron-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (Vercel Cron Jobs send this header)
  const cronSecret = req.headers['x-vercel-cron-key'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();

    // Find all pending checkout sessions that have expired
    const { data: expiredSessions, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('status', 'PENDING')
      .lt('expires_at', now.toISOString());

    if (error) {
      console.error('Error fetching expired sessions:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No expired sessions found',
        count: 0,
      });
    }

    // Update all expired sessions
    const expiredIds = expiredSessions.map((s) => s.id);

    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({ status: 'EXPIRED' })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Error updating expired sessions:', updateError);
      return res.status(500).json({ error: 'Update error' });
    }

    // Log expiration for each session
    for (const session of expiredSessions) {
      await supabase.from('payment_logs').insert({
        booking_id: session.booking_id,
        action: 'CHECKOUT_EXPIRED_CRON',
        details: {
          token: session.token,
          expiresAt: session.expires_at,
          expiredAt: now.toISOString(),
        },
      });

      // Notify main system via webhook (optional)
      // This allows the main system to update the booking status if needed
      /* try {
        await fetch(`${process.env.MAIN_APP_URL}/api/webhooks/checkout-expired`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: session.booking_id,
            token: session.token,
            expiresAt: session.expires_at,
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error for', session.booking_id, webhookError);
      } */
    }

    return res.status(200).json({
      success: true,
      message: `Expired ${expiredSessions.length} checkout sessions`,
      count: expiredSessions.length,
      sessions: expiredSessions.map((s) => ({
        bookingId: s.booking_id,
        token: s.token,
        expiresAt: s.expires_at,
      })),
    });
  } catch (error) {
    console.error('Expire checkouts cron error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
