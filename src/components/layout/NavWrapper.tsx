'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Paths where we don't want to show the navbar
const EXCLUDED_PATHS = ['/sign-in', '/sign-up']

export default function NavWrapper() {
  const pathname = usePathname()

  useEffect(() => {
    // Check if we should hide the navbar
    const shouldHideNav = EXCLUDED_PATHS.some(path =>
      pathname === path || pathname.startsWith(path + '/')
    )

    // Find the navbar element and toggle its visibility
    const navbar = document.querySelector('nav[data-massoteric-nav]')
    if (navbar) {
      (navbar as HTMLElement).style.display = shouldHideNav ? 'none' : 'flex'
    }
  }, [pathname])

  return null
}
