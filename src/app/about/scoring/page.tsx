import Link from 'next/link'

export const metadata = {
  title: 'How Scoring Works | Massoteric',
  description: 'How the Massoteric accuracy score is calculated, in plain language.',
}

const container = { maxWidth: '720px', margin: '0 auto', paddingTop: '40px', paddingBottom: '80px' }
const h2 = { fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--cream)', margin: '32px 0 12px' }
const p = { color: 'var(--mist)', fontSize: '15px', lineHeight: '1.8', marginBottom: '12px' }
const mono = { fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', background: 'var(--ink3)', padding: '12px 16px', borderRadius: '4px', lineHeight: '1.8' }

export default function ScoringExplainerPage() {
  return (
    <main>
      <div className="page-container" style={container}>
        <div className="section-label">Help</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 300, color: 'var(--cream)', marginBottom: '8px' }}>
          How scoring works
        </h1>
        <p style={p}>
          Every prediction you make is a probability (for example, 70% YES). When the market
          resolves, the outcome is either YES or NO. We grade how close your probability was
          to what actually happened, and that grade becomes your <strong style={{ color: 'var(--cream)' }}>accuracy score</strong>.
        </p>

        <h2 style={h2}>The idea in one sentence</h2>
        <p style={p}>
          Be confident when you&apos;re right and cautious when you&apos;re not — the score rewards
          well-calibrated forecasters, not lucky ones.
        </p>

        <h2 style={h2}>The math (Brier score)</h2>
        <p style={p}>
          We use the industry-standard <strong style={{ color: 'var(--cream)' }}>Brier score</strong>: the squared
          difference between your probability and the outcome.
        </p>
        <div style={mono}>
          error = (your probability − outcome)²<br />
          outcome = 1 if YES, 0 if NO
        </div>
        <p style={{ ...p, marginTop: '12px' }}>
          Examples: predict 90% and it happens → error = (0.9 − 1)² = <strong style={{ color: 'var(--signal)' }}>0.01</strong> (excellent).
          Predict 90% and it doesn&apos;t → error = (0.9 − 0)² = <strong style={{ color: '#ef4444' }}>0.81</strong> (heavily penalized).
          A coin-flip 50% guess scores 0.25 no matter what happens.
        </p>

        <h2 style={h2}>Why we show it as a percentage</h2>
        <p style={p}>
          Raw Brier scores are small decimals where <em>lower is better</em>, which reads backwards to
          most people. So we convert it: <strong style={{ color: 'var(--cream)' }}>accuracy % = (1 − average error) × 100</strong>,
          where <strong style={{ color: 'var(--cream)' }}>higher is better</strong>. Predicting 50% on everything
          hovers around 75%; consistently sharp forecasting pushes you into the 90s.
        </p>

        <h2 style={h2}>Overall vs. per-topic</h2>
        <p style={p}>
          Your <strong style={{ color: 'var(--cream)' }}>overall</strong> score averages every scored prediction
          across all topics. Each <strong style={{ color: 'var(--cream)' }}>topic</strong> (Politics, Sports,
          Crypto, …) also gets its own score from just that category&apos;s markets — so a great sports
          forecaster stands out on sports topics even if their politics calls are mediocre. Topic badges
          appear next to predictions once a forecaster has at least one scored prediction in that topic.
        </p>

        <h2 style={h2}>Rules that keep it honest</h2>
        <p style={p}>
          Predictions lock 48 hours before a market closes, so nobody can swoop in at the last second
          with near-certain knowledge. Edits are timestamped and public. You need at least one scored
          (resolved) prediction to appear on the leaderboard.
        </p>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <Link href="/leaderboard" className="btn btn-primary">See the Leaderboard</Link>
          <Link href="/feed/all" className="btn btn-ghost">Browse Markets</Link>
        </div>
      </div>
    </main>
  )
}
