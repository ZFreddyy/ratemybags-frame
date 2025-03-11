import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { searchParams } = new URL(req.url || '', 'http://localhost');
    const address = searchParams.get('address');
    const rating = searchParams.get('rating');
    const reactions = searchParams.get('reactions');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e1b4b',
            padding: '40px 60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              height: '100%',
            }}
          >
            <h1
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                color: '#1e1b4b',
                marginBottom: '20px',
              }}
            >
              RateMyBags
            </h1>
            {address ? (
              <>
                <p style={{ fontSize: '32px', color: '#4b5563', marginBottom: '16px' }}>
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
                {rating && (
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {`⭐️ ${rating}/10`}
                  </div>
                )}
                {reactions && (
                  <div style={{ fontSize: '36px' }}>
                    {reactions}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '32px', color: '#4b5563' }}>
                Rate and showcase your crypto portfolio
              </p>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}