import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Public endpoint to get system settings
 * This allows the main reservation system to fetch deposit amounts
 * without needing authentication
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[PUBLIC SETTINGS] Request received:', req.method, req.url);
  
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
    const { key } = req.query;

    // If specific key requested
    if (key) {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value, description')
        .eq('key', key)
        .single();

      if (error || !data) {
        return res.status(404).json({ 
          error: 'Setting not found',
          key 
        });
      }

      return res.status(200).json({
        success: true,
        setting: {
          key: data.key,
          value: data.value,
          description: data.description,
        },
      });
    }

    // Get all public settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value, description')
      .in('key', ['deposit_amount', 'deposit_hold_duration', 'checkout_expiration'])
      .order('key');

    if (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // Transform to easier format
    const settings: Record<string, any> = {};
    data.forEach((setting) => {
      settings[setting.key] = {
        value: setting.value,
        description: setting.description,
      };
    });

    return res.status(200).json({
      success: true,
      settings,
      // Convenience fields
      depositAmount: settings.deposit_amount?.value?.amount 
        ? settings.deposit_amount.value.amount / 100  // Convert cents to reais
        : 1000,
      depositAmountCents: settings.deposit_amount?.value?.amount || 100000,
      depositAmountDisplay: settings.deposit_amount?.value?.display || 'R$ 1.000,00',
    });
  } catch (error) {
    console.error('Public settings error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
