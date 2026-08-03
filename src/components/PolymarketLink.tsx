'use client'

export default function PolymarketLink({ url }: { url: string }) {
  if (!url) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation() // Prevent parent Link from navigating
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="polymarket-link"
      onClick={handleClick}
    >
      View
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}
      >
        <path
          d="M1 11L11 1M11 1H3M11 1V9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}
