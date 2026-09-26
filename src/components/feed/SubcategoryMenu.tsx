// src/components/feed/SubcategoryMenu.tsx
// Horizontal sub-menu bar for subcategories (Polymarket-style)

'use client'

import React from 'react'
import Link from 'next/link'
import { MarketCategory } from '@prisma/client'
import type { SubcategoryDef } from '@/lib/subcategories'

interface SubcategoryMenuProps {
  category: MarketCategory
  subcategories: SubcategoryDef[]
  counts: Record<string, number> // subcategoryId -> count
  activeSubcategory: string | null
  totalCount?: number // Total unique events for the category (optional)
  sort?: string // Active sort — carried into every pill link so
  search?: string // switching topic keeps the filtered view (e.g. CLOSING SOON)
  within?: string // Closing Soon time window
  source?: string // Source filter
}

export default function SubcategoryMenu({
  category,
  subcategories,
  counts,
  activeSubcategory,
  totalCount,
  sort,
  search,
  within,
  source,
}: SubcategoryMenuProps) {
  // Filter out subcategories with 0 count (fetch-only tags)
  const visibleSubcategories = subcategories.filter(sub => {
    const count = counts[sub.slug] || 0
    return count > 0
  })

  if (visibleSubcategories.length === 0) return null

  // Query string carried into every pill link — keeps the active sort/search
  // and filters so users can e.g. stay on CLOSING SOON while drilling into a topic.
  const params = new URLSearchParams()
  if (sort && sort !== 'trending') params.set('sort', sort)
  if (search) params.set('search', search)
  if (sort === 'closing' && within) params.set('within', within)
  if (source) params.set('source', source)
  const query = params.toString() ? `?${params.toString()}` : ''

  // Format count for display
  function formatCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return String(count)
  }

  return (
    <div className="subcategory-menu">
      <div className="subcategory-menu-inner">
        {/* "All" link - goes back to category page */}
        <Link
          href={`/feed/${category.toLowerCase()}${query}`}
          className={`subcategory-pill${!activeSubcategory ? ' active' : ''}`}
        >
          All <span className="subcategory-pill-count">({formatCount(
            totalCount || Object.values(counts).reduce((sum, c) => sum + c, 0)
          )})</span>
        </Link>

        {/* Subcategory pills - only show those with count > 0 */}
        {visibleSubcategories.map((sub) => {
          const isActive = activeSubcategory === sub.slug
          const count = counts[sub.slug] || 0

          return (
            <Link
              key={sub.slug}
              href={`/feed/${category.toLowerCase()}/${sub.slug}${query}`}
              className={`subcategory-pill${isActive ? ' active' : ''}`}
            >
              {sub.label}
              <span className="subcategory-pill-count">
                ({formatCount(count)})
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
