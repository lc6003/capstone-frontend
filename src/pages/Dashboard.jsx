import { Link } from "react-router-dom"
import {
  totals,
  monthInsights,
  getBudgetTotalsByType,
  getIncomeTotals,
  getTotalCreditCardDebt
} from "../lib/storage.js"
import "../styles/dashboard.css"
import { useTranslation } from "react-i18next"

const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—")

export default function Dashboard(){
  const { t } = useTranslation()

  const tTotals = totals() || {}
  const total = Number.isFinite(tTotals?.total) ? tTotals.total : 0
  const byCategory = tTotals?.byCategory || {}
  const budgetLimits = tTotals?.budgetLimits || {}
  const m = monthInsights() || {}
  const sum = Number.isFinite(m?.sum) ? m.sum : 0
  const b = getBudgetTotalsByType() || {}
  const budgetedTotal = Number.isFinite(b?.total) ? b.total : 0
  const inc = getIncomeTotals() || {}
  const actual = Number.isFinite(inc?.actual) ? inc.actual : 0
  const expected = Number.isFinite(inc?.expected) ? inc.expected : 0
  const debtRaw = getTotalCreditCardDebt?.()
  const totalDebt = Number.isFinite(debtRaw) ? debtRaw : 0

  const categories = Object.keys(byCategory)
  const overs = categories.filter(c => {
    const spent = Number(byCategory[c]) || 0
    const limit = budgetLimits[c]
    return Number.isFinite(limit) && spent > limit
  })

  const envelopeItems = categories.map(c => {
    const spent = Number(byCategory[c]) || 0
    const limit = budgetLimits[c]
    const pct = Number.isFinite(limit) && limit > 0
      ? Math.min(100, Math.round((spent / limit) * 100))
      : 0
    return { name: c, spent, limit, pct }
  }).sort((a, b) => b.pct - a.pct).slice(0, 8)

  return(
    <div className="dashboard-page-wrapper">
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />
      <div className="dashboard-container dash">
        <div className="grid">
          <section className="card col-12">
            <h2>{t("dashboard.welcomeTitle")}</h2>
            <p className="muted">{t("dashboard.welcomeSubtitle")}</p>
            <div className="row gap-8">
              <Link to="/expenses" className="btn secondary">
                {t("dashboard.buttons.addExpense")}
              </Link>
              <Link to="/budget" className="btn secondary">
                {t("dashboard.buttons.newBudget")}
              </Link>
              <Link to="/insights" className="btn">
                {t("dashboard.buttons.viewInsights")}
              </Link>
            </div>
          </section>

          <section className="card col-6 kpi">
            <h3>{t("dashboard.incomeTitle")}</h3>
            <p className="muted">{t("dashboard.incomeSubtitle")}</p>
            <div className="stat"><b>{money(actual)}</b></div>
            <p className="muted label">
              {t("dashboard.incomeExpectedLabel")} <b>{money(expected)}</b>
            </p>
          </section>

          <section className="card col-6 kpi">
            <h3>{t("dashboard.totalBudgetedTitle")}</h3>
            <div className="stat">{money(budgetedTotal)}</div>
            <p className="muted label">{t("dashboard.totalBudgetedSubtitle")}</p>
          </section>

          <section className="card col-6 kpi">
            <h3>{t("dashboard.totalSpentTitle")}</h3>
            <div className="stat">{money(total)}</div>
            <p className="muted label">
              {t("dashboard.totalSpentSubtitle")} <b>{money(sum)}</b>
            </p>
          </section>

          <section className="card col-6 kpi">
            <h3>{t("dashboard.debtTitle")}</h3>
            <div className="stat">{money(totalDebt)}</div>
            <p className="muted">{t("dashboard.debtSubtitle")}</p>
          </section>

          <section className="card col-12">
            <h3>{t("dashboard.envelopesTitle")}</h3>
            {envelopeItems.length === 0 ? (
              <p className="muted">
                {t("dashboard.envelopesEmpty")}{" "}
                <Link to="/budget">Budget</Link>
              </p>
            ) : (
              <div className="envelopes">
                {envelopeItems.map(e => (
                  <div key={e.name} className="panel">
                    <div className="panel-head">
                      <strong>{e.name}</strong>
                      <span className="muted">
                        {money(e.spent)}
                        {Number.isFinite(e.limit)
                          ? ` / ${money(e.limit).slice(1)}`
                          : ""}
                      </span>
                    </div>
                    <div className="progress">
                      <div style={{ width: `${e.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card col-6">
            <h3>{t("dashboard.budgetsAtRiskTitle")}</h3>
            {overs.length === 0 ? (
              <p className="muted">{t("dashboard.budgetsAtRiskEmpty")}</p>
            ) : (
              <ul className="list">
                {overs.map(c => {
                  const spent = Number(byCategory[c]) || 0
                  const limit = budgetLimits[c]
                  return(
                    <li key={c} className="list-row">
                      <span>{c}</span>
                      <span>
                        {money(spent)} / {Number.isFinite(limit) ? money(limit) : "—"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="card col-12 mt-16">
            <h3>{t("dashboard.byCategoryTitle")}</h3>
            {categories.length === 0 ? (
              <p className="muted">
                {t("dashboard.byCategoryEmpty")}{" "}
                <Link to="/expenses">Expenses</Link>
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("dashboard.table.category")}</th>
                    <th>{t("dashboard.table.spent")}</th>
                    <th>{t("dashboard.table.limit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => {
                    const spent = Number(byCategory[c]) || 0
                    const limit = budgetLimits[c]
                    return(
                      <tr key={c}>
                        <td>{c}</td>
                        <td>{money(spent)}</td>
                        <td>
                          {Number.isFinite(limit)
                            ? money(limit)
                            : <span className="pill">{t("dashboard.noLimitPill")}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
