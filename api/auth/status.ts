import { getAuthPinStatus } from '../../server/supabaseService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const status = await getAuthPinStatus();
    return res.status(200).json(status);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      configured: false,
      hasPins: false,
      message: error?.message || 'Error server status PIN',
    });
  }
}
