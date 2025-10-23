import '../styles/HomePage.css';
import ThemeToggle from './ThemeToggle.jsx';
import {
  FiFolder,    // step 1
  FiActivity,  // step 2
  FiShield,    // step 3
  FiPieChart,  // feature 1
  FiZap,       // feature 2
  FiLock,      // feature 3
  FiBell       // feature 4
} from 'react-icons/fi';

export default function HomePage({ setCurrentPage }) {
  const envelopes = [
    { name: 'Groceries', amt: 240, max: 300 },
    { name: 'Transport', amt: 62, max: 120 },
    { name: 'Savings', amt: 920, max: 1000 },
    { name: 'Fun', amt: 80, max: 150 },
  ];

  return (
    <div className="page-container">
      {/* decorative gradient blobs */}
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-layout">
            <div
              className="logo-section"
              onClick={() => setCurrentPage('home')}
              style={{ cursor: 'pointer' }}
              aria-label="Cashvelo home"
            >
              <img src="/cat-envelope.jpg" alt="Cashvelo logo" className="logo-img" />
              <span className="project-name">Cashvelo</span>
            </div>

            <div className="nav-links">
              <button className="nav-link pill active" onClick={() => setCurrentPage('home')}>
                Home
              </button>
              <a href="#how" className="nav-link pill">How it works</a>
              <a href="#features" className="nav-link pill">Features</a>
              <a href="#why" className="nav-link pill">Why Cashvelo</a>

              <button onClick={() => setCurrentPage('login')} className="nav-link ghost-pill">
                Log in
              </button>

              <button
                className="nav-link cta-pill"
                onClick={() => setCurrentPage('signup')}
                aria-label="Create free account"
              >
                Create account
              </button>

              {/* Keep the real ThemeToggle; styled to show a clean “Theme” pill */}
              <div className="theme-toggle-wrap">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="main-content">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title">Budget beautifully.<br />Spend confidently.</h1>
            <p className="hero-subtitle">
              Cashvelo turns your income into simple envelopes, gives you crystal clear insights,
              and helps you stay consistent without spreadsheets or stress.
            </p>

            <div className="hero-actions">
              <button className="create-btn" onClick={() => setCurrentPage('signup')}>
                Start in 60 seconds →
              </button>
              <button
                className="ghost-btn"
                onClick={() =>
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                See a live demo
              </button>
            </div>
          </div>

          {/* Demo Card */}
          <div className="hero-demo" id="demo" role="img" aria-label="Demo of envelopes and insights">
            <div className="demo-head">
              <div className="demo-title">Envelopes</div>
              <div className="demo-chip">Demo</div>
            </div>

            <div className="demo-envelopes">
              {envelopes.map((e) => {
                const pct = Math.min(100, Math.round((e.amt / e.max) * 100));
                return (
                  <div key={e.name} className="env">
                    <div className="env-row">
                      <span className="env-name">{e.name}</span>
                      <span className="env-amt">${e.amt}</span>
                    </div>
                    <div className="env-bar">
                      <div className="env-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="demo-insights">
              <div className="insight">Month to date: <strong>$1,284</strong> tracked</div>
              <div className="insight">Safe to spend: <strong>$412</strong></div>
              <div className="insight">Upcoming: <strong>$96</strong> in 5 days</div>
            </div>
          </div>
        </div>

        <div className="badges">
          <span className="chip">Envelope budgeting</span>
          <span className="chip">Clear insights</span>
        </div>

        <p className="description">
          Cashvelo uses the <strong>cash envelope system</strong>, a visual method for setting limits,
          tracking spending, and keeping momentum month to month.
        </p>
      </header>

      {/* HOW IT WORKS */}
      <section id="how" className="about">
        <div className="about-inner">
          <h2 className="section-title">How Cashvelo keeps you on track</h2>
          <p className="section-intro">Three steps. Minutes to set up. Habits that last.</p>

          <ol className="how-steps">
            <li>
              <div className="img-placeholder" aria-hidden="true"><FiFolder /></div>
              <div>
                <h3>Create smart envelopes</h3>
                <p>Assign money to categories you actually use. We guide your splits based on goals and a typical month.</p>
              </div>
            </li>
            <li>
              <div className="img-placeholder" aria-hidden="true"><FiActivity /></div>
              <div>
                <h3>Track without friction</h3>
                <p>Log spending in seconds, import bank CSVs, and let rules auto tag transactions.</p>
              </div>
            </li>
            <li>
              <div className="img-placeholder" aria-hidden="true"><FiShield /></div>
              <div>
                <h3>Protect your plan</h3>
                <p>See safe to spend at a glance, get nudges before you overshoot, and roll leftovers to savings.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="feature-band">
        <div className="about-inner feature-grid">
          {[
            { title: 'Goals that feel doable', copy: 'Targets for travel, emergency fund, or debt payoff broken into weekly bites.' },
            { title: 'Delightfully fast', copy: 'Zero lag UI and offline first so your budget is ready the moment you open the app.' },
            { title: 'Private by design', copy: 'Your data stays on your device with optional encrypted backup. No selling data.' },
            { title: 'Gentle reminders', copy: 'Notifications arrive at the right moment, after a purchase or before a bill.' },
          ].map((f, idx) => {
            const Icon = [FiPieChart, FiZap, FiLock, FiBell][idx];
            return (
              <article className="feature-card feature-with-image" key={f.title}>
                <div className="feature-img img-placeholder" aria-hidden="true">
                  <Icon />
                </div>
                <div className="feature-body">
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-copy">{f.copy}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="about">
        <div className="about-inner">
          <h2 className="section-title">Why people stick with Cashvelo</h2>
        </div>
        <ul className="why-list">
          <li>Visual envelope system that clicks instantly</li>
          <li>Clear safe to spend so decisions feel easy</li>
          <li>Rollovers keep momentum month to month</li>
          <li>Works great solo or with a partner</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-inner">
          <div>
            <h3 className="cta-title">Ready to feel in control of money?</h3>
            <p className="cta-sub">Get started in minutes.</p>
          </div>
          <div className="hero-actions cta-actions">
            <button className="create-btn" onClick={() => setCurrentPage('signup')}>Create account</button>
            <button className="ghost-btn" onClick={() => setCurrentPage('login')}>I already have an account</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
    </div>
  );
}
