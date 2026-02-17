import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET endpoint to retrieve deposit amount configuration
 * Public endpoint - no authentication required
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[deposit-info] Fetching deposit amount from system_settings...');
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'deposit_amount')
      .single();

    if (error || !data) {
      console.warn('[deposit-info] Not found in database, using fallback');
      // Return fallback
      return res.status(200).json({
        success: true,
        depositAmount: 1000,
        depositAmountCents: 100000,
        depositAmountDisplay: 'R$ 1.000,00',
        source: 'fallback',
      });
    }

    // Extract amount from value JSON
    const amountInCents = data.value?.amount || 100000;
    const amountInReais = amountInCents / 100;
    const display = data.value?.display || `R$ ${amountInReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    console.log('[deposit-info] Loaded:', { amountInReais, amountInCents, display });

    return res.status(200).json({
      success: true,
      depositAmount: amountInReais,
      depositAmountCents: amountInCents,
      depositAmountDisplay: display,
      source: 'database',
    });
  } catch (error) {
    console.error('[deposit-info] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
