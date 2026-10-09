import { verifyPinInDb } from '../../server/supabaseService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }
    body = body || {};
    const pin = body.pin || req.query?.pin;
    const result = await verifyPinInDb(pin);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(401).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      configured: false,
      message: error?.message || 'Error server verifikasi PIN',
    });
  }
}
