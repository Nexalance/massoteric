/**
 * Category Compatibility Layer
 * Handles enum differences between local and production environments
 */

import { MarketCategory } from '@prisma/client';

// Production might still have old enum values
type LegacyMarketCategory = MarketCategory | 'SCIENCE' | 'OTHER';

// Mapping for old categories to new ones
const LEGACY_CATEGORY_MAP: Record<string, MarketCategory> = {
  SCIENCE: 'TECH',      // SCIENCE → TECH
  OTHER: 'CULTURE',     // OTHER → CULTURE
};

// Production uses ELECTIONS locally but might have a different name
// Check if ELECTIONS exists as an alias
const PRODUCTION_CATEGORY_ALIASES: Record<string, MarketCategory> = {
  ELECTIONS: 'POLITICS',  // Fallback if ELECTIONS not supported
};

/**
 * Safe category check - handles both new and legacy values
 */
export function isValidCategory(category: string): boolean {
  // Check if it's a valid current category
  if (Object.values(MarketCategory).includes(category as MarketCategory)) {
    return true;
  }
  // Check legacy categories
  if (category in LEGACY_CATEGORY_MAP) {
    return true;
  }
  return false;
}

/**
 * Normalize category to ensure it works in both environments
 * Returns the category to use for queries
 */
export function normalizeCategoryCompat(category: string): MarketCategory {
  const upper = category.toUpperCase();

  // If it's already a valid category, return it
  if (Object.values(MarketCategory).includes(upper as MarketCategory)) {
    return upper as MarketCategory;
  }

  // Map legacy categories
  if (upper in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[upper];
  }

  // Default fallback
  return 'POLITICS' as MarketCategory;
}

/**
 * Check if a category is supported in the current environment
 * Used to skip sync for categories that don't exist in production yet
 */
export function isCategorySupported(category: string): boolean {
  try {
    // Try to use the category - if it fails, catch the error
    const validCategories = Object.values(MarketCategory);
    return validCategories.includes(category as MarketCategory);
  } catch {
    return false;
  }
}

/**
 * Safe category filter for sync operations
 * Returns null if category should be skipped
 */
export function filterSupportedCategory(category: string | null): string | null {
  if (!category) return null;

  const supported = isCategorySupported(category);
  if (!supported) {
    console.warn(`[CategoryCompat] Category ${category} not supported in this environment, skipping`);
    return null;
  }

  return category;
}
