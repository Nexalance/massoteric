// src/lib/admin.ts
// Admin utilities - single source of truth for admin checks

/**
 * Check if a Clerk ID is an admin based on ADMIN_USER_IDS env var
 */
export function isAdmin(clerkId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  return adminIds.includes(clerkId)
}

/**
 * Server-side helper to require admin access
 * Use in page/route handlers to protect admin endpoints
 */
export async function requireAdmin(clerkId: string): Promise<void> {
  if (!isAdmin(clerkId)) {
    throw new Error('Forbidden: Admin access required')
  }
}

/**
 * For page components, returns true if should redirect to feed
 */
export function shouldRedirectNonAdmin(clerkId: string): boolean {
  return !isAdmin(clerkId)
}
