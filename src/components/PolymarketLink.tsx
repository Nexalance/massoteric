'use client'

export default function PolymarketLink({ url }: { url: string }) {
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="polymarket-link"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        padding: '3px 8px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      View ↗
    </a>
  )
}
