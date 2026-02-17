import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_KEY;
    const supabaseUrlPreview = process.env.SUPABASE_URL 
      ? process.env.SUPABASE_URL.substring(0, 30) + '...'
      : 'missing';
    const supabaseKeyPreview = process.env.SUPABASE_SERVICE_KEY
      ? 'present (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')'
      : 'missing';

    return res.status(200).json({
      status: 'ok',
      environment: {
        SUPABASE_URL: hasSupabaseUrl ? supabaseUrlPreview : 'NOT SET',
        SUPABASE_SERVICE_KEY: hasSupabaseKey ? supabaseKeyPreview : 'NOT SET',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[TestEnv] Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
