// src/lib/yes-no-filter.ts
// Yes/No-only display mode (SIMPLE_BINARY_ONLY feature flag). While enabled,
// every market listing — feed pages, category/subcategory pages, search and
// the landing ticker — hides group brackets, scalar counts and price-target
// ladders that the sync flagged with isBinary=false. Hidden, never deleted.

import { prisma } from './prisma'

export async function yesNoOnlyMode(): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: 'SIMPLE_BINARY_ONLY' },
    select: { isEnabled: true },
  })
  // Default ON when the flag hasn't been seeded yet — that is the promised
  // testing behaviour; the admin toggle is what turns it off.
  return flag ? flag.isEnabled : true
}

export function binaryOnlyWhere(enabled: boolean) {
  return enabled ? { isBinary: true as const } : {}
}
