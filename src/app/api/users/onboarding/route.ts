// src/app/api/users/onboarding/route.ts

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const OnboardingSchema = z.object({
  displayName: z.string().min(2).max(60),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, and underscores only'),
  bio: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
  employer: z.string().max(100).optional(),
  educationLevel: z.string().max(50).optional(),
  educationField: z.string().max(100).optional(),
  institution: z.string().max(100).optional(),
  certifications: z.string().max(200).optional(),
  yearsExperience: z.coerce.number().min(0).max(60).optional(),
})

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const raw = Object.fromEntries(formData.entries())

  const parsed = OnboardingSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { displayName, username, bio, occupation, employer, educationLevel, educationField, institution, certifications, yearsExperience } = parsed.data

  // Check username uniqueness
  const existing = await prisma.user.findFirst({
    where: { username, NOT: { clerkId } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  await prisma.user.update({
    where: { clerkId },
    data: {
      displayName,
      username,
      bio: bio || null,
      occupation: occupation || null,
      employer: employer || null,
      educationLevel: educationLevel || null,
      educationField: educationField || null,
      institution: institution || null,
      certifications: certifications ? certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
      yearsExperience: yearsExperience || null,
      onboardingComplete: true,
    },
  })

  return NextResponse.redirect(new URL('/feed', req.url))
}
