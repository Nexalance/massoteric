// src/app/competitions/CompetitionsListClient.tsx
// Client-side competitions list with filtering

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Competition {
  id: string
  name: string
  description: string | null
  startsAt: string
  endsAt: string
  status: 'upcoming' | 'active' | 'ended'
  isPublic: boolean
  prizeDescription: string | null
  prizeImageUrl: string | null
  maxParticipants: number | null
  participantCount: number
  creator: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export default function CompetitionsListClient({ userId }: { userId?: string }) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'joined'>('all')

  useEffect(() => {
    fetchCompetitions()
  }, [filter])

  const fetchCompetitions = async () => {
    setLoading(true)
    try {
      const url = `/api/competitions${filter === 'joined' && userId ? `?userId=${userId}&joined=true` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setCompetitions(data)
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'var(--signal)'
      case 'upcoming':
        return 'var(--gold)'
      case 'ended':
        return 'var(--mist)'
      default:
        return 'var(--mist)'
    }
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '12px', padding: '8px 16px' }}
        >
          All Competitions
        </button>
        {userId && (
          <button
            onClick={() => setFilter('joined')}
            className={`btn ${filter === 'joined' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            My Competitions
          </button>
        )}
      </div>

      {/* Competitions grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mist)' }}>
          Loading competitions...
        </div>
      ) : competitions.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--mist)', marginBottom: '16px' }}>
            {filter === 'joined' ? "You haven't joined any competitions yet." : 'No competitions found.'}
          </p>
          <Link href="/competitions/create" className="btn btn-primary">
            Create One
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/competitions/${comp.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '20px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>
                      {comp.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '8px' }}>
                      {comp.description || 'No description'}
                    </p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: `${getStatusColor(comp.status)}20`,
                      color: getStatusColor(comp.status),
                      border: `1px solid ${getStatusColor(comp.status)}`,
                    }}
                  >
                    {comp.status}
                  </span>
                </div>

                {/* Creator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--ink3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'var(--gold)',
                    }}
                  >
                    {comp.creator.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--mist)' }}>
                    by @{comp.creator.username}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mist)' }}>
                  <span>
                    {formatDate(comp.startsAt)} — {formatDate(comp.endsAt)}
                  </span>
                  <span>{comp.participantCount} participants</span>
                </div>

                {/* Prize */}
                {comp.prizeDescription && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: 'var(--fog)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: 'var(--cream)',
                    }}
                  >
                    🏆 {comp.prizeDescription}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
