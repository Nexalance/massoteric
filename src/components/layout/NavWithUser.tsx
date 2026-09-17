// src/components/layout/NavWithUser.tsx
// SERVER component: resolves the visitor (Clerk session OR reviewer
// magic-link cookie) on the server and hands the Nav its initial user, so
// the navbar renders the correct signed-in/signed-out state on first paint
// instead of racing a client-side fetch.

import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import ConditionalNav from './ConditionalNav'

export interface NavInitialUser {
  id: string
  displayName: string
  username: string | null
  subscriptionTier: string | null
  isAdmin: boolean
}

export default async function NavWithUser({ dataMassotericNav }: { dataMassotericNav?: string }) {
  const { userId: clerkId } = await auth()

  let initialUser: NavInitialUser | null = null
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, displayName: true, username: true, subscriptionTier: true },
    })
    if (user) {
      initialUser = {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        isAdmin: isAdmin(clerkId),
      }
    }
  }

  return <ConditionalNav initialUser={initialUser} dataMassotericNav={dataMassotericNav} />
}
