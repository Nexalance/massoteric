// src/app/onboarding/page.tsx
// Collects user background info after signup

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Complete Your Profile' }

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) redirect('/sign-in')
  if (user.onboardingComplete) redirect('/feed')

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px var(--page-pad)' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)', marginBottom: '8px' }}>
            Welcome to <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Massoteric</span>
          </div>
          <p style={{ color: 'var(--mist)', fontSize: '16px' }}>
            Tell us a bit about yourself. Your background helps others assess your expertise — and builds your reputation from day one.
          </p>
        </div>

        <div className="card" style={{ borderTop: '2px solid var(--gold)' }}>
          <form action="/api/users/onboarding" method="POST">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div>
                <label className="label">Display Name *</label>
                <input name="displayName" defaultValue={user.displayName} className="input" required placeholder="How you'll appear to others" />
              </div>

              <div>
                <label className="label">Username *</label>
                <input name="username" defaultValue={user.username} className="input" required placeholder="your_handle" pattern="[a-z0-9_]+" />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)', marginTop: '4px' }}>Lowercase, numbers, underscores only</p>
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea name="bio" className="input" placeholder="Brief description of your background and areas of expertise" style={{ minHeight: '80px' }} />
              </div>

              <hr className="divider" />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px' }}>PROFESSIONAL BACKGROUND (OPTIONAL)</p>
              <p style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '-12px' }}>
                This information is shown on your public profile. It helps the community evaluate your predictions — but it's entirely optional.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Occupation</label>
                  <input name="occupation" className="input" placeholder="e.g. Economist" />
                </div>
                <div>
                  <label className="label">Employer / Company</label>
                  <input name="employer" className="input" placeholder="e.g. Goldman Sachs" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Education Level</label>
                  <select name="educationLevel" className="input" style={{ cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {["High School", "Associate's", "Bachelor's", "Master's", "PhD", "MD", "JD", "Other"].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Field of Study</label>
                  <input name="educationField" className="input" placeholder="e.g. Finance" />
                </div>
              </div>

              <div>
                <label className="label">Institution</label>
                <input name="institution" className="input" placeholder="e.g. University of Chicago" />
              </div>

              <div>
                <label className="label">Certifications (comma-separated)</label>
                <input name="certifications" className="input" placeholder="e.g. CFA, CPA, Series 7" />
              </div>

              <div>
                <label className="label">Years of Relevant Experience</label>
                <input name="yearsExperience" type="number" min={0} max={60} className="input" placeholder="e.g. 8" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                Complete Profile & Enter Massoteric →
              </button>

              <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)' }}>
                You can update all of this later in your profile settings.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
