import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import {
  totals,
  getBudgetTotalsByType,
  getIncomeTotals,
  getTotalCreditCardDebt,
  getUserCreditCards,
  getCreditCards,
  calculateRealTimeBalance,
  getExpenses,
  isSameMonth,
  syncBudgetsFromAPI
} from "../lib/storage.js"
import "../styles/dashboard.css"

const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—")

function parseLocalDate(dateString) {
  if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(dateString)
}

function getMonthInsightsForDate(targetDate) {
  const expenses = getExpenses().filter((e) => {
    const ed = parseLocalDate(e.date)
    return isSameMonth(ed, targetDate) && e.category !== "Income"
  })

  const byCategory = {}
  let sum = 0

  for (const e of expenses) {
    const amt = Number(e.amount) || 0
    const normalized = amt < 0 ? Math.abs(amt) : amt
    sum += normalized
    const k = e.category || "Uncategorized"
    byCategory[k] = (byCategory[k] || 0) + normalized
  }

  return { sum, byCategory, expenses }
}

export default function Dashboard() {
  const { t, i18n } = useTranslation("common")

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    syncBudgetsFromAPI()
  }, [])

  const goToPreviousMonth = () =>
    setSelectedMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))

  const goToNextMonth = () =>
    setSelectedMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))

  const goToCurrentMonth = () => {
    const now = new Date()
    setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const formatMonth = (date) => {
    const lng = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase()
    const locale = lng.startsWith("es") ? "es-ES" : "en-US"
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" })
  }

  const isCurrentMonth = useMemo(() => {
    const now = new Date()
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    )
  }, [selectedMonth])

  const m = useMemo(() => getMonthInsightsForDate(selectedMonth), [selectedMonth])
  const sum = m.sum || 0
  const transactionCount = m.expenses.length
  const byCategory = m.byCategory

  const prevMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() - 1,
    1
  )
  const lastMonthSum = getMonthInsightsForDate(prevMonth).sum || 0

  const b = getBudgetTotalsByType() || {}
  const budgetedTotal = b.total || 0
  const remainingBudget = Math.max(0, budgetedTotal - sum)

  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  ).getDate()

  const now = new Date()
  const currentDay = isSameMonth(selectedMonth, now)
    ? now.getDate()
    : daysInMonth

  const avgDailySpend = currentDay > 0 ? sum / currentDay : 0
  const forecast = avgDailySpend * daysInMonth

  const topCategoryEntry =
    Object.entries(byCategory).length > 0
      ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
      : null

  const topCategory = topCategoryEntry?.[0]
  const topCategoryAmount = topCategoryEntry?.[1] || 0
  const topCategoryPercent =
    sum > 0 ? Math.round((topCategoryAmount / sum) * 100) : 0

  const totalDebt = getTotalCreditCardDebt() || 0

  const cards = [
    ...getUserCreditCards().map((c) => ({
      name: c.cardName || t("dashboard.credit.unknown", "Unknown"),
      balance: Number(c.currentBalance) || 0,
      limit: Number(c.creditLimit) || 0
    })),
    ...getCreditCards().map((c) => ({
      name: c.name || t("dashboard.credit.unknown", "Unknown"),
      balance: calculateRealTimeBalance(c),
      limit: Number(c.limit) || 0
    }))
  ].filter((c) => c.limit > 0)

  const combinedLimits = cards.reduce((s, c) => s + c.limit, 0)
  const totalUtilization =
    combinedLimits > 0 ? (totalDebt / combinedLimits) * 100 : 0

  return (
    <div className="dashboard-page-wrapper">
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />

      <div className="dashboard-container dash">
        <div className="month-switcher">
          <button
            className="month-switcher-btn"
            onClick={goToPreviousMonth}
            aria-label={t("dashboard.month.prevAria")}
          >
            <FiChevronLeft />
          </button>

          <button
            className="month-switcher-current"
            onClick={goToCurrentMonth}
            disabled={isCurrentMonth}
          >
            {formatMonth(selectedMonth)}
          </button>

          <button
            className="month-switcher-btn"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            aria-label={t("dashboard.month.nextAria")}
          >
            <FiChevronRight />
          </button>
        </div>

        <div className="grid">
          <section className="card col-12 welcome-card">
            <h2>{t("dashboard.welcome.title")}</h2>
            <p className="welcome-summary">
              {isCurrentMonth
                ? `${t("dashboard.welcome.soFar")} ${money(sum)} ${t(
                    "dashboard.welcome.across"
                  )} ${transactionCount} ${
                    transactionCount === 1
                      ? t("dashboard.welcome.txnOne")
                      : t("dashboard.welcome.txnMany")
                  }.`
                : `${t("dashboard.welcome.in")} ${formatMonth(
                    selectedMonth
                  )} ${t("dashboard.welcome.youSpent")} ${money(sum)} ${t(
                    "dashboard.welcome.across"
                  )} ${transactionCount} ${
                    transactionCount === 1
                      ? t("dashboard.welcome.txnOne")
                      : t("dashboard.welcome.txnMany")
                  }.`}
            </p>
          </section>

          <section className="card col-12 glance-section">
            <h3>{t("dashboard.glance.title")}</h3>

            <div className="glance-tiles">
              <div className="glance-tile">
                <div className="glance-label">
                  {t("dashboard.glance.spent")}
                </div>
                <div className="glance-value">{money(sum)}</div>
              </div>

              <div className="glance-tile">
                <div className="glance-label">
                  {t("dashboard.glance.remaining")}
                </div>
                <div className="glance-value">
                  {money(remainingBudget)}
                </div>
              </div>

              <div className="glance-tile">
                <div className="glance-label">
                  {t("dashboard.glance.avgDaily")}
                </div>
                <div className="glance-value">
                  {money(avgDailySpend)}
                </div>
              </div>
            </div>
          </section>

          <div className="quick-actions-row">
            <Link to="/expenses" className="quick-action-btn">
              {t("dashboard.actions.addExpense")}
            </Link>
            <Link to="/budget" className="quick-action-btn">
              {t("dashboard.actions.addIncome")}
            </Link>
            <Link to="/budget" className="quick-action-btn">
              {t("dashboard.actions.addBudget")}
            </Link>
          </div>

          <section className="card col-12 highlights-card">
            <h3>{t("dashboard.highlights.title")}</h3>

            {topCategory && (
              <p>
                {t("dashboard.highlights.topCategoryPrefix")}{" "}
                <strong>{topCategory}</strong> ({money(topCategoryAmount)})
              </p>
            )}

            {transactionCount > 0 && (
              <p>
                {t("dashboard.highlights.youAdded")}{" "}
                <strong>{transactionCount}</strong>{" "}
                {transactionCount === 1
                  ? t("dashboard.welcome.txnOne")
                  : t("dashboard.welcome.txnMany")}{" "}
                {t("dashboard.highlights.thisMonthSuffix")}
              </p>
            )}

            {topCategoryPercent > 0 && (
              <p>
                {t("dashboard.highlights.youSpent")}{" "}
                <strong>{topCategoryPercent}%</strong>{" "}
                {t("dashboard.highlights.inTop")}
              </p>
            )}
          </section>

          <section className="card col-12 projected-spending-card">
            <h3>{t("dashboard.projected.title")}</h3>
            <p>
              {t("dashboard.projected.estimated")} {money(forecast)}
            </p>
          </section>

          {cards.length > 0 && (
            <section className="card col-12 credit-snapshot-card">
              <h3>{t("dashboard.credit.title")}</h3>
              <p>
                {t("dashboard.credit.totalDebt")} {money(totalDebt)}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
