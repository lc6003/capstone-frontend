import "../styles/HomePage.css";
import ThemeToggle from "../components/ThemeToggle.jsx";


export default function HomePage({ setCurrentPage, user }) {
  const envelopes = [
    { name: 'Groceries', amt: 240, max: 300 },
    { name: 'Transport', amt: 62, max: 120 },
    { name: 'Savings', amt: 920, max: 1000 },
    { name: 'Fun', amt: 80, max: 150 },
  ];

  return (
    <div className="page-container flex flex-col min-h-screen">
      {/* Decorative blobs */}
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />

      {/* Reusable Navbar */}
      <Navbar setCurrentPage={setCurrentPage} user={user} />

      {/* HERO / Main Content */}
      <main className="main-content flex-grow">
        <div className="hero-grid">
          {/* Copy */}
          <div className="hero-copy">
            <div className="hero-badge">Free forever • No subscriptions</div>
            <h1 className="hero-title">Budget beautifully. Spend confidently.</h1>
            <p className="hero-subtitle">
              Cashvelo turns your income into simple envelopes, gives you crystal-clear insights,
              and helps you stay consistent—without spreadsheets or stress.
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

            <ul className="trust-points">
              <li>No ads • no selling data</li>
              <li>Works offline-first</li>
              <li>Import from CSV in one click</li>
            </ul>
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
              <div className="insight">Month-to-date: <strong>$1,284</strong> tracked</div>
              <div className="insight">Safe-to-spend: <strong>$412</strong></div>
              <div className="insight">Upcoming: <strong>$96</strong> in 5 days</div>
            </div>
          </div>
        </div>

        <div className="badges">
          <span className="chip">Free forever</span>
          <span className="chip">Envelope budgeting</span>
          <span className="chip">Clear insights</span>
        </div>

        <button className="create-btn" onClick={() => setCurrentPage('signup')}>
          Create Account
        </button>

        <p className="description">
          Cashvelo uses the <strong>cash envelope system</strong>—a visual method for setting limits,
          tracking spending, and keeping momentum month to month.
        </p>
      </main>

      {/* Sections (How it works, Features, Why, CTA) remain unchanged */}
      {/* ...copy all your existing sections here... */}

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}
