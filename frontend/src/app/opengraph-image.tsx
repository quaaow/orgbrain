import { ImageResponse } from 'next/og';

export const alt = 'OrgBrain — your organisation’s memory, searchable by meaning';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'radial-gradient(60% 60% at 50% 0%, #1e1b4b 0%, #0a0a0b 60%)',
          color: '#ededed',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              border: '2px solid rgba(129,140,248,0.6)',
              background: 'rgba(124,58,237,0.15)',
              color: '#a5b4fc',
              fontSize: '34px',
              fontWeight: 700,
            }}
          >
            OB
          </div>
          <div style={{ fontSize: '36px', fontWeight: 600 }}>OrgBrain</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '900px',
            }}
          >
            Your organisation’s memory, searchable by meaning
          </div>
          <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.6)' }}>
            Knowledge · Decisions · Lessons · AI Reflection
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
