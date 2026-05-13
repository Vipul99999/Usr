import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at top left, rgba(103,232,249,0.24), transparent 42%), linear-gradient(180deg, #04111d 0%, #020617 100%)'
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 72,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#67e8f9',
            fontSize: 180,
            fontWeight: 800,
            boxShadow: '0 20px 80px rgba(0,0,0,0.28)'
          }}
        >
          U
        </div>
      </div>
    ),
    size
  )
}
