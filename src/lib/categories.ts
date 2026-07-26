// src/lib/categories.ts
// Single source of truth for navigation categories & sort modes.
// Used by the TopicsMenu (top nav) and the Feed page so they never drift.

import { MarketCategory } from '@prisma/client'

export type SortValue = 'trending' | 'new' | 'breaking'

export interface CategoryDef {
  value: MarketCategory | 'ALL'
  label: string
}

export interface SortDef {
  value: SortValue
  label: string
}

// Mirrors the MarketCategory enum (+ a synthetic 'ALL').
export const CATEGORIES: CategoryDef[] = [
  { value: 'ALL', label: 'All Topics' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'TECH', label: 'Tech' },
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'OTHER', label: 'Other' },
]

// Polymarket-style sort tabs.
export const SORTS: SortDef[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'new', label: 'New' },
  { value: 'breaking', label: 'Breaking' },
]
