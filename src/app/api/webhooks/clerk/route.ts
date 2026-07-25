export const dynamic = 'force-dynamic'
// src/app/api/webhooks/clerk/route.ts
// Syncs Clerk user events into our database
// Register this URL in your Clerk dashboard under Webhooks

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Webhook } from 'svix'

export async function POST(req: NextRequest) {
  // Get webhook headers for signature verification
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  // If no headers, return error (might be a test request)
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Get webhook secret from env
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not set')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  // Get raw body for verification
  const payload = await req.text()

  // Verify signature
  const wh = new Webhook(webhookSecret)
  let evt: any
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  const { type, data } = evt.data

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
