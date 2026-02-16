import { VercelRequest, VercelResponse } from '@vercel/node';

// Store last error in memory (temporary debug solution)
export let lastError: any = null;

export function setLastError(error: any) {
  lastError = {
    timestamp: new Date().toISOString(),
    error: error
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json(lastError || { message: 'No errors yet' });
}
