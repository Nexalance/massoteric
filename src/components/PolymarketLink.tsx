'use client'

export default function PolymarketLink({ url }: { url: string }) {
  if (!url) return null

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      }}
      style={{
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--gold)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '1px',
        textDecoration: 'none',
      }}
    >
      View
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <path
          d="M1 11L11 1M11 1H3M11 1V9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
