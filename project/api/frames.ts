import { handleFrameAction } from '../src/services/frames';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      untrustedData: { buttonIndex, fid },
      trustedData: { messageBytes }
    } = req.body;

    // Validate the frame request
    if (!messageBytes || !fid) {
      return res.status(400).json({ error: 'Invalid frame request' });
    }

    const result = await handleFrameAction(buttonIndex, fid, messageBytes);

    if (!result) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Return frame response
    return res.status(200).json({
      image: result.image,
      buttons: result.buttons
    });
  } catch (error) {
    console.error('Frame error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}