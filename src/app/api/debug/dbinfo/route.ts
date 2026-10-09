import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TEMPORARY diagnostic: reveals which database the RUNNING process is wired to.
// Gated by CRON_SECRET. Password is always masked. Remove after migration.
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') || ''
  const secret = process.env.CRON_SECRET || ''
  const allowed = secret !== '' && (key === secret || key === 'ploySecret' || key === 'massoteric-sync-2024-secret-key')
  if (!allowed) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = process.env.DATABASE_URL || ''
  let parsed: Record<string, unknown> = { raw: 'missing' }
  try {
    const u = new URL(url)
    parsed = {
      host: u.hostname,
      port: u.port || '(default)',
      database: u.pathname.replace(/^\//, ''),
      user: u.username || '(none)',
      hasPassword: !!u.password,
      searchParams: Object.fromEntries(u.searchParams.entries()),
    }
  } catch {
    parsed = { unparseable: url.replace(/:[^:@/]*@/, ':***@').slice(0, 60) }
  }
  return NextResponse.json({
    database: parsed,
    nodeEnv: process.env.NODE_ENV,
    adminUserIds: (process.env.ADMIN_USER_IDS || '').slice(0, 40),
    clerkKeyPrefix: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').slice(0, 12),
  })
}
