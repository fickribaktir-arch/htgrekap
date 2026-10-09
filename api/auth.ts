import { verifyPinInDb, getAuthPinStatus } from '../server/supabaseService.js';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    const query = req.query || {};

    // 1. GET: Auth Status Check
    if (req.method === 'GET') {
      const status = await getAuthPinStatus();
      return res.status(200).json(status);
    }

    // 2. POST: Verify PIN
    if (req.method === 'POST') {
      const pin = body.pin || query.pin;
      const result = await verifyPinInDb(pin);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(401).json(result);
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('[API Auth Error]:', error);
    return res.status(500).json({
      success: false,
      configured: false,
      message: error?.message || 'Internal Server Error',
    });
  }
}
