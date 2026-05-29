import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Chase Banking'
  const description = searchParams.get('description') || 'Your modern banking experience'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0066CC 0%, #0052A3 100%)',
          color: 'white',
          padding: '40px',
          fontFamily: '"system-ui", "-apple-system", "Segoe UI", sans-serif',
          fontSize: '60px',
          fontWeight: 'bold',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                background: 'white',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0066CC',
                fontSize: '60px',
                fontWeight: '900',
                flexShrink: 0,
              }}
            >
              C
            </div>
            <h1 style={{ margin: '0', fontSize: '72px', fontWeight: '900' }}>
              {title.substring(0, 20)}
            </h1>
          </div>
          <p
            style={{
              fontSize: '40px',
              margin: '0',
              opacity: 0.95,
              maxWidth: '90%',
              lineHeight: '1.3',
            }}
          >
            {description.substring(0, 60)}
          </p>
          <p
            style={{
              fontSize: '28px',
              margin: '0',
              opacity: 0.8,
              marginTop: '20px',
            }}
          >
            Modern Banking Made Simple
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
