'use client'

// src/app/LandingPageContent.tsx
// Landing page client component — Massoteric home

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './LandingPageContent.module.css'

interface TickerMarket {
  prob: string
  text: string
  cat: string
}

interface LandingPageContentProps {
  userCount: number
  marketCount: number
  predictionCount: number
  tickerMarkets: TickerMarket[]
}

// Format compact numbers (e.g., 47000 -> "47k+")
function formatCompact(num: number): string {
  if (num >= 1000) {
    const suffixes = ['', 'k', 'M', 'B']
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3)
    if (tier === 0) return num.toString()
    const suffix = suffixes[tier]
    const scale = Math.pow(10, tier * 3)
    const scaled = num / scale
    return `${Math.floor(scaled)}${suffix}+`
  }
  return num.toString()
}

export default function LandingPageContent(props: LandingPageContentProps) {
  const router = useRouter()
  const dotsRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState({ hero: '', cta: '' })

  useEffect(() => {
    // Constellation dots animation
    const dotsEl = dotsRef.current
    if (!dotsEl) return

    for (let i = 0; i < 60; i++) {
      const d = document.createElement('div')
      d.className = styles.dot
      d.style.left = `${Math.random() * 100}%`
      d.style.top = `${Math.random() * 100}%`
      d.style.setProperty('--dur', `${3 + Math.random() * 5}s`)
      d.style.setProperty('--delay', `${Math.random() * 6}s`)
      d.style.setProperty('--peak', (0.15 + Math.random() * 0.5).toFixed(2))
      dotsEl.appendChild(d)
    }

    // Smooth nav highlight
    const handleScroll = () => {
      const sections = ['how', 'features', 'who']
      let current = ''
      sections.forEach(id => {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 120) current = id
      })
      document.querySelectorAll(`.${styles.navLink}`).forEach(a => {
        const aEl = a as HTMLAnchorElement
        aEl.style.color = aEl.getAttribute('href') === `#${current}` ? 'var(--gold)' : 'var(--mist)'
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignup = () => {
    // Redirect to sign-up page when user requests access
    router.push('/sign-up')
  }

  return (
    <div className={styles.landingPage}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          Mass<span className={styles.navLogoSpan}>oteric</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div className={styles.navLinks}>
            <a href="#how" className={styles.navLink}>How It Works</a>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#who" className={styles.navLink}>Who It&apos;s For</a>
          </div>
          <Link href="/sign-up" className={styles.navCta}>Join Early Access</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div ref={dotsRef} className={styles.dots} />

        <div className={styles.heroEyebrow}>
          Early Access — Now Open
        </div>

        <h1 className={styles.heroTitle}>
          The world&apos;s<br /><em className={styles.heroTitleEm}>most informed</em><br />predictions.
        </h1>

        <div className={styles.heroSubtitle}>
          Expert forecasts. Documented reasoning. Verified track records. Finally accessible to everyone.
        </div>

        <div className={styles.heroDivider} />

        <p className={styles.heroDesc}>
          Massoteric aggregates prediction markets, surfaces expert analysis, and holds every forecaster accountable — in public, with a score.
        </p>

        <div className={styles.heroForm}>
          <input
            type="email"
            placeholder="Your email address"
            value={email.hero}
            onChange={(e) => setEmail(prev => ({ ...prev, hero: e.target.value }))}
            className={styles.heroFormInput}
          />
          <button
            type="button"
            onClick={handleSignup}
            className={styles.heroFormButton}
          >
            Request Access
          </button>
        </div>

        <p className={styles.heroNote}>
          No spam. No noise. Early members shape the platform.
        </p>
      </section>

      {/* Live market ticker */}
      <div className={styles.tickerWrap}>
        <div className={styles.ticker}>
          {(() => {
            const displayMarkets = props.tickerMarkets.length > 0
              ? props.tickerMarkets
              : [{ prob: '50%', text: 'Loading live markets...', cat: 'All' }]
            const duplicated = [...displayMarkets, ...displayMarkets]
            return duplicated.map((item, i) => (
              <div key={i} className={styles.tickerItem}>
                <span className={styles.tickerProb}>{item.prob}</span>
                <span className={styles.tickerDotSep}>·</span>
                {item.text}
                <span className={styles.tickerDotSep}>·</span>
                {item.cat}
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Problem */}
      <section className={`${styles.section} ${styles.problem}`} id="problem">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>The Problem</div>
          <div className={styles.problemGrid}>
            <div>
              <div className={styles.problemQuote}>
                &quot;Credentials are unverifiable. Track records are not.&quot;
              </div>
            </div>
            <div className={styles.problemPoints}>
              <div className={styles.problemPoint}>
                <span className={styles.ppNum}>01</span>
                <p className={styles.ppText}>
                  <strong className={styles.ppTextStrong}>Expert analysis is locked behind paywalls</strong> — Bloomberg terminals, hedge fund research, proprietary models. The insights that move markets never reach ordinary people.
                </p>
              </div>
              <div className={styles.problemPoint}>
                <span className={styles.ppNum}>02</span>
                <p className={styles.ppText}>
                  <strong className={styles.ppTextStrong}>Pundits have no accountability.</strong> Journalists, analysts, and politicians make predictions constantly — and are never scored on them.
                </p>
              </div>
              <div className={styles.problemPoint}>
                <span className={styles.ppNum}>03</span>
                <p className={styles.ppText}>
                  <strong className={styles.ppTextStrong}>There is nowhere to find the genuinely accurate thinkers</strong> — the ones who&apos;ve been quietly right about finance, politics, and markets for years, without a platform to prove it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`${styles.section} ${styles.how}`} id="how">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>How It Works</div>
          <div className={styles.sectionTitle}>
            Four steps to<br /><em className={styles.sectionTitleEm}>verified expertise.</em>
          </div>
          <div className={styles.steps}>
            {[
              { num: '01', title: 'Pick a Market', body: 'Browse live prediction markets from Polymarket, Kalshi, and Metaculus — or explore community-created topics on anything from AI breakthroughs to economic policy.' },
              { num: '02', title: 'Post Your Prediction', body: 'Submit your probability estimate with written reasoning. Every prediction is timestamped. Every edit is logged. The record is permanent.' },
              { num: '03', title: 'Get Scored', body: 'When markets resolve, your accuracy is calculated automatically using the Brier Score — the gold standard for measuring probabilistic forecasting skill.' },
              { num: '04', title: 'Build Your Reputation', body: 'Your public profile shows your track record by topic, over time. Prove your edge. Attract followers. Monetize what you actually know.' },
            ].map((step, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepBody}>{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo / In Practice */}
      <section className={`${styles.section} ${styles.demo}`} id="demo">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>In Practice</div>
          <div className={styles.sectionTitle}>
            See what<br /><em className={styles.sectionTitleEm}>accountability</em> looks like.
          </div>
          <div className={styles.demoGrid}>
            {/* Left: prediction cards */}
            <div>
              <div className={styles.predCard}>
                <div className={styles.predHeader}>
                  <div className={styles.predName}>
                    Marcus T. — CFA, Macro Economist
                  </div>
                  <div className={styles.predScoreBadge}>
                    94% accurate
                  </div>
                </div>
                <div className={styles.predMarket}>
                  Will the Fed cut interest rates before September 2025?
                </div>
                <div className={styles.predProbRow}>
                  <div>
                    <div className={styles.predProb}>70%</div>
                    <div className={styles.predProbLabel}>Probability estimate</div>
                  </div>
                </div>
                <div className={styles.predBar}>
                  <div className={styles.predBarFill} style={{ width: '70%' }} />
                </div>
                <div className={styles.predSnippet}>
                  &quot;The Fed has been signaling a dovish pivot. Inflation is trending toward 2.5% and labor markets are softening. Historical patterns from 2019 suggest the committee moves decisively once core PCE falls below 2.6% for two consecutive months...&quot;
                </div>
                <div className={styles.predLock}>
                  <span>🔒 Continue reading — full analysis</span>
                  <button className={styles.predLockBtn}>Unlock</button>
                </div>
              </div>

              <div className={styles.predCard}>
                <div className={styles.predHeader}>
                  <div className={styles.predName}>
                    Dr. Reyes — Political Economist
                  </div>
                  <div className={styles.predScoreBadge}>
                    91% accurate
                  </div>
                </div>
                <div className={styles.predMarket}>
                  Will the Fed cut interest rates before September 2025?
                </div>
                <div className={styles.predProbRow}>
                  <div>
                    <div className={`${styles.predProb} ${styles.predProbGold}`}>55%</div>
                    <div className={styles.predProbLabel}>Probability estimate</div>
                  </div>
                </div>
                <div className={styles.predBar}>
                  <div className={styles.predBarFill} style={{ width: '55%' }} />
                </div>
                <div className={styles.predSnippet}>
                  &quot;Powell&apos;s recent testimony was more hawkish than expected. Markets are pricing in optimism the data doesn&apos;t fully support. The dot plot revision shows the committee is split...&quot;
                </div>
                <div className={styles.predLock}>
                  <span>🔒 Continue reading — full analysis</span>
                  <button className={styles.predLockBtn}>Unlock</button>
                </div>
              </div>
            </div>

            {/* Right: stats + leaderboard */}
            <div className={styles.demoRight}>
              <div className={styles.demoStatRow}>
                <div className={styles.demoStat}>
                  <span className={styles.demoStatVal}>{props.userCount.toLocaleString()}</span>
                  <span className={styles.demoStatLabel}>Registered Users</span>
                </div>
                <div className={styles.demoStat}>
                  <span className={styles.demoStatVal}>{props.marketCount.toLocaleString()}</span>
                  <span className={styles.demoStatLabel}>Live Markets</span>
                </div>
              </div>
              <div className={styles.demoStatRow}>
                <div className={styles.demoStat}>
                  <span className={styles.demoStatVal}>{formatCompact(props.predictionCount)}</span>
                  <span className={styles.demoStatLabel}>Predictions Made</span>
                </div>
                <div className={styles.demoStat}>
                  <span className={styles.demoStatVal}>71%</span>
                  <span className={styles.demoStatLabel}>Avg. Accuracy</span>
                </div>
              </div>

              <div className={styles.leaderboard}>
                <div className={styles.lbHeader}>Top Predictors This Week</div>
                <div className={styles.lbRow}>
                  <div className={styles.lbRank}>#1</div>
                  <div className={styles.lbAvatar}>MT</div>
                  <div className={styles.lbName}>Marcus T.</div>
                  <div className={styles.lbCat}>Finance</div>
                  <div className={styles.lbScore}>94%</div>
                </div>
                <div className={styles.lbRow}>
                  <div className={styles.lbRank}>#2</div>
                  <div className={styles.lbAvatar}>DR</div>
                  <div className={styles.lbName}>Dr. Reyes</div>
                  <div className={styles.lbCat}>Politics</div>
                  <div className={styles.lbScore}>91%</div>
                </div>
                <div className={styles.lbRow}>
                  <div className={styles.lbRank}>#3</div>
                  <div className={styles.lbAvatar}>CL</div>
                  <div className={styles.lbName}>CryptoLens</div>
                  <div className={styles.lbCat}>Crypto</div>
                  <div className={styles.lbScore}>88%</div>
                </div>
                <div className={styles.lbRow}>
                  <div className={styles.lbRank}>#4</div>
                  <div className={styles.lbAvatar}>SS</div>
                  <div className={styles.lbName}>SportsSage</div>
                  <div className={styles.lbCat}>Sports</div>
                  <div className={styles.lbScore}>85%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className={`${styles.section} ${styles.who}`} id="who">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Who It&apos;s For</div>
          <div className={styles.sectionTitle}>
            Two sides of<br /><em className={styles.sectionTitleEm}>the same insight.</em>
          </div>
          <div className={styles.whoGrid}>
            {[
              { icon: '🎯', title: 'The Experts', body: 'You&apos;ve been right. Consistently. About markets, politics, macro trends — topics where most people are just guessing. Massoteric gives you a platform to prove it publicly and profit from it.', list: ['Build a verified, permanent track record', 'Attract subscribers who pay for your analysis', 'Rise through leaderboards by topic', 'Your accuracy score does the marketing for you'] },
              { icon: '🔍', title: 'The Curious', body: 'You want signal, not noise. Access to the kind of clear-eyed analysis that used to be reserved for institutions and insiders. Massoteric brings it into the open — ranked, scored, and searchable.', list: ['Follow experts proven accurate on your topics', 'Filter by accuracy, not follower count', 'Read the reasoning, not just the conclusion', 'Access insights on finance, politics, crypto, and more'] },
            ].map((card, i) => (
              <div key={i} className={styles.whoCard}>
                <div className={styles.whoIcon}>{card.icon}</div>
                <div className={styles.whoTitle}>{card.title}</div>
                <div className={styles.whoBody}>{card.body}</div>
                <div className={styles.whoList}>
                  {card.list.map((item, j) => (
                    <div key={j} className={styles.whoItem}>
                      <span className={styles.whoItemDash}>—</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`${styles.section} ${styles.features}`} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Platform Features</div>
          <div className={styles.sectionTitle}>
            Everything built<br />around <em className={styles.sectionTitleEm}>accountability.</em>
          </div>
          <div className={styles.featuresGrid}>
            {[
              { icon: '📡', title: 'Market Aggregation', body: 'Live markets from Polymarket, Kalshi, Metaculus and more — one feed, organized by topic. Plus community-created questions on any subject.', tag: 'Free', tagType: 'free' },
              { icon: '📝', title: 'Prediction with Reasoning', body: 'Post a probability estimate alongside your written logic. Every edit is timestamped. Predictions lock before market resolution.', tag: 'Free', tagType: 'free' },
              { icon: '📊', title: 'Brier Score Accuracy', body: 'The gold standard of forecasting measurement. Your score is calculated automatically at resolution — overall and by topic.', tag: 'Free', tagType: 'free' },
              { icon: '🔒', title: 'Full Analysis Access', body: 'Free users see a teaser. Paid members read the complete reasoning, filter by accuracy score, and follow specific forecasters.', tag: 'Paid', tagType: 'paid' },
              { icon: '🏆', title: 'Expert Leaderboards', body: 'Ranked by category, time period, and overall score. Find the most accurate voice on any topic — fast.', tag: 'Paid', tagType: 'paid' },
              { icon: '💰', title: 'Creator Monetization', body: 'Proven forecasters can offer subscriptions, exclusive Q&A, and early access to their analysis. Set your own price. Keep 85% of revenue. Turn your accuracy into income.', tag: 'Live', tagType: 'paid' },
            ].map((feat, i) => (
              <div key={i} className={styles.feat}>
                <div className={styles.featIcon}>{feat.icon}</div>
                <div className={styles.featTitle}>{feat.title}</div>
                <div className={styles.featBody}>{feat.body}</div>
                <span className={`${styles.featTag} ${feat.tagType === 'free' ? styles.tagFree : styles.tagPaid}`}>
                  {feat.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaWrapper}>
          <h2 className={styles.ctaTitle}>
            Be first to<br /><em className={styles.ctaTitleEm}>know more.</em>
          </h2>
          <p className={styles.ctaSub}>
            Early members shape the platform, get founding member pricing, and access Massoteric before the public launch.
          </p>
          <div className={styles.ctaForm}>
            <input
              type="email"
              placeholder="Your email address"
              value={email.cta}
              onChange={(e) => setEmail(prev => ({ ...prev, cta: e.target.value }))}
              className={styles.ctaFormInput}
            />
            <button
              type="button"
              onClick={handleSignup}
              className={styles.ctaFormButton}
            >
              Join Early Access
            </button>
          </div>
          <p className={styles.ctaNote}>
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          Mass<span className={styles.footerLogoSpan}>oteric</span>
        </div>
        <p className={styles.footerCopy}>
          © 2026 Massoteric. All rights reserved.
        </p>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy</a>
          <a href="#" className={styles.footerLink}>Terms</a>
          <a href="#" className={styles.footerLink}>Contact</a>
        </div>
      </footer>
    </div>
  )
}
