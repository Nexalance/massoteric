// src/app/api/admin/payouts/[payoutId]/route.ts
// Admin: approve or reject payout requests

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requestCreatorPayout } from '@/lib/stripe'
import { z } from 'zod'

const payoutActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
})

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

// GET - Get payout details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { payoutId } = await params

  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            stripeAccountId: true,
          },
        },
      },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    return NextResponse.json(payout)
  } catch (error) {
    console.error('Get payout error:', error)
    return NextResponse.json({ error: 'Failed to get payout' }, { status: 500 })
  }
}

// PATCH - Approve or reject payout
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { payoutId } = await params

  try {
    const body = await req.json()
    const parsed = payoutActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
    }

    const { action, notes } = parsed.data

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          select: {
            id: true,
            stripeAccountId: true,
          },
        },
      },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json({ error: 'Payout already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      // Check if user has Stripe Connect set up
      if (!payout.user.stripeAccountId) {
        return NextResponse.json(
          { error: 'User does not have Stripe Connect account set up' },
          { status: 400 }
        )
      }

      // Call requestCreatorPayout to create Stripe transfer
      // This will update the Payout record to PROCESSING
      try {
        await requestCreatorPayout(payout.user.id, payout.amountCents)
      } catch (err) {
        console.error('Failed to process payout:', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Failed to process payout' },
          { status: 500 }
        )
      }

      // Update notes with approval info
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          notes: notes ? `${payout.notes}\n\nApproved by admin: ${notes}` : `${payout.notes}\n\nApproved by admin`,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Payout approved and processing',
      })
    } else {
      // Reject - just update status and notes
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          notes: notes ? `${payout.notes}\n\nRejected by admin: ${notes}` : `${payout.notes}\n\nRejected by admin`,
          processedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Payout rejected',
      })
    }
  } catch (error) {
    console.error('Process payout error:', error)
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 })
  }
}
