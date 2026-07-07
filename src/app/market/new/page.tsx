'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { MarketCategory } from '@prisma/client'

const CATEGORIES = [
  { value: 'POLITICS' as const, label: 'Politics' },
  { value: 'FINANCE' as const, label: 'Finance' },
  { value: 'CRYPTO' as const, label: 'Crypto' },
  { value: 'SPORTS' as const, label: 'Sports' },
  { value: 'SCIENCE' as const, label: 'Science' },
  { value: 'TECH' as const, label: 'Tech' },
  { value: 'MACRO' as const, label: 'Macro' },
  { value: 'OTHER' as const, label: 'Other' },
]

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '15px',
  border: '1px solid var(--fog)',
  borderRadius: '4px',
  background: 'var(--ink2)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
}

export default function NewMarketPage() {
  const router = useRouter()
  const { currentUser, loading } = useCurrentUser()

  // ALL hooks must be called before any conditional returns (Rules of Hooks)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as MarketCategory,
    resolutionCriteria: '',
    closesAt: '',
    resolvesAt: '',
    tags: [] as string[],
    tagInput: '',
  })

  // Check if user can create topics
  const canCreateTopic = currentUser?.subscriptionTier === 'PRO' || currentUser?.subscriptionTier === 'STANDARD'

  // Show loading state while fetching user OR if we don't have the tier yet
  // This prevents the flash of "locked" state before the user's actual tier loads
  if (loading || !currentUser?.subscriptionTier) {
    return (
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--mist)' }}>Loading...</p>
      </main>
    )
  }

  // Show upgrade prompt for free users
  if (!canCreateTopic) {
    return (
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center', borderColor: 'rgba(201,168,76,0.2)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--gold)' }}>🔒</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Create Prediction Topics</h1>
          <p style={{ color: 'var(--mist)', marginBottom: '24px', lineHeight: '1.6' }}>
            Topic creation is available for Standard and Pro subscribers. Share your own prediction markets with the community and track expert opinions.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
            <button
              onClick={() => router.push('/settings/billing')}
              style={{
                padding: '14px 32px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                background: 'var(--gold)',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Upgrade Now
            </button>
            <button
              onClick={() => router.push('/feed')}
              style={{
                padding: '14px 24px',
                fontSize: '14px',
                border: '1px solid var(--fog)',
                borderRadius: '4px',
                background: 'transparent',
                color: 'var(--cream)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Back to Feed
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Already a subscriber? <button onClick={() => router.refresh()} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}>Refresh page</button>
          </p>
        </div>
      </main>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddTag = () => {
    const tag = formData.tagInput.trim()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag], tagInput: '' }))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          resolutionCriteria: formData.resolutionCriteria,
          closesAt: formData.closesAt || null,
          resolvesAt: formData.resolvesAt || null,
          tags: formData.tags,
        }),
      })

      if (!res.ok) {
        const data = await res.json()

        // Handle upgrade required error
        if (data.requiresUpgrade) {
          setError('Your subscription level does not include topic creation. Please upgrade to Standard or Pro to create topics.')
          // Optionally redirect to billing after a delay
          setTimeout(() => {
            if (confirm('Would you like to upgrade your subscription now?')) {
              router.push('/settings/billing')
            }
          }, 1000)
          return
        }

        throw new Error(data.message || data.error || 'Failed to create topic')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/feed')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--signal)' }}>✓</div>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Topic Submitted!</h1>
        <p style={{ color: 'var(--mist)' }}>Your topic is pending approval. Redirecting to feed...</p>
      </div>
    )
  }

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '60px', paddingRight: '20px', paddingBottom: '40px', paddingLeft: '20px', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cream)' }}>
          Create New Topic
        </h1>
        <p style={{ color: 'var(--mist)', fontSize: '15px' }}>
          Submit a prediction market for community review
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {error && (
          <div style={{ padding: '16px 20px', background: 'rgba(224, 92, 92, 0.15)', color: 'var(--danger)', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(224, 92, 92, 0.3)' }}>
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            Title <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Will Bitcoin exceed $100,000 by 2026?"
            required
            minLength={10}
            maxLength={300}
            style={inputStyle}
          />
          <p style={{ fontSize: '12px', color: 'var(--fog)', marginTop: '6px' }}>Min 10, max 300 characters</p>
        </div>

        {/* Category */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            Category <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            Description <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide context and background information about this prediction market..."
            required
            minLength={20}
            maxLength={2000}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '140px', lineHeight: '1.6' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--fog)', marginTop: '6px' }}>Min 20, max 2000 characters</p>
        </div>

        {/* Resolution Criteria */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            Resolution Criteria <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            name="resolutionCriteria"
            value={formData.resolutionCriteria}
            onChange={handleChange}
            placeholder="This market resolves to YES if... It resolves to NO if... Sources for resolution will be..."
            required
            minLength={20}
            maxLength={1000}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', lineHeight: '1.6' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--fog)', marginTop: '6px' }}>Min 20, max 1000 characters</p>
        </div>

        {/* Closing Date */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--mist)', fontFamily: 'var(--font-mono)' }}>
            Closing Date (Optional)
          </label>
          <input
            type="datetime-local"
            name="closesAt"
            value={formData.closesAt}
            onChange={handleChange}
            style={{
              ...inputStyle,
              colorScheme: 'dark',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--fog)', marginTop: '6px' }}>When predictions close</p>
        </div>

        {/* Resolution Date */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            Resolution Date <span style={{ fontSize: '10px', color: 'var(--mist)', fontWeight: 400 }}>(Recommended)</span>
          </label>
          <input
            type="datetime-local"
            name="resolvesAt"
            value={formData.resolvesAt}
            onChange={handleChange}
            style={{
              ...inputStyle,
              colorScheme: 'dark',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--fog)', marginTop: '6px' }}>When the outcome will be known (market closes for predictions at this time)</p>
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--mist)', fontFamily: 'var(--font-mono)' }}>
            Tags (Optional)
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              name="tagInput"
              value={formData.tagInput}
              onChange={handleChange}
              placeholder="Add a tag..."
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: '14px' }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={formData.tags.length >= 5}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                border: '1px solid var(--fog)',
                borderRadius: '4px',
                background: 'var(--ink2)',
                color: 'var(--cream)',
                cursor: formData.tags.length >= 5 ? 'not-allowed' : 'pointer',
                opacity: formData.tags.length >= 5 ? 0.5 : 1,
              }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.tags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: '4px 10px',
                  fontSize: '13px',
                  background: 'var(--fog)',
                  color: 'var(--cream)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1, color: 'var(--cream)' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--fog)', marginTop: '6px' }}>Up to 5 tags</p>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '16px 40px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              background: submitting ? 'var(--fog)' : 'var(--gold)',
              color: submitting ? 'var(--mist)' : 'var(--ink)',
              cursor: submitting ? 'wait' : 'pointer',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              opacity: submitting ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Topic'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            style={{
              padding: '16px 32px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid var(--fog)',
              borderRadius: '6px',
              background: 'transparent',
              color: 'var(--cream)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono)',
              opacity: submitting ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--fog)', marginTop: '12px', fontStyle: 'italic' }}>
          * Your topic will be reviewed before appearing in the feed. You'll receive a notification once it's approved.
        </p>
      </form>
    </main>
  )
}
