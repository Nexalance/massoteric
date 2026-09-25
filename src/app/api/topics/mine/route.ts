export const dynamic = 'force-dynamic'
// src/app/api/topics/mine/route.ts
// GET — review outcomes for the signed-in user's own topic submissions.
// Powers the "your topic was approved / not approved" notice on the topic
// form (there is no separate notification system — this is that surface).

import { auth } from '@/lib/auth-mock'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listTopicReviews } from '@/lib/topicReview'

export async function GET() {
  const { userId: clerkId } = await auth()

  const user = clerkId ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } }) : null
  if (!user) return NextResponse.json({ reviews: [] })

  const reviews = await listTopicReviews(user.id, 10)
  return NextResponse.json({ reviews })
}
