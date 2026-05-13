import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background:
            'radial-gradient(circle at top left, rgba(103,232,249,0.22), transparent 36%), radial-gradient(circle at bottom right, rgba(245,158,11,0.18), transparent 28%), linear-gradient(180deg, #04111d 0%, #020617 100%)',
          color: 'white'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#67e8f9',
              fontSize: 34,
              fontWeight: 800
            }}
          >
            U
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.64)' }}>Business link platform</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>UrlShortener</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 920 }}>
          <div style={{ fontSize: 72, lineHeight: 1.06, fontWeight: 800 }}>
            Branded short links, analytics, and team workflows in one place.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: 'rgba(255,255,255,0.72)' }}>
            Launch links fast, track clicks clearly, and keep campaigns organized without enterprise complexity.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Custom domains', 'QR codes', 'Workspace-ready', 'Export-friendly'].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                padding: '10px 18px',
                fontSize: 22,
                color: 'rgba(255,255,255,0.82)'
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
