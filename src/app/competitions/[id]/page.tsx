// src/app/competitions/[id]/page.tsx
// Competition detail with leaderboard and join functionality

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CompetitionDetailClient from './CompetitionDetailClient'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const competition = await prisma.competition.findUnique({ where: { id: params.id } })
  return { title: competition ? `${competition.name} — Competition` : 'Competition' }
}

export default async function CompetitionDetailPage({ params }: { params: { id: string } }) {
  const { userId: clerkId, user } = await auth()
  if (!clerkId) redirect('/sign-in')

  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  })

  if (!competition) notFound()

  const isCreator = user?.id === competition.createdBy

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/competitions" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>
            ← Back to Competitions
          </Link>
        </div>

        <CompetitionDetailClient
          competitionId={params.id}
          userId={user?.id}
          isCreator={isCreator}
        />
      </div>
    </main>
  )
}
