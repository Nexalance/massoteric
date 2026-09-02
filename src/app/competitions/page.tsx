export const metadata = { title: 'Competitions | Massoteric' }

// Phase 2 preview — hidden for Milestone 1 per the completion brief.
// The Fantasy League implementation returns here in Milestone 2.
export default function CompetitionsPage() {
  return (
    <main>
      <div className="page-container" style={{ paddingTop: '80px', paddingBottom: '64px', textAlign: 'center' }}>
        <div className="section-label">Coming Soon</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)', margin: '12px 0 16px' }}>
          Competitions
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--mist)', maxWidth: '480px', margin: '0 auto', lineHeight: '1.7' }}>
          Prediction competitions are on the way. For now, head back to the feed and start predicting.
        </p>
        <a href="/feed/all" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>
          Back to Feed
        </a>
      </div>
    </main>
  )
}
