// src/app/competitions/create/CreateCompetitionClient.tsx
// Client-side form for creating a competition

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateCompetitionClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set default dates: start tomorrow, end in 3 months
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const inThreeMonths = new Date()
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3)

  const defaultStart = tomorrow.toISOString().slice(0, 16)
  const defaultEnd = inThreeMonths.toISOString().slice(0, 16)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startsAt: defaultStart,
    endsAt: defaultEnd,
    isPublic: true,
    entryCode: '',
    prizeDescription: '',
    prizeImageUrl: '',
    maxParticipants: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const toISOString = (dateTimeLocal: string) => {
        return new Date(dateTimeLocal).toISOString()
      }

      // Clean up the data before sending
      const body: any = {
        name: formData.name,
        startsAt: toISOString(formData.startsAt),
        endsAt: toISOString(formData.endsAt),
        isPublic: formData.isPublic,
      }

      // Only include optional fields if they have values
      if (formData.description) body.description = formData.description
      if (formData.entryCode) body.entryCode = formData.entryCode
      if (formData.prizeDescription) body.prizeDescription = formData.prizeDescription
      if (formData.maxParticipants) body.maxParticipants = parseInt(formData.maxParticipants)

      // Note: prizeImageUrl is not being used in the form, so we don't send it

      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create competition')
      }

      router.push(`/competitions/${data.competition.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Competition Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          COMPETITION NAME *
        </label>
        <input
          type="text"
          required
          minLength={3}
          maxLength={100}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={loading}
          placeholder="e.g., Q4 2026 Predictions League"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--cream)',
          }}
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          DESCRIPTION
        </label>
        <textarea
          maxLength={1000}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={loading}
          placeholder="Describe the competition theme, rules, or any special conditions..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--cream)',
            minHeight: '80px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
            START DATE *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.startsAt}
            onChange={(e) => handleChange('startsAt', e.target.value)}
            disabled={loading}
            min={new Date().toISOString().slice(0, 16)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--cream)',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
            END DATE *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.endsAt}
            onChange={(e) => handleChange('endsAt', e.target.value)}
            disabled={loading}
            min={formData.startsAt}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--cream)',
            }}
          />
        </div>
      </div>

      {/* Access Control */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          ACCESS
        </label>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="access"
              checked={formData.isPublic}
              onChange={() => handleChange('isPublic', true)}
              disabled={loading}
            />
            <span style={{ fontSize: '13px', color: 'var(--cream)' }}>Public (anyone can join)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="access"
              checked={!formData.isPublic}
              onChange={() => handleChange('isPublic', false)}
              disabled={loading}
            />
            <span style={{ fontSize: '13px', color: 'var(--cream)' }}>Private (entry code required)</span>
          </label>
        </div>
      </div>

      {/* Entry Code */}
      {!formData.isPublic && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
            ENTRY CODE *
          </label>
          <input
            type="text"
            required={!formData.isPublic}
            value={formData.entryCode}
            onChange={(e) => handleChange('entryCode', e.target.value)}
            disabled={loading}
            placeholder="e.g., SECRET2026"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--cream)',
            }}
          />
        </div>
      )}

      {/* Prize */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          PRIZE DESCRIPTION
        </label>
        <input
          type="text"
          maxLength={1000}
          value={formData.prizeDescription}
          onChange={(e) => handleChange('prizeDescription', e.target.value)}
          disabled={loading}
          placeholder="e.g., $100 cash prize + trophy badge on profile"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--cream)',
          }}
        />
      </div>

      {/* Max Participants */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          MAX PARTICIPANTS (optional)
        </label>
        <input
          type="number"
          min="2"
          value={formData.maxParticipants}
          onChange={(e) => handleChange('maxParticipants', e.target.value)}
          disabled={loading}
          placeholder="Leave empty for unlimited"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--cream)',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            fontSize: '13px',
            borderRadius: '4px',
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            color: 'var(--warning)',
            border: '1px solid var(--warning)',
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          {loading ? 'Creating...' : 'Create Competition'}
        </button>
        <Link
          href="/competitions"
          className="btn btn-secondary"
          style={{ textAlign: 'center', justifyContent: 'center' }}
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
