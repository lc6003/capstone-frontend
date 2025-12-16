import "../styles/HomePage.css"
import ThemeToggle from "../components/ThemeToggle.jsx"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  FiFolder,
  FiActivity,
  FiShield,
  FiPieChart,
  FiZap,
  FiLock,
  FiBell
} from "react-icons/fi"
import LanguageSwitcher from "../components/LanguageSwitcher.jsx"


export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const envelopes = [
    { name: t("home.envelopes.groceries", "Groceries"), amt: 240, max: 300 },
    { name: t("home.envelopes.transport", "Transport"), amt: 62, max: 120 },
    { name: t("home.envelopes.savings", "Savings"), amt: 920, max: 1000 },
    { name: t("home.envelopes.fun", "Fun"), amt: 80, max: 150 },
  ]

  return (
    <div className="page-container">
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />

      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-layout">
            <div
              className="logo-section"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
              aria-label={t("home.logoAria", "Cashvelo home")}
            >
              <img
                src="/cat-envelope.jpg"
                alt={t("home.logoAlt", "Cashvelo logo")}
                className="logo-img"
              />
              <span className="project-name">Cashvelo</span>
            </div>

            <div className="nav-links">
              <button
                className="nav-link pill active"
                onClick={() => navigate("/")}
              >
                {t("home.nav.home", "Home")}
              </button>
              <a href="#how" className="nav-link pill">
                {t("home.nav.how", "How it works")}
              </a>
              <a href="#features" className="nav-link pill">
                {t("home.nav.features", "Features")}
              </a>
              <a href="#why" className="nav-link pill">
                {t("home.nav.why", "Why Cashvelo")}
              </a>

              <button
                onClick={() => navigate("/login")}
                className="nav-link ghost-pill"
              >
                {t("home.nav.login", "Log in")}
              </button>

              <button
                className="nav-link cta-pill"
                onClick={() => navigate("/signup")}
                aria-label={t("home.nav.signupAria", "Create free account")}
              >
                {t("home.nav.signup", "Create account")}
              </button>
              <LanguageSwitcher />

              <div className="theme-toggle-wrap">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <header className="main-content">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title">
              {t("home.hero.titleLine1", "Budget beautifully.")}
              <br />
              {t("home.hero.titleLine2", "Spend confidently.")}
            </h1>
            <p className="hero-subtitle">
              {t(
                "home.hero.subtitle",
                "Cashvelo turns your income into simple envelopes, gives you crystal clear insights, and helps you stay consistent without spreadsheets or stress."
              )}
            </p>

            <div className="hero-actions">
              <button
                className="create-btn"
                onClick={() => navigate("/signup")}
              >
                {t("home.hero.primaryCta", "Start in 60 seconds →")}
              </button>
              <button
                className="ghost-btn"
                onClick={() =>
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("home.hero.secondaryCta", "See a live demo")}
              </button>
            </div>
          </div>

          <div
            className="hero-demo"
            id="demo"
            role="img"
            aria-label={t("home.demo.aria", "Demo of envelopes and insights")}
          >
            <div className="demo-head">
              <div className="demo-title">
                {t("home.demo.title", "Envelopes")}
              </div>
              <div className="demo-chip">
                {t("home.demo.chip", "Demo")}
              </div>
            </div>

            <div className="demo-envelopes">
              {envelopes.map((e) => {
                const pct = Math.min(100, Math.round((e.amt / e.max) * 100))
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
                )
              })}
            </div>

            <div className="demo-insights">
              <div className="insight">
                {t("home.demo.insights.mtd", "Month to date:")}{" "}
                <strong>$1,284</strong>{" "}
                {t("home.demo.insights.mtdSuffix", "tracked")}
              </div>
              <div className="insight">
                {t("home.demo.insights.safe", "Safe to spend:")}{" "}
                <strong>$412</strong>
              </div>
              <div className="insight">
                {t("home.demo.insights.upcoming", "Upcoming:")}{" "}
                <strong>$96</strong>{" "}
                {t("home.demo.insights.upcomingSuffix", "in 5 days")}
              </div>
            </div>
          </div>
        </div>

        <div className="badges">
          <span className="chip">
            {t("home.badges.envelope", "Envelope budgeting")}
          </span>
          <span className="chip">
            {t("home.badges.insights", "Clear insights")}
          </span>
        </div>

        <p className="description">
          {t(
            "home.description",
            "Cashvelo uses the cash envelope system, a visual method for setting limits, tracking spending, and keeping momentum month to month."
          )}
        </p>
      </header>

      <section id="how" className="about">
        <div className="about-inner">
          <h2 className="section-title">
            {t("home.how.title", "How Cashvelo keeps you on track")}
          </h2>
          <p className="section-intro">
            {t(
              "home.how.subtitle",
              "Three steps. Minutes to set up. Habits that last."
            )}
          </p>

          <ol className="how-steps">
            <li>
              <div className="img-placeholder" aria-hidden="true">
                <FiFolder />
              </div>
              <div>
                <h3>
                  {t(
                    "home.how.step1.title",
                    "Create smart envelopes"
                  )}
                </h3>
                <p>
                  {t(
                    "home.how.step1.body",
                    "Assign money to categories you actually use. We guide your splits based on goals and a typical month."
                  )}
                </p>
              </div>
            </li>
            <li>
              <div className="img-placeholder" aria-hidden="true">
                <FiActivity />
              </div>
              <div>
                <h3>
                  {t(
                    "home.how.step2.title",
                    "Track without friction"
                  )}
                </h3>
                <p>
                  {t(
                    "home.how.step2.body",
                    "Log spending in seconds, import bank CSVs, and let rules auto tag transactions."
                  )}
                </p>
              </div>
            </li>
            <li>
              <div className="img-placeholder" aria-hidden="true">
                <FiShield />
              </div>
              <div>
                <h3>
                  {t(
                    "home.how.step3.title",
                    "Protect your plan"
                  )}
                </h3>
                <p>
                  {t(
                    "home.how.step3.body",
                    "See safe to spend at a glance, get nudges before you overshoot, and roll leftovers to savings."
                  )}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section id="features" className="feature-band">
        <div className="about-inner feature-grid">
          {[
            {
              Icon: FiPieChart,
              titleKey: "home.features.goals.title",
              defaultTitle: "Goals that feel doable",
              copyKey: "home.features.goals.copy",
              defaultCopy:
                "Targets for travel, emergency fund, or debt payoff broken into weekly bites."
            },
            {
              Icon: FiZap,
              titleKey: "home.features.fast.title",
              defaultTitle: "Delightfully fast",
              copyKey: "home.features.fast.copy",
              defaultCopy:
                "Zero lag UI and offline first so your budget is ready the moment you open the app."
            },
            {
              Icon: FiLock,
              titleKey: "home.features.private.title",
              defaultTitle: "Private by design",
              copyKey: "home.features.private.copy",
              defaultCopy:
                "Your data stays on your device with optional encrypted backup. No selling data."
            },
            {
              Icon: FiBell,
              titleKey: "home.features.reminders.title",
              defaultTitle: "Gentle reminders",
              copyKey: "home.features.reminders.copy",
              defaultCopy:
                "Notifications arrive at the right moment, after a purchase or before a bill."
            }
          ].map((f) => (
            <article
              className="feature-card feature-with-image"
              key={f.titleKey}
            >
              <div className="feature-img img-placeholder" aria-hidden="true">
                <f.Icon />
              </div>
              <div className="feature-body">
                <h3 className="feature-title">
                  {t(f.titleKey, f.defaultTitle)}
                </h3>
                <p className="feature-copy">
                  {t(f.copyKey, f.defaultCopy)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="why" className="about">
        <div className="about-inner">
          <h2 className="section-title">
            {t("home.why.title", "Why people stick with Cashvelo")}
          </h2>
        </div>
        <ul className="why-list">
          <li>
            {t(
              "home.why.item1",
              "Visual envelope system that clicks instantly"
            )}
          </li>
          <li>
            {t(
              "home.why.item2",
              "Clear safe to spend so decisions feel easy"
            )}
          </li>
          <li>
            {t(
              "home.why.item3",
              "Rollovers keep momentum month to month"
            )}
          </li>
          <li>
            {t(
              "home.why.item4",
              "Works great solo or with a partner"
            )}
          </li>
        </ul>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <div>
            <h3 className="cta-title">
              {t(
                "home.cta.title",
                "Ready to feel in control of money?"
              )}
            </h3>
            <p className="cta-sub">
              {t(
                "home.cta.subtitle",
                "Get started in minutes."
              )}
            </p>
          </div>
          <div className="hero-actions cta-actions">
            <button
              className="create-btn"
              onClick={() => navigate("/signup")}
            >
              {t("home.cta.primaryCta", "Create account")}
            </button>
            <button
              className="ghost-btn"
              onClick={() => navigate("/login")}
            >
              {t(
                "home.cta.secondaryCta",
                "I already have an account"
              )}
            </button>
          </div>
        </div>
      </section>

 <section className="about budget-links">
        <div className="about-inner">
          <h2 className="section-title">Why budgeting helps</h2>
          <p className="section-intro">
          Budgeting doesn’t mean you can’t spend. It simply helps you understand where your money goes. 
          When you have a plan, life feels less stressful, you stay more organized, 
          and you move closer to your goals.
          </p>

          <div className="budget-single-card">
            <h3>Learn more (English)</h3>
            <p className="budget-links-text">
              Beginner-friendly guides that explain how budgeting creates
              clarity, reduces stress, and helps you make better financial
              decisions.
            </p>

            <ul>
              <li>
                <a
                  href="https://www.experian.com/blogs/ask-experian/why-is-budgeting-important/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Why is budgeting important? — Experian
                </a>
              </li>
              <li>
                <a
                  href="https://consumer.gov/your-money/making-budget"
                  target="_blank"
                  rel="noreferrer"
                >
                  How to manage your money — Consumer.gov
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about budget-links">
        <div className="about-inner">
          <h2 className="section-title">Por qué el presupuesto ayuda</h2>
          <p className="section-intro">
            Hacer un presupuesto no significa limitarte; significa tomar control.
            Un plan claro te ayuda a evitar deudas, ahorrar para tus metas,
            prevenir sorpresas y sentir más tranquilidad con tu dinero.
          </p>

          <div className="budget-single-card">
            <h3>Aprende más (Español)</h3>
            <p className="budget-links-text">
              Recursos en español que explican cómo empezar, organizar mejor tus
              gastos y manejar tu dinero con más seguridad.
            </p>

            <ul>
              <li>
                <a
                  href="https://www.usa.gov/es/articulos/consejos-para-tener-un-presupuesto"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consejos para tener un presupuesto — USA.gov
                </a>
              </li>
              <li>
                <a
                  href="https://consumidor.gov/su-dinero/como-hacer-un-presupuesto"
                  target="_blank"
                  rel="noreferrer"
                >
                  Cómo hacer un presupuesto — Consumidor.gov
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Cashvelo
      </footer>
    </div>
  )
}
