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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Retrieve all settings or specific setting
  if (req.method === 'GET') {
    try {
      const { key } = req.query;

      if (key) {
        // Get specific setting
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', key)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Setting not found' });
        }

        return res.status(200).json({
          success: true,
          setting: data,
        });
      } else {
        // Get all settings
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .order('key');

        if (error) {
          console.error('Error fetching settings:', error);
          return res.status(500).json({ error: 'Failed to fetch settings' });
        }

        return res.status(200).json({
          success: true,
          settings: data || [],
        });
      }
    } catch (error) {
      console.error('Get settings error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT - Update setting
  if (req.method === 'PUT') {
    try {
      const { key, value, updated_by } = req.body;

      if (!key || !value) {
        return res.status(400).json({ error: 'key and value are required' });
      }

      // Validate deposit_amount if that's what we're updating
      if (key === 'deposit_amount') {
        if (!value.amount || typeof value.amount !== 'number' || value.amount < 0) {
          return res.status(400).json({
            error: 'Invalid deposit amount',
            details: 'Amount must be a positive number in cents',
          });
        }
      }

      const { data, error } = await supabase
        .from('system_settings')
        .update({
          value: value,
          updated_by: updated_by || 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('Error updating setting:', error);
        return res.status(500).json({ error: 'Failed to update setting' });
      }

      // Log the change
      await supabase.from('payment_logs').insert({
        booking_id: 'SYSTEM',
        action: 'SETTING_UPDATED',
        details: {
          key,
          oldValue: null, // Could fetch old value if needed
          newValue: value,
          updated_by: updated_by || 'admin',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Setting updated successfully',
        setting: data,
      });
    } catch (error) {
      console.error('Update setting error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
