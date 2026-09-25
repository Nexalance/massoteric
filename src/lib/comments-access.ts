// src/lib/comments-access.ts
// Access control for threaded comments/discussions, driven by two admin
// feature flags so the client can turn discussions on/off and decide
// whether viewing and/or posting is for paid subscribers only:
//   COMMENTS_VIEW   — isEnabled: master switch; isFree: free users may view
//   COMMENTS_CREATE — isEnabled: master switch; isFree: free users may post
// PRO users and admins always pass; anonymous visitors only ever "view",
// and only when COMMENTS_VIEW is enabled AND free.

import { prisma } from '@/lib/prisma'
import { FeatureKey, type SubscriptionTier } from '@prisma/client'
import { canAccess } from '@/lib/access'
import { isAdmin } from '@/lib/admin'

export interface CommentsAccess {
  canView: boolean
  canCreate: boolean
  /** false when the master switch is off — the section should not render at all */
  featureEnabled: boolean
}

async function flagState(key: FeatureKey): Promise<{ isEnabled: boolean; isFree: boolean } | null> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { isEnabled: true, isFree: true },
  })
  return flag
}

export async function getCommentsAccess(opts: {
  signedIn: boolean
  tier?: SubscriptionTier | null
  clerkId?: string | null
}): Promise<CommentsAccess> {
  const [viewFlag, createFlag] = await Promise.all([
    flagState(FeatureKey.COMMENTS_VIEW),
    flagState(FeatureKey.COMMENTS_CREATE),
  ])

  const viewEnabled = viewFlag?.isEnabled ?? true
  const createEnabled = createFlag?.isEnabled ?? true
  const featureEnabled = viewEnabled

  let canView = false
  let canCreate = false

  if (opts.signedIn && opts.tier) {
    const admin = opts.clerkId ? isAdmin(opts.clerkId) : false
    canView = await canAccess(opts.tier, FeatureKey.COMMENTS_VIEW, admin)
    canCreate = await canAccess(opts.tier, FeatureKey.COMMENTS_CREATE, admin)
  } else {
    // Anonymous visitors: public reading when the view flag is enabled+free
    canView = viewEnabled && (viewFlag?.isFree ?? true)
    canCreate = false
  }

  // Master switches cut everything off regardless of tier
  if (!viewEnabled) canView = false
  if (!createEnabled) canCreate = false

  return { canView, canCreate, featureEnabled }
}
