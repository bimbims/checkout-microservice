import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[TestDB] Testing database connection...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Environment variables not configured',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('[TestDB] Querying system_settings...');
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'deposit_amount')
      .single();

    if (error) {
      console.error('[TestDB] Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: error,
      });
    }

    console.log('[TestDB] ✅ Query successful:', data);
    
    return res.status(200).json({
      success: true,
      data: data,
      parsed: {
        key: data.key,
        amountCents: data.value?.amount,
        amountReais: data.value?.amount ? data.value.amount / 100 : null,
        display: data.value?.display,
      },
    });
  } catch (error: any) {
    console.error('[TestDB] Uncaught error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
