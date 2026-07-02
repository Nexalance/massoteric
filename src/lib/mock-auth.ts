// Mock auth for local development without Clerk
// Stores user session in localStorage

interface MockUser {
  id: string
  username: string
  displayName: string
  email: string
  subscriptionTier: 'FREE' | 'STANDARD' | 'PRO'
}

const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  username: 'mockuser',
  displayName: 'Mock User',
  email: 'mock@massoteric.dev',
  subscriptionTier: 'PRO',
}

const STORAGE_KEY = 'massoteric_mock_auth'

export function getMockUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

export function setMockUser(user: MockUser | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function signInMock(): MockUser {
  setMockUser(MOCK_USER)
  return MOCK_USER
}

export function signOutMock(): void {
  setMockUser(null)
}

// Mock Clerk-like interface
export const mockAuth = {
  user: MOCK_USER,
  signIn: signInMock,
  signOut: signOutMock,
  getUser: getMockUser,
}
