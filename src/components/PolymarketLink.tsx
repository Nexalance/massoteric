'use client'

export default function PolymarketLink({ url }: { url: string }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="polymarket-link"
      onClick={handleClick}
    >
      View on Polymarket ↗
    </a>
  )
}
