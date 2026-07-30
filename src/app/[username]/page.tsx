// src/app/[username]/page.tsx
// Short profile route (redirects to /profile/[username])

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface UsernamePageProps {
  params: { username: string }
}

export default async function UsernamePage({ params }: UsernamePageProps) {
  // Redirect to the full profile route
  redirect(`/profile/${params.username}`)
}
