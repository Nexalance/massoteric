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
      View ↗
    </a>
  )
}
