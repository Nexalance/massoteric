'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { mockAuth, signInMock, signOutMock } from './mock-auth'

interface MockAuthContextType {
  user: ReturnType<typeof mockAuth.getUser> | null
  isLoading: boolean
  signIn: () => void
  signOut: () => void
  isSignedIn: boolean
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ReturnType<typeof mockAuth.getUser> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = mockAuth.getUser()
    setUser(savedUser)
    setIsLoading(false)
  }, [])

  const signIn = () => {
    const newUser = signInMock()
    setUser(newUser)
    return newUser
  }

  const signOut = () => {
    signOutMock()
    setUser(null)
    window.location.href = '/sign-in'
  }

  return (
    <MockAuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        isSignedIn: !!user,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    throw new Error('useMockAuth must be used within MockAuthProvider')
  }
  return context
}
