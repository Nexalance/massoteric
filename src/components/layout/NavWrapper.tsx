'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Paths where we don't want to show the navbar
const EXCLUDED_PATHS = ['/', '/sign-in', '/sign-up']

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
      const navElement = navbar as HTMLElement
      if (shouldHideNav) {
        navElement.style.display = 'none'
        navElement.style.visibility = 'hidden'
        navElement.style.position = 'absolute'
        navElement.style.left = '-9999px'
      } else {
        navElement.style.display = ''
        navElement.style.visibility = ''
        navElement.style.position = ''
        navElement.style.left = ''
      }
    }
  }, [pathname])

  return null
}
