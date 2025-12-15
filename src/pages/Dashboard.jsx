import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
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
  saveBudgets
} from "../lib/storage.js"
import { fetchExpenses, fetchBudgets } from "../lib/api.js"
import "../styles/dashboard.css"


const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—")

// Helper function to get month insights for a specific date
function getMonthInsightsForDate(targetDate) {
  const expenses = getExpenses().filter(e => {
    const ed = new Date(e.date)
    return isSameMonth(ed, targetDate)
  })
  const byCategory = {}
  let sum = 0
  for(const e of expenses){
    const amt = Number(e.amount)||0
    sum += amt
    const k = e.category || 'Uncategorized'
    byCategory[k] = (byCategory[k]||0) + amt
  }
  return {sum, byCategory, expenses}
}

export default function Dashboard(){
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Fetch and sync data from API on mount
  useEffect(() => {
    const syncDataFromAPI = async () => {
      try {
        // Fetch expenses from API
        const apiExpenses = await fetchExpenses()
        if (apiExpenses && apiExpenses.length > 0) {
          const localExpenses = getExpenses()
          // Merge API expenses with local expenses, avoiding duplicates
          const mergedExpenses = [...localExpenses]
          apiExpenses.forEach(apiExp => {
            const exists = mergedExpenses.some(localExp => localExp.id === apiExp.id)
            if (!exists) {
              mergedExpenses.push(apiExp)
            }
          })
          saveExpenses(mergedExpenses)
        }
      } catch (error) {
        console.warn('Failed to fetch expenses from API:', error)
        // Continue with local storage if API fails
      }

      try {
        // Fetch budgets from API
        const apiBudgets = await fetchBudgets()
        if (apiBudgets && apiBudgets.length > 0) {
          const localBudgets = getBudgets()
          // Merge API budgets with local budgets, avoiding duplicates
          const mergedBudgets = [...localBudgets]
          apiBudgets.forEach(apiBudget => {
            const exists = mergedBudgets.some(localBudget => localBudget.id === apiBudget.id)
            if (!exists) {
              mergedBudgets.push(apiBudget)
            }
          })
          saveBudgets(mergedBudgets)
        }
      } catch (error) {
        console.warn('Failed to fetch budgets from API:', error)
        // Continue with local storage if API fails
      }
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
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

  const t = totals() || {}
  const total = Number.isFinite(t?.total) ? t.total : 0
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
      const expDate = new Date(exp.date)
      if (isSameMonth(expDate, selectedMonth)) {
        const day = expDate.getDate()
        if (!dailyTotals[day]) {
          dailyTotals[day] = 0
        }
        dailyTotals[day] += Number(exp.amount) || 0
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
      name: card.cardName || 'Unknown',
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
      name: card.name || 'Unknown',
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
            aria-label="Previous month"
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
            aria-label="Next month"
          >
            <FiChevronRight />
          </button>
        </div>
        <div className="grid">
        <section className="card col-12 welcome-card">
          <h2>Welcome back</h2>
          <p className="welcome-summary">
            {isSelectedMonthCurrent 
              ? `So far this month you spent ${money(sum)} across ${transactionCount} ${transactionCount === 1 ? 'transaction' : 'transactions'}.`
              : `In ${formatMonth(selectedMonth)} you spent ${money(sum)} across ${transactionCount} ${transactionCount === 1 ? 'transaction' : 'transactions'}.`
            }
          </p>
        </section>

        <section className="card col-12 glance-section">
          <h3>This Month at a Glance</h3>
          <div className="glance-tiles">
            <div className="glance-tile">
              <div className="glance-label">Spent</div>
              <div className="glance-value">{money(sum)}</div>
            </div>
            <div className="glance-tile">
              <div className="glance-label">Remaining Budget</div>
              <div className="glance-value">{money(remainingBudget)}</div>
            </div>
            <div className="glance-tile">
              <div className="glance-label">Avg Daily Spend</div>
              <div className="glance-value">{money(avgDailySpend)}</div>
            </div>
          </div>
          <div className="glance-credit-summary">
            <div className="glance-credit-header">
              <span className="glance-credit-label">Total Credit Card Debt:</span>
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
          <Link to="/expenses" className="quick-action-btn">Add Expense</Link>
          <Link to="/budget" className="quick-action-btn">Add Income</Link>
          <Link to="/budget" className="quick-action-btn">Add Budget</Link>
        </div>

        <section className="card col-12 highlights-card">
          <h3>Highlights</h3>
          <div className="highlights-list">
            {topCategory && topCategoryAmount > 0 && (
              <div className="highlight-item">
                <span className="highlight-text">
                  Top category this month: <strong>{topCategory}</strong> ({money(topCategoryAmount)})
                </span>
              </div>
            )}
            {transactionCount > 0 && (
              <div className="highlight-item">
                <span className="highlight-text">
                  You added <strong>{transactionCount}</strong> {transactionCount === 1 ? 'transaction' : 'transactions'} this month.
                </span>
              </div>
            )}
            {topCategoryPercent > 0 && (
              <div className="highlight-item">
                <span className="highlight-text">
                  You spent <strong>{topCategoryPercent}%</strong> in your top category.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="card col-12 projected-spending-card">
          <h3>Projected End-of-Month Spending</h3>
          <div className="projected-content">
            <div className="projected-estimate">
              <span className="projected-estimate-label">Estimated:</span>
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
            <h3>Credit Snapshot</h3>
            <div className="credit-snapshot-content">
              <div className="credit-snapshot-item">
                <span className="credit-snapshot-label">Total Debt:</span>
                <span className="credit-snapshot-value">{money(totalDebt)}</span>
              </div>
              {highestUtilizationCard && (
                <div className="credit-snapshot-item">
                  <span className="credit-snapshot-label">Highest Utilization:</span>
                  <span className="credit-snapshot-value">{highestUtilizationCard.name}</span>
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
