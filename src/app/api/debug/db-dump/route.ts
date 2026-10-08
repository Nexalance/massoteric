import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const KEY = process.env.CRON_SECRET || ''

function run(cmd: string, timeout = 240000): Promise<{ out: string; err: string; code: number }> {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 512 * 1024 * 1024, timeout }, (error, stdout, stderr) => {
      resolve({ out: stdout, err: stderr, code: error ? (error as any).code ?? 1 : 0 })
    })
  })
}

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') || ''
  if (!KEY || key !== KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const diag = new URL(req.url).searchParams.get('diag')
  if (diag) {
    const d = await run(
      'command -v pg_dump; pg_dump --version 2>&1 | head -1; echo "DB=${DATABASE_URL%%@(localhost)*}"; node -e "console.log((process.env.DATABASE_URL||\'\').replace(/:[^:@]*@/,\':***@\'))"',
      20000
    )
    return new NextResponse(`OUT:${d.out}\nERR:${d.err}\nCODE:${d.code}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'no DATABASE_URL' }, { status: 500 })

  const dump = await run(`pg_dump '${dbUrl.replace(/'/g, "'\\''")}' --data-only --no-owner --no-privileges`)
  if (dump.code !== 0 || !dump.out) {
    return new NextResponse(`DUMP_ERR code=${dump.code}: ${(dump.err || 'empty output').slice(0, 2000)}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  return new NextResponse(dump.out, {
    status: 200,
    headers: {
      'Content-Type': 'application/sql',
      'Content-Disposition': 'attachment; filename="massoteric-data.sql"',
    },
  })
}
