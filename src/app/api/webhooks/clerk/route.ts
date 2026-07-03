export const dynamic = 'force-dynamic'
// src/app/api/webhooks/clerk/route.ts
// Syncs Clerk user events into our database
// Register this URL in your Clerk dashboard under Webhooks

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { type, data } = payload

  switch (type) {
    case 'user.created': {
      // New user signed up via Clerk — create their DB record
      const primaryEmail = data.email_addresses?.find(
        (e: { id: string }) => e.id === data.primary_email_address_id
      )

      const username = data.username ||
        `${data.first_name || 'user'}${data.id.slice(-6)}`.toLowerCase().replace(/\s/g, '')

      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: {},
        create: {
          clerkId: data.id,
          email: primaryEmail?.email_address || '',
          username,
          displayName: [data.first_name, data.last_name].filter(Boolean).join(' ') || username,
          avatarUrl: data.image_url || null,
          phoneVerified: data.phone_numbers?.length > 0,
        },
      })
      break
    }

    case 'user.updated': {
      const primaryEmail = data.email_addresses?.find(
        (e: { id: string }) => e.id === data.primary_email_address_id
      )

      await prisma.user.updateMany({
        where: { clerkId: data.id },
        data: {
          email: primaryEmail?.email_address,
          displayName: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
          avatarUrl: data.image_url || null,
          phoneVerified: data.phone_numbers?.length > 0,
        },
      })
      break
    }

    case 'user.deleted': {
      // Soft-handle: suspend rather than delete to preserve prediction integrity
      await prisma.user.updateMany({
        where: { clerkId: data.id },
        data: { isSuspended: true },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
