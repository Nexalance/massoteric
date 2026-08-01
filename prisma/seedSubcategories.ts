// prisma/seedSubcategories.ts
// Seed script to populate Subcategory table with curated subcategories
// Run after migration: npx tsx prisma/seedSubcategories.ts

import { PrismaClient } from '@prisma/client'
import { SUBCATEGORIES } from '../src/lib/subcategories'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
import { config } from 'dotenv'
const envPath = resolve(process.cwd(), '.env.local')
console.log(`Loading env from: ${envPath}`)
config({ path: envPath })

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables!')
  console.log('   Current working directory:', process.cwd())
  process.exit(1)
}

const prisma = new PrismaClient()

async function seedSubcategories() {
  console.log('🌱 Seeding subcategories...')

  let created = 0
  let updated = 0
  let errors = 0

  for (const [category, subcategories] of Object.entries(SUBCATEGORIES)) {
    for (let i = 0; i < subcategories.length; i++) {
      const sub = subcategories[i]

      try {
        await prisma.subcategory.upsert({
          where: { slug: sub.slug },
          update: {
            label: sub.label,
            category: sub.category as any,
            description: sub.description,
            order: i,
          },
          create: {
            slug: sub.slug,
            label: sub.label,
            category: sub.category as any,
            description: sub.description,
            order: i,
          },
        })
        created++
        console.log(`  ✓ Seeded ${sub.slug} (${category})`)
      } catch (err) {
        console.error(`  ✗ Failed to seed ${sub.slug}:`, err)
        errors++
      }
    }
  }

  console.log(`\n✅ Seeding complete:`)
  console.log(`   - Created/Updated: ${created}`)
  console.log(`   - Errors: ${errors}`)

  // Verify counts
  const totalCount = await prisma.subcategory.count()
  console.log(`   - Total subcategories in DB: ${totalCount}`)

  // Group by category
  const byCategory = await prisma.subcategory.groupBy({
    by: ['category'],
    _count: { id: true },
  })
  console.log('\n📊 Subcategories per category:')
  for (const group of byCategory) {
    console.log(`   - ${group.category}: ${group._count.id}`)
  }
}

seedSubcategories()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
