import React, { useEffect, useState } from 'react';
import photographerImg from './assets/hero/photographer.jpg';
import bakerImg from './assets/hero/baker.jpg';
import tailorImg from './assets/hero/tailor.jpg';
import decoratorImg from './assets/hero/decorator.jpg';

const SCENES = [
  {
    id: 'photographer',
    role: 'Photographer',
    image: photographerImg,
    alt: 'Independent wedding photographer outdoors holding a camera in warm natural light',
    outcome: 'Illustrative example: 0.05 test ETH deposit → Confirmed automatically on-chain'
  },
  {
    id: 'baker',
    role: 'Baker',
    image: bakerImg,
    alt: 'Independent cake baker finishing a tiered celebration cake in a sunlit kitchen',
    outcome: 'Illustrative example: 120 test USDC deposit → Released to merchant after refund cutoff'
  },
  {
    id: 'tailor',
    role: 'Tailor',
    image: tailorImg,
    alt: 'Independent bespoke tailor measuring fabric on a tailored jacket in a workshop',
    outcome: 'Illustrative example: 0.02 test ETH deposit → Full refund reserved before cutoff'
  },
  {
    id: 'decorator',
    role: 'Event decorator',
    image: decoratorImg,
    alt: 'Independent event decorator arranging white floral centerpieces on a reception table',
    outcome: 'Illustrative example: Unpaid quote past deadline → Expired automatically'
  }
];

export function Landing({
  account,
  busy,
  short,
  connect,
  disconnect,
  navigate
}: {
  account: string;
  busy: boolean;
  short: (address: string) => string;
  connect: () => void;
  disconnect: () => void;
  navigate: (route: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % SCENES.length), 5000);
    return () => clearInterval(timer);
  }, [paused, reducedMotion]);

  const current = SCENES[index];

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="wordmark landing-wordmark" href={location.pathname} onClick={e => { e.preventDefault(); navigate(''); }}>Settlio</a>
        <nav className="landing-nav" aria-label="Landing">
          <a href="#how-it-works">How it works</a>
          <a href="#rules">Automation rules</a>
          <button type="button" className="text-nav" onClick={() => navigate('?screen=quotes')}>Quotes</button>
        </nav>
        <div className="landing-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            title={account ? 'Disconnect wallet' : 'Connect wallet'}
            onClick={account ? disconnect : connect}
          >
            {account ? short(account) + ' · Disconnect' : 'Connect wallet'}
          </button>
          <button type="button" className="primary" onClick={() => navigate('?screen=new')}>
            Create a quote
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-grid" aria-label="Introduction">
          <div className="hero-copy">
            <h1>Turn quotes into confirmed bookings</h1>
            <p className="hero-lead">
              Quote, collect a deposit, and secure your next booking. Built for independent service businesses.
            </p>
            <div className="hero-cta-row">
              <button type="button" className="primary hero-cta" onClick={() => navigate('?screen=new')}>
                Create a quote
              </button>
              <button type="button" className="secondary" onClick={() => navigate('?screen=quotes')}>
                Open merchant workspace
              </button>
            </div>
            <p className="helper">
              Runs on Base Sepolia (test ETH &amp; USDC) with Reactive Network automation. No fabricated live metrics.
            </p>
          </div>

          <div className="hero-media-card">
            <div className="hero-frame" role="region" aria-roledescription="carousel" aria-label="Service business examples">
              {SCENES.map((scene, i) => (
                <img
                  key={scene.id}
                  src={scene.image}
                  alt={scene.alt}
                  className={'hero-photo' + (i === index ? ' is-active' : '')}
                  aria-hidden={i !== index}
                />
              ))}
              <div className="hero-caption">
                <span className="hero-role-badge">{current.role}</span>
                <p>{current.outcome}</p>
              </div>
            </div>
            <div className="hero-controls">
              <div className="hero-dots" role="tablist" aria-label="Choose service scene">
                {SCENES.map((scene, i) => (
                  <button
                    key={scene.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={scene.role}
                    className={'hero-dot' + (i === index ? ' is-active' : '')}
                    onClick={() => setIndex(i)}
                  >
                    {scene.role}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="secondary hero-pause"
                aria-pressed={paused}
                onClick={() => setPaused(p => !p)}
              >
                {paused || reducedMotion ? 'Play scenes' : 'Pause scenes'}
              </button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="steps-section">
          <h2>A simple way to book clients</h2>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-icon" aria-hidden="true">1</span>
              <div>
                <h3>Send a quote</h3>
                <p>Share a clear service quote with exact deposit, payment deadline, and refund cutoff.</p>
              </div>
            </article>
            <article className="step-card">
              <span className="step-icon" aria-hidden="true">2</span>
              <div>
                <h3>Get the deposit</h3>
                <p>Clients review fixed terms and pay in test ETH or USDC from their wallet.</p>
              </div>
            </article>
            <article className="step-card">
              <span className="step-icon" aria-hidden="true">3</span>
              <div>
                <h3>Confirm the booking</h3>
                <p>Reactive Network verifies the deposit and updates the booking on-chain.</p>
              </div>
            </article>
          </div>
        </section>

        <section id="rules" className="rules-section">
          <h2>Automation rules</h2>
          <div className="rules-grid">
            <article className="rule-card">
              <h3>Immutable quote terms</h3>
              <p>Service terms, deposit amounts, deadlines, and release rules are hashed on-chain at creation.</p>
            </article>
            <article className="rule-card">
              <h3>Scheduled expiry</h3>
              <p>Unpaid quotes past the payment deadline are rejected by the contract and marked expired automatically.</p>
            </article>
            <article className="rule-card">
              <h3>Customer refund priority</h3>
              <p>An eligible cancellation before the full-refund cutoff reserves the deposit immediately in its original asset.</p>
            </article>
            <article className="rule-card">
              <h3>Separate automation funding</h3>
              <p>Customer deposits stay isolated in Base Sepolia escrow and never pay Reactive network fees.</p>
            </article>
          </div>
        </section>

        <footer className="landing-footer">
          <span>Settlio · Base Sepolia &amp; Reactive Lasna testnet</span>
          <a href="https://github.com/0xaje/Settlio" target="_blank" rel="noreferrer">View source</a>
        </footer>
      </main>
    </div>
  );
}
