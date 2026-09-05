import { handleCors } from './utils/cors';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyTurnstileToken } from './utils/turnstile';
const pdf = require('pdf-parse');

// Increase payload size limit if Next.js/Vercel allows it this way
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-turnstile-token'] as string | undefined;
  const isHuman = await verifyTurnstileToken(token);
  if (!isHuman) {
    return res.status(403).json({ error: 'Invalid or missing Turnstile token' });
  }

  try {
    const { base64Pdf } = req.body;

    if (!base64Pdf) {
      return res.status(400).json({ error: 'base64Pdf is required' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Pdf, 'base64');
    
    if (buffer.length > 3.5 * 1024 * 1024) { // Additional safety check
      return res.status(413).json({ error: 'PDF file is too large (max 3MB)' });
    }

    // Parse PDF (max 3 pages limit applied)
    const data = await pdf(buffer, { max: 3 });

    return res.status(200).json({ text: data.text });
  } catch (error: any) {
    console.error('PDF Parse error:', error);
    return res.status(500).json({ error: 'Failed to parse PDF', details: error.message });
  }
}
