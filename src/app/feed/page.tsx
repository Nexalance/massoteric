export const dynamic = 'force-dynamic'
// src/app/feed/page.tsx
// Redirects to /feed/all for cleaner URLs

import { redirect } from 'next/navigation'

export const metadata = { title: 'Feed' }

interface FeedPageProps {
  searchParams: { category?: string; page?: string; sort?: string; search?: string }
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  // Preserve query params during redirect
  const sp = new URLSearchParams()
  if (searchParams.sort && searchParams.sort !== 'trending') sp.set('sort', searchParams.sort)
  if (searchParams.search) sp.set('search', searchParams.search)
  if (searchParams.page && searchParams.page !== '1') sp.set('page', searchParams.page)

  const queryString = sp.toString()
  redirect(`/feed/all${queryString ? `?${queryString}` : ''}`)
}
