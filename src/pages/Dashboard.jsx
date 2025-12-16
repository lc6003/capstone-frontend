import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import {
  totals,
  monthInsights,
  lastMonthInsights,
  getBudgetTotalsByType,
  getIncomeTotals,
  getTotalCreditCardDebt,
  getUserCreditCards,
  getCreditCards,
  calculateRealTimeBalance,
  getExpenses,
  isSameMonth,
  saveExpenses,
  getBudgets,
  saveBudgets,
  syncExpensesFromAPI,
  syncBudgetsFromAPI
} from "../lib/storage.js"
import "../styles/dashboard.css"


const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—")

// Helper function to parse YYYY-MM-DD date strings as local dates (not UTC)
function parseLocalDate(dateString) {
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateString)
}

// Helper function to get month insights for a specific date
function getMonthInsightsForDate(targetDate) {
  // Filter expenses: exclude Income category and normalize negative amounts
  const expenses = getExpenses().filter(e => {
    // Parse expense date as local date to match with local 'targetDate'
    const ed = parseLocalDate(e.date)
    return isSameMonth(ed, targetDate) && e.category !== 'Income'
  })
  const byCategory = {}
  let sum = 0
  for(const e of expenses){
    // Normalize negative amounts: convert to positive for spending calculations
    const amt = Number(e.amount)||0
    const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
    sum += normalizedAmt
    const k = e.category || 'Uncategorized'
    byCategory[k] = (byCategory[k]||0) + normalizedAmt
  }
  return {sum, byCategory, expenses}
}

export default function Dashboard(){
  const { t, i18n } = useTranslation("common")

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Fetch and sync data from API on mount (budgets still sync from API)
  useEffect(() => {
    const syncDataFromAPI = async () => {
      // Only sync budgets from API - expenses are localStorage-only
      await syncBudgetsFromAPI()
    }
    syncDataFromAPI()
  }, [])

  // Month navigation functions
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }
  
  const goToCurrentMonth = () => {
    const now = new Date()
    setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  // Format month for display
  const formatMonth = (date) => {
    const lng = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase()
    const locale = lng.startsWith("es") ? "es-ES" : "en-US"
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" })
  }

  const isCurrentMonth = useMemo(() => {
    const now = new Date()
    return selectedMonth.getFullYear() === now.getFullYear() && 
           selectedMonth.getMonth() === now.getMonth()
  }, [selectedMonth])

  // Get month-specific data
  const m = useMemo(() => getMonthInsightsForDate(selectedMonth), [selectedMonth])
  const sum = Number.isFinite(m?.sum) ? m.sum : 0
  const transactionCount = m?.expenses?.length || 0
  const byCategory = m?.byCategory || {}

  // Get previous month for comparison
  const prevMonthDate = useMemo(() => {
    return new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
  }, [selectedMonth])
  const prevMonthData = useMemo(() => getMonthInsightsForDate(prevMonthDate), [prevMonthDate])
  const lastMonthSum = Number.isFinite(prevMonthData?.sum) ? prevMonthData.sum : 0

  const totalsData = totals() || {}
  const total = Number.isFinite(totalsData?.total) ? totalsData.total : 0
  const b = getBudgetTotalsByType() || {}
  const budgetedTotal = Number.isFinite(b?.total) ? b.total : 0
  const inc = getIncomeTotals() || {}
  const actual = Number.isFinite(inc?.actual) ? inc.actual : 0
  const expected = Number.isFinite(inc?.expected) ? inc.expected : 0
  const debtRaw = getTotalCreditCardDebt?.()
  const totalDebt = Number.isFinite(debtRaw) ? debtRaw : 0

  // Calculate average daily spend for selected month
  const totalDaysInSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  const now = new Date()
  const isSelectedMonthCurrent = isSameMonth(selectedMonth, now)
  const currentDay = isSelectedMonthCurrent ? now.getDate() : totalDaysInSelectedMonth
  const avgDailySpend = currentDay > 0 ? sum / currentDay : 0

  // Calculate remaining budget (clamped to 0 minimum)
  const remainingBudget = Math.max(0, budgetedTotal - sum)

  // Calculate projected end-of-month spending
  const forecast = avgDailySpend * totalDaysInSelectedMonth

  // Generate sparkline data points (daily cumulative spending trend)
  const generateSparklineData = () => {
    const expenses = m?.expenses || []
    if (expenses.length === 0) return null
    
    const dailyTotals = {}
    
    expenses.forEach(exp => {
      // Parse expense date as local date to match with local 'selectedMonth'
      const expDate = parseLocalDate(exp.date)
      if (isSameMonth(expDate, selectedMonth)) {
        const day = expDate.getDate()
        if (!dailyTotals[day]) {
          dailyTotals[day] = 0
        }
        // Normalize negative amounts: convert to positive for spending calculations
        const amt = Number(exp.amount) || 0
        const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
        dailyTotals[day] += normalizedAmt
      }
    })
    
    const days = []
    let cumulative = 0
    const maxDay = isSelectedMonthCurrent ? currentDay : totalDaysInSelectedMonth
    
    for (let i = 1; i <= maxDay; i++) {
      cumulative += dailyTotals[i] || 0
      days.push(cumulative)
    }
    
    if (days.length === 0) return null
    
    const maxValue = Math.max(...days, forecast, 1)
    return { days, maxValue, width: days.length }
  }
  
  const sparklineData = generateSparklineData()

  // Calculate insights for Highlights card
  const topCategoryEntry = Object.entries(byCategory).length > 0
    ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    : null
  const topCategory = topCategoryEntry ? topCategoryEntry[0] : null
  const topCategoryAmount = topCategoryEntry ? Number(topCategoryEntry[1]) || 0 : 0
  const topCategoryPercent = sum > 0 && topCategoryAmount > 0 ? Math.round((topCategoryAmount / sum) * 100) : 0

  // Calculate percentage of average monthly spending (only if we have last month data)
  const spendingPercent = lastMonthSum > 0 ? Math.round((sum / lastMonthSum) * 100) : 0

  // Calculate credit card overview data
  const newCards = getUserCreditCards() || []
  const oldCards = getCreditCards() || []
  
  // Process new format cards
  const newCardsWithUtilization = newCards.map(card => {
    const balance = Number(card.currentBalance) || 0
    const limit = Number(card.creditLimit) || 0
    const utilization = limit > 0 ? (balance / limit) * 100 : 0
    return {
      name: card.cardName || t("dashboard.credit.unknown"),
      balance,
      limit,
      utilization
    }
  }).filter(card => card.limit > 0)
  
  // Process old format cards
  const oldCardsWithUtilization = oldCards.map(card => {
    const balance = calculateRealTimeBalance(card)
    const limit = Number(card.limit) || 0
    const utilization = limit > 0 ? (balance / limit) * 100 : 0
    return {
      name: card.name || t("dashboard.credit.unknown"),
      balance,
      limit,
      utilization
    }
  }).filter(card => card.limit > 0)
  
  const cardsWithUtilization = [...newCardsWithUtilization, ...oldCardsWithUtilization]
  const allCards = [...newCards, ...oldCards]

  const highestUtilizationCard = cardsWithUtilization.length > 0
    ? cardsWithUtilization.reduce((max, card) => card.utilization > max.utilization ? card : max)
    : null

  const combinedLimits = cardsWithUtilization.reduce((sum, card) => sum + card.limit, 0)
  const totalUtilization = combinedLimits > 0 ? (totalDebt / combinedLimits) * 100 : 0

  return(
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
            {isSelectedMonthCurrent
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
              <div className="glance-value">{money(remainingBudget)}</div>
            </div>
            <div className="glance-tile">
              <div className="glance-label">
                {t("dashboard.glance.avgDaily")}
              </div>
              <div className="glance-value">{money(avgDailySpend)}</div>
            </div>
          </div>
          <div className="glance-credit-summary">
            <div className="glance-credit-header">
              <span className="glance-credit-label">{t("dashboard.glance.totalDebt")}</span>
              <span className="glance-credit-value">{money(totalDebt)}</span>
            </div>
            {combinedLimits > 0 && (
              <div className="glance-credit-progress">
                <div 
                  className="glance-credit-progress-bar"
                  style={{
                    width: `${Math.min(100, totalUtilization)}%`,
                    backgroundColor: totalUtilization < 30 ? '#10b981' : totalUtilization <= 80 ? '#F4A261' : '#ef4444'
                  }}
                />
              </div>
            )}
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
          <div className="highlights-list">
            {topCategory && topCategoryAmount > 0 && (
              <div className="highlight-item">
                <span className="highlight-text">
                  {t("dashboard.highlights.topCategoryPrefix")}{" "}
                  <strong>{topCategory}</strong> ({money(topCategoryAmount)})
                </span>
              </div>
            )}
            {transactionCount > 0 && (
              <div className="highlight-item">
                <span className="highlight-text">
                  {t("dashboard.highlights.youAdded")}{" "}
                  <strong>{transactionCount}</strong>{" "}
                  {transactionCount === 1
                    ? t("dashboard.welcome.txnOne")
                    : t("dashboard.welcome.txnMany")}{" "}
                  {t("dashboard.highlights.thisMonthSuffix")}
                </span>
              </div>
            )}
            {topCategoryPercent > 0 && (
              <div className="highlight-item">
                <span className="highlight-text">
                  {t("dashboard.highlights.youSpent")}{" "}
                  <strong>{topCategoryPercent}%</strong>{" "}
                  {t("dashboard.highlights.inTop")}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="card col-12 projected-spending-card">
          <h3>{t("dashboard.projected.title")}</h3>
          <div className="projected-content">
            <div className="projected-estimate">
              <span className="projected-estimate-label">{t("dashboard.projected.estimated")}</span>
              <span className="projected-estimate-value">{money(forecast)}</span>
            </div>
            {sparklineData && sparklineData.days.length > 0 && (
              <div className="projected-sparkline">
                <svg 
                  className="sparkline-svg" 
                  viewBox={`0 0 ${sparklineData.width} 40`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F4A261" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#E07A3F" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points={sparklineData.days.map((val, idx) => 
                      `${idx},${40 - (val / sparklineData.maxValue) * 35}`
                    ).join(' ')}
                    fill="none"
                    stroke="url(#sparklineGradient)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </section>

        {allCards.length > 0 && (
          <section className="card col-12 credit-snapshot-card">
            <h3>{t("dashboard.credit.title")}</h3>
            <div className="credit-snapshot-content">
              <div className="credit-snapshot-item">
                <span className="credit-snapshot-label">{t("dashboard.credit.totalDebt")}</span>
                <span className="credit-snapshot-value">{money(totalDebt)}</span>
              </div>
              {highestUtilizationCard && (
                <div className="credit-snapshot-item">
                  <span className="credit-snapshot-label">{t("dashboard.credit.highestUtil")}</span>
                  <span className="credit-snapshot-value">{highestUtilizationCard.name || t("dashboard.credit.unknown")}</span>
                </div>
              )}
              {combinedLimits > 0 && (
                <div className="credit-snapshot-bar">
                  <div 
                    className="credit-snapshot-bar-fill"
                    style={{
                      width: `${Math.min(100, totalUtilization)}%`,
                      backgroundColor: totalUtilization < 30 ? '#10b981' : totalUtilization <= 80 ? '#F4A261' : '#ef4444'
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  )
}
