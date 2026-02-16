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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all deposit holds ordered by most recent
    const { data: deposits, error } = await supabase
      .from('deposit_holds')
      .select('*')
      .order('authorized_at', { ascending: false });

    if (error) {
      console.error('Error fetching deposits:', error);
      return res.status(500).json({ error: 'Erro ao buscar depósitos' });
    }

    return res.status(200).json({
      success: true,
      deposits: deposits || [],
      count: deposits?.length || 0,
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
