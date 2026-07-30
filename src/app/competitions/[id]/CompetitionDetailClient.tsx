// src/app/competitions/[id]/CompetitionDetailClient.tsx
// Client-side competition detail with leaderboard and join

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CompetitionDetail {
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
  }
  winner?: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
  isMember: boolean
  isCreator: boolean
  leaderboard: Array<{
    rank: number
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    totalPredictions?: number
    scoredPredictions?: number
    avgBrierScore?: number | null
    joinedAt: string
  }>
}

export default function CompetitionDetailClient({
  competitionId,
  userId,
  isCreator,
}: {
  competitionId: string
  userId?: string
  isCreator: boolean
}) {
  const router = useRouter()
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entryCode, setEntryCode] = useState('')
  const [winnerSelect, setWinnerSelect] = useState<string | null>(null)

  useEffect(() => {
    fetchCompetition()
  }, [competitionId])

  const fetchCompetition = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/competitions/${competitionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load competition')
      }

      setCompetition(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competition')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!competition) return

    setActionLoading(true)
    setError(null)

    try {
      const body: { entryCode?: string } = {}
      if (!competition.isPublic) {
        if (!entryCode.trim()) {
          throw new Error('Entry code is required for private competitions')
        }
        body.entryCode = entryCode
      }

      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join competition')
      }

      // Refresh competition data
      await fetchCompetition()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join competition')
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this competition?')) return

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave competition')
      }

      router.push('/competitions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave competition')
      setActionLoading(false)
    }
  }

  const handleDeclareWinner = async () => {
    if (!winnerSelect) {
      setError('Please select a winner from the leaderboard')
      return
    }

    if (!confirm(`Declare @${competition?.leaderboard.find(l => l.userId === winnerSelect)?.username} as the winner?`)) return

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/competitions/${competitionId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: winnerSelect }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to declare winner')
      }

      // Refresh competition data
      await fetchCompetition()
      setWinnerSelect(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to declare winner')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mist)' }}>
        Loading competition...
      </div>
    )
  }

  if (!competition) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mist)' }}>
        Competition not found
      </div>
    )
  }

  const canJoin = !competition.isMember && !isCreator && competition.status !== 'ended'
  const canLeave = competition.isMember && !isCreator && competition.status === 'upcoming'
  const isFull = competition.maxParticipants && competition.participantCount >= competition.maxParticipants

  return (
    <div>
      {/* Error */}
      {error && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid var(--warning)',
          }}
        >
          <p style={{ fontSize: '14px', color: 'var(--warning)' }}>{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: `${getStatusColor(competition.status)}20`,
                  color: getStatusColor(competition.status),
                  border: `1px solid ${getStatusColor(competition.status)}`,
                }}
              >
                {competition.status}
              </span>
              {!competition.isPublic && (
                <span className="badge badge-category">Private</span>
              )}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginBottom: '8px' }}>
              {competition.name}
            </h1>
            {competition.description && (
              <p style={{ fontSize: '14px', color: 'var(--mist)', marginBottom: '16px' }}>
                {competition.description}
              </p>
            )}
            <p style={{ fontSize: '12px', color: 'var(--mist)' }}>
              Created by{' '}
              <span style={{ color: 'var(--gold)' }}>@{competition.creator.username}</span>
            </p>
          </div>
        </div>

        {/* Prize */}
        {competition.prizeDescription && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: 'var(--fog)',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '4px' }}>PRIZE</div>
            <div style={{ fontSize: '14px', color: 'var(--cream)' }}>🏆 {competition.prizeDescription}</div>
          </div>
        )}

        {/* Winner */}
        {competition.winner && competition.status === 'ended' && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(255, 215, 0, 0.1))',
              border: '1px solid var(--gold)',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '8px', fontWeight: 600 }}>🏆 WINNER</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {competition.winner.avatarUrl && (
                <img
                  src={competition.winner.avatarUrl}
                  alt={competition.winner.displayName}
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
              )}
              <div>
                <div style={{ fontSize: '16px', color: 'var(--cream)', fontWeight: 600 }}>
                  {competition.winner.displayName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>@{competition.winner.username}</div>
              </div>
            </div>
          </div>
        )}

        {/* Dates */}
        <div
          style={{
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px' }}>STARTS</div>
            <div style={{ fontSize: '14px', color: 'var(--cream)' }}>{formatDate(competition.startsAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px' }}>ENDS</div>
            <div style={{ fontSize: '14px', color: 'var(--cream)' }}>{formatDate(competition.endsAt)}</div>
          </div>
        </div>

        {/* Participants */}
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--mist)' }}>
          {competition.participantCount} participant{competition.participantCount !== 1 ? 's' : ''}
          {competition.maxParticipants && ` / ${competition.maxParticipants} max`}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '20px' }}>
          {canJoin && (
            <>
              {!competition.isPublic && !competition.isMember && (
                <input
                  type="text"
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  placeholder="Enter entry code..."
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    backgroundColor: 'var(--ink)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--cream)',
                  }}
                />
              )}
              {isFull ? (
                <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
                  Competition Full
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {actionLoading ? 'Joining...' : 'Join Competition'}
                </button>
              )}
            </>
          )}
          {competition.isMember && (
            <div className="card" style={{ padding: '12px', background: 'var(--fog)', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--signal)' }}>✓ You're a participant</span>
              {canLeave && (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Leaving...' : 'Leave Competition'}
                </button>
              )}
            </div>
          )}

          {/* Declare Winner (Creator only, when competition ended) */}
          {isCreator && competition.status === 'ended' && !competition.winner && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--fog)',
                borderRadius: '4px',
                border: '1px solid var(--gold)',
              }}
            >
              <div style={{ fontSize: '14px', color: 'var(--cream)', marginBottom: '12px', fontWeight: 600 }}>
                🏆 Declare Winner
              </div>
              <select
                value={winnerSelect || ''}
                onChange={(e) => setWinnerSelect(e.target.value)}
                disabled={actionLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  backgroundColor: 'var(--ink)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--cream)',
                }}
              >
                <option value="">Select winner from leaderboard...</option>
                {competition.leaderboard.map((entry) => (
                  <option key={entry.userId} value={entry.userId}>
                    #{entry.rank} - {entry.displayName} (@{entry.username})
                    {entry.avgBrierScore !== undefined && entry.avgBrierScore !== null
                      ? ` - Score: ${entry.avgBrierScore.toFixed(3)}`
                      : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDeclareWinner}
                disabled={actionLoading || !winnerSelect}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {actionLoading ? 'Declaring...' : 'Declare Winner'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="section-label">Leaderboard</div>
      <div className="card">
        {competition.leaderboard.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--mist)' }}>
            No participants yet
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto auto',
                gap: '16px',
                padding: '12px 16px',
                fontSize: '11px',
                color: 'var(--mist)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>Rank</div>
              <div>Participant</div>
              <div>Predictions</div>
              <div>Brier Score</div>
            </div>

            {/* Leaderboard rows */}
            {competition.leaderboard.map((entry, index) => {
              const isTop3 = index < 3
              const isCurrentUser = entry.userId === userId

              return (
                <div
                  key={entry.userId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr auto auto',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: isCurrentUser ? 'rgba(234, 179, 8, 0.1)' : undefined,
                    borderBottom: index < competition.leaderboard.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Rank */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isTop3 ? (
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 600,
                          color: index === 0 ? 'var(--gold)' : index === 1 ? 'var(--mist)' : 'var(--fog)',
                        }}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '14px', color: 'var(--mist)' }}>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Participant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--ink3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'var(--gold)',
                      }}
                    >
                      {entry.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {entry.displayName}
                        {competition.winner?.id === entry.userId && (
                          <span style={{ fontSize: '14px' }}>🏆</span>
                        )}
                        {isCurrentUser && (
                          <span style={{ fontSize: '11px', color: 'var(--gold)' }}>
                            (You)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--mist)' }}>@{entry.username}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--mist)' }}>
                      {entry.totalPredictions !== undefined ? `${entry.totalPredictions}` : '—'}
                    </span>
                  </div>

                  {/* Brier Score */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {entry.avgBrierScore !== undefined && entry.avgBrierScore !== null ? (
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: entry.avgBrierScore < 0.25 ? 'var(--signal)' : entry.avgBrierScore < 0.4 ? 'var(--gold)' : 'var(--cream)',
                        }}
                      >
                        {entry.avgBrierScore.toFixed(3)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--mist)' }}>—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      {competition.status === 'active' && (
        <div className="card" style={{ padding: '16px', marginTop: '16px', backgroundColor: 'var(--fog)' }}>
          <p style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
            <strong>Scoring:</strong> Brier score measures prediction accuracy. Lower scores are better (0.0 = perfect,
            1.0 = random guessing, 2.0 = worst). Only predictions on markets resolving within the competition
            period count toward the leaderboard.
          </p>
        </div>
      )}
    </div>
  )
}
