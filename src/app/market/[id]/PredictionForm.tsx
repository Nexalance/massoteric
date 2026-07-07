'use client'

import { FormEvent, useState, useEffect } from 'react'
import { MarketCategory } from '@prisma/client'

interface PredictionFormProps {
  marketId: string
  marketStatus: string
  closesAt: Date | null
  existingPrediction?: {
    probability: number
    reasoning: string
  } | null
  isLocked: boolean
}

export function PredictionForm({ marketId, marketStatus, closesAt, existingPrediction, isLocked }: PredictionFormProps) {
  const [sliderValue, setSliderValue] = useState(
    existingPrediction ? Math.round(existingPrediction.probability * 100) : 50
  )

  // Update when existingPrediction changes
  useEffect(() => {
    if (existingPrediction) {
      setSliderValue(Math.round(existingPrediction.probability * 100))
    }
  }, [existingPrediction])

  const handleSliderChange = (e: FormEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.currentTarget.value))
  }

  if (marketStatus === 'RESOLVED') {
    return null
  }

  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔒</div>
        <p style={{ fontSize: '14px', color: 'var(--mist)' }}>
          Predictions are locked within 48 hours of market close.
        </p>
        {existingPrediction && (
          <p style={{ fontSize: '13px', color: 'var(--gold)', marginTop: '12px', fontStyle: 'italic' }}>
            Your prediction: {Math.round(existingPrediction.probability * 100)}%
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="section-label" style={{ marginBottom: '16px' }}>
        {existingPrediction ? 'Update Your Prediction' : 'Post Your Prediction'}
      </div>

      <form action="/api/predictions" method="POST">
        <input type="hidden" name="marketId" value={marketId} />

        <label className="label">Your Probability Estimate</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            type="range"
            name="probability_range"
            min={1}
            max={99}
            value={sliderValue}
            onChange={handleSliderChange}
            style={{ flex: 1, accentColor: 'var(--gold)' }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, color: 'var(--signal)', width: '56px', textAlign: 'right' }}>
            {sliderValue}%
          </span>
        </div>

        <label className="label">Your Reasoning</label>
        <textarea
          name="reasoning"
          className="input"
          placeholder="Explain your reasoning (minimum 50 characters). This builds your reputation and track record."
          defaultValue={existingPrediction?.reasoning || ''}
          style={{ marginBottom: '12px', minHeight: '140px' }}
        />

        {existingPrediction && (
          <>
            <label className="label">Reason for Update (optional)</label>
            <input
              type="text"
              name="editReason"
              className="input"
              placeholder="Why are you revising?"
              style={{ marginBottom: '12px' }}
            />
          </>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          {existingPrediction ? 'Update Prediction' : 'Submit Prediction'}
        </button>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)', marginTop: '10px', lineHeight: '1.5' }}>
          All edits are timestamped and public. Predictions lock 48 hours before market close.
        </p>
      </form>
    </>
  )
}
