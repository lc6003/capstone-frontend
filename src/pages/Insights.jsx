import { useMemo, useState, useEffect } from "react"
import { monthInsights, lastMonthInsights, getIncomeTotals, getBudgets, getExpenses, isSameMonth, saveExpenses, saveBudgets, syncExpensesFromAPI, syncBudgetsFromAPI, syncIncomeFromAPI } from "../lib/storage.js"
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiBarChart, FiInfo, FiTarget, FiDollarSign, FiCreditCard } from "react-icons/fi"
import "../styles/dashboard.css"

// Helper to parse YYYY-MM-DD date strings as local dates (not UTC)
function parseLocalDate(dateString) {
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateString)
}

export default function Insights(){
  const now = new Date()
  const currentMonth = now.getMonth() // Use local time, not UTC
  
  // State for selected month (default to current month)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // Fetch and sync data from API on mount
  useEffect(() => {
    const syncDataFromAPI = async () => {
      // Use storage.js sync functions which handle API calls and localStorage sync
      await syncExpensesFromAPI()
      await syncBudgetsFromAPI()
      await syncIncomeFromAPI()
    }
    syncDataFromAPI()
  }, [])
  
  // Calculate monthly data for all 12 months
  const monthlyData = useMemo(() => {
    const allExpenses = getExpenses()
    const allIncome = getIncomeTotals()
    const currentYear = now.getFullYear() // Use local time, not UTC
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((monthName, monthIndex) => {
      const monthDate = new Date(currentYear, monthIndex, 1)
      
      // Calculate spending for this month (exclude Income, normalize negative amounts)
      const monthExpenses = allExpenses.filter(e => {
        // Parse expense date as local date to match with local 'monthDate'
        const ed = parseLocalDate(e.date)
        return isSameMonth(ed, monthDate) && e.category !== 'Income'
      })
      const spend = monthExpenses.reduce((sum, e) => {
        const amt = Number(e.amount) || 0
        const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
        return sum + normalizedAmt
      }, 0)
      
      // Calculate income for this month from both sources:
      // 1. Budget page income entries (for current month only)
      // 2. Expenses with category "Income" (for any month)
      let income = 0
      
      // Get income from Budget page (only for current month)
      if (monthIndex === currentMonth) {
        income = allIncome.actual || 0
      }
      
      // Add income from expenses with category "Income" for this month
      const incomeExpenses = allExpenses.filter(e => {
        const ed = parseLocalDate(e.date)
        return isSameMonth(ed, monthDate) && e.category === 'Income'
      })
      
      const expenseIncome = incomeExpenses.reduce((sum, e) => {
        const amt = Number(e.amount) || 0
        return sum + Math.abs(amt) // Income should always be positive
      }, 0)
      
      income += expenseIncome
      
      return {
        month: monthName,
        monthIndex,
        income,
        spend
      }
    })
  }, [])
  
  // Get insights for selected month
  const { byCategory, expenses, sum } = useMemo(() => {
    const selectedMonthDate = new Date(now.getFullYear(), selectedMonth, 1) // Use local time consistently
    const allExpenses = getExpenses()
    // Filter expenses: exclude Income category and normalize negative amounts
    const expenses = allExpenses.filter(e => {
      // Parse expense date as local date to match with local 'selectedMonthDate'
      const ed = parseLocalDate(e.date)
      return isSameMonth(ed, selectedMonthDate) && e.category !== 'Income'
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
    }, [selectedMonth])
  
  // Get last month insights (month before selected month)
  const lastMonth = useMemo(() => {
    const selectedMonthDate = new Date(now.getFullYear(), selectedMonth, 1) // Use local time consistently
    const lastMonthDate = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() - 1, 1) // Use local time consistently
    const allExpenses = getExpenses()
    // Filter expenses: exclude Income category and normalize negative amounts
    const expenses = allExpenses.filter(e => {
      // Parse expense date as local date to match with local 'lastMonthDate'
      const ed = parseLocalDate(e.date)
      return isSameMonth(ed, lastMonthDate) && e.category !== 'Income'
    })
    let sum = 0
    for(const e of expenses){
      // Normalize negative amounts: convert to positive for spending calculations
      const amt = Number(e.amount)||0
      const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
      sum += normalizedAmt
    }
    return {sum, expenses}
  }, [selectedMonth])
  
  // State to force re-render when income changes
  const [incomeUpdateTrigger, setIncomeUpdateTrigger] = useState(0)
  
  useEffect(() => {
    const handleStorageChange = () => {
      setIncomeUpdateTrigger(prev => prev + 1)
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('incomeUpdated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('incomeUpdated', handleStorageChange)
    }
  }, [])
  
  // Calculate income for selected month from both sources:
  // 1. Budget page income entries (for current month only)
  // 2. Expenses with category "Income" (for selected month)
  const totalIncome = useMemo(() => {
    const selectedMonthDate = new Date(now.getFullYear(), selectedMonth, 1)
    const isCurrentMonth = selectedMonth === currentMonth
    
    // Get income from Budget page (only for current month)
    const budgetIncome = isCurrentMonth ? (getIncomeTotals().actual || 0) : 0
    
    // Get income from expenses with category "Income" for selected month
    const allExpenses = getExpenses()
    const incomeExpenses = allExpenses.filter(e => {
      const ed = parseLocalDate(e.date)
      return isSameMonth(ed, selectedMonthDate) && e.category === 'Income'
    })
    
    // Sum up income from expenses (use absolute value to handle negative amounts)
    const expenseIncome = incomeExpenses.reduce((sum, e) => {
      const amt = Number(e.amount) || 0
      return sum + Math.abs(amt) // Income should always be positive
    }, 0)
    
    return budgetIncome + expenseIncome
  }, [selectedMonth, incomeUpdateTrigger, expenses])

  // Calculate metrics
  const totalSpent = sum
  const netDifference = totalIncome - totalSpent
  
  // Top spending category
  const topCategory = Object.entries(byCategory).length > 0
    ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    : null
  
  // % change vs last month
  const lastMonthSpent = lastMonth.sum
  const percentChange = lastMonthSpent > 0
    ? ((totalSpent - lastMonthSpent) / lastMonthSpent) * 100
    : 0
  
  // Generate summary sentence
  const getSummarySentence = () => {
    const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
    const daysInMonth = new Date(selectedMonthDate.getUTCFullYear(), selectedMonthDate.getUTCMonth() + 1, 0).getUTCDate()
    const isCurrentMonth = selectedMonth === currentMonth
    const currentDay = isCurrentMonth ? now.getUTCDate() : daysInMonth
    
    // Only show projection for current month
    if (isCurrentMonth && currentDay > 0) {
    const projectedSpending = (totalSpent / currentDay) * daysInMonth
    
    // Check for overspending projection
    if (totalIncome > 0 && projectedSpending > totalIncome) {
      const overspend = projectedSpending - totalIncome
      return `You're trending to overspend by $${overspend.toFixed(0)}.`
      }
    }
    
    if (lastMonthSpent === 0) {
      if (totalSpent > 0) {
        return "This is your first month tracking expenses."
      }
      return "No expenses recorded yet this month."
    }
    
    const absChange = Math.abs(percentChange)
    if (percentChange < 0) {
      return `You're spending ${absChange.toFixed(1)}% less than last month.`
    } else if (percentChange > 0) {
      return `You're spending ${absChange.toFixed(1)}% more than last month.`
    } else {
      return "Your spending matches last month."
    }
  }

  // Generate color palette for categories
  const getCategoryColor = (index) => {
    const colors = [
      '#F4A261', // Orange
      '#E07A3F', // Darker orange
      '#8B5CF6', // Purple
      '#F59E0B', // Amber
      '#10B981', // Green
      '#EF4444', // Red
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#D97706', // Orange-amber
      '#DC2626', // Red-orange
    ]
    return colors[index % colors.length]
  }

  // Create sorted category list with colors and percentages
  const sortedCategories = useMemo(() => {
    const categories = Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value: Number(value) || 0,
        percentage: totalSpent > 0 ? ((Number(value) || 0) / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .map((category, index) => ({
        ...category,
        color: getCategoryColor(index)
      }))
    
    return categories
  }, [byCategory, totalSpent])
  
  // Prepare chart data - use absolute values so all categories appear
  // Pie charts can only display positive values, so we use absolute values for visualization
  const chartData = useMemo(() => {
    if (!sortedCategories || sortedCategories.length === 0) {
      return []
    }
    
    // Map all categories using absolute values for the chart
    // Exclude Income from Spending Breakdown chart
    // This allows negative categories (like refunds) to appear in the chart
    const validData = sortedCategories
      .filter(cat => {
        // Exclude Income from Spending Breakdown
        if (cat.name === 'Income') {
          return false
        }
        const val = Number(cat.value)
        return val !== 0 && Number.isFinite(val) // Include both positive and negative (but not zero)
      })
      .map((cat, idx) => ({
        name: cat.name || 'Uncategorized',
        value: Math.abs(Number(cat.value)), // Use absolute value for chart display
        originalValue: Number(cat.value), // Keep original for tooltip
        color: cat.color || getCategoryColor(idx)
      }))
    
    return validData
  }, [sortedCategories])
  
  // Check if we have valid chart data
  const hasChartData = chartData.length > 0
  
  
  
  const dailySeries = useMemo(() => {
    const selectedMonthDate = new Date(now.getFullYear(), selectedMonth, 1) // Use local time consistently
    const daysInMonth = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0).getDate() // Use local time consistently
    const totals = Array.from({ length: daysInMonth }, (_, idx) => ({
      day: idx + 1,
      value: 0
    }))

    expenses.forEach(exp => {
      // Parse expense date as local date for consistent day extraction
      const date = parseLocalDate(exp.date)
      if (Number.isNaN(date.getTime())) return
      // Only include expenses from the selected month
      if (!isSameMonth(date, selectedMonthDate)) return
      const dayIndex = date.getDate() // Use local time consistently
      if (!Number.isFinite(dayIndex) || dayIndex < 1 || dayIndex > daysInMonth) return
      // Normalize negative amounts: convert to positive for spending calculations
      const amt = Number(exp.amount) || 0
      const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
      totals[dayIndex - 1].value += normalizedAmt
    })

    return totals
  }, [expenses, selectedMonth])

  const hasDailyData = dailySeries.some(point => point.value > 0)

  // Calculate comparison metrics
  const thisMonthTransactions = expenses.length
  const lastMonthTransactions = lastMonth.expenses.length
  
  // Calculate average daily spend
  const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
  const daysInSelectedMonth = new Date(selectedMonthDate.getUTCFullYear(), selectedMonthDate.getUTCMonth() + 1, 0).getUTCDate()
  const isCurrentMonth = selectedMonth === currentMonth
  const currentDay = isCurrentMonth ? now.getUTCDate() : daysInSelectedMonth
  const thisMonthAvgDaily = currentDay > 0 ? totalSpent / currentDay : 0
  
  const lastMonthDate = new Date(now.getUTCFullYear(), selectedMonth - 1, 1)
  const daysInLastMonth = new Date(lastMonthDate.getUTCFullYear(), lastMonthDate.getUTCMonth() + 1, 0).getUTCDate()
  const lastMonthAvgDaily = daysInLastMonth > 0 ? lastMonthSpent / daysInLastMonth : 0

  // Generate comparison summary sentence
  const getComparisonSentence = () => {
    if (lastMonthSpent === 0) {
      if (totalSpent > 0) {
        return "This is your first month with spending data."
      }
      return "No spending data available for comparison."
    }
    
    const dollarDiff = totalSpent - lastMonthSpent
    const absPercentChange = Math.abs(percentChange)
    
    if (dollarDiff > 0) {
      return `Spending is up by $${Math.abs(dollarDiff).toFixed(0)} (+${absPercentChange.toFixed(1)}%) compared to last month.`
    } else if (dollarDiff < 0) {
      return `You spent $${Math.abs(dollarDiff).toFixed(0)} (${absPercentChange.toFixed(1)}%) less than last month.`
    } else {
      return "Your spending matches last month exactly."
    }
  }

  // Calculate category spending for last month
  const lastMonthByCategory = useMemo(() => {
    const categoryMap = {}
    for (const e of lastMonth.expenses) {
      // Normalize negative amounts: convert to positive for spending calculations
      const amt = Number(e.amount) || 0
      const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
      const key = e.category || 'Uncategorized'
      categoryMap[key] = (categoryMap[key] || 0) + normalizedAmt
    }
    return categoryMap
  }, [lastMonth.expenses])

  // Get budgets for budget usage insights
  const budgets = useMemo(() => getBudgets(), [])

  // Generate key insights
  const keyInsights = useMemo(() => {
    const insights = []
    
    // Insight 1: Top category
    if (topCategory && topCategory[1] > 0) {
      const topCategoryPercent = totalSpent > 0 ? ((topCategory[1] / totalSpent) * 100) : 0
      insights.push({
        icon: FiBarChart,
        text: `${topCategory[0]} is your highest spending category this month (${topCategoryPercent.toFixed(0)}%).`,
        type: 'info'
      })
    }
    
    // Insight 2: Category spending change
    if (lastMonthSpent > 0 && topCategory) {
      const lastMonthCategorySpent = lastMonthByCategory[topCategory[0]] || 0
      if (lastMonthCategorySpent > 0) {
        const categoryChange = ((topCategory[1] - lastMonthCategorySpent) / lastMonthCategorySpent) * 100
        if (Math.abs(categoryChange) >= 10) {
          insights.push({
            icon: categoryChange > 0 ? FiTrendingUp : FiTrendingDown,
            text: `${topCategory[0]} spending ${categoryChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(categoryChange).toFixed(0)}% compared to last month.`,
            type: categoryChange > 0 ? 'warning' : 'success'
          })
        }
      }
    }
    
    // Insight 3: Budget usage
    if (budgets.length > 0 && totalSpent > 0) {
      const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0)
      if (totalBudget > 0) {
        const budgetUsage = (totalSpent / totalBudget) * 100
        if (budgetUsage >= 70) {
          insights.push({
            icon: FiAlertTriangle,
            text: `You have used ${budgetUsage.toFixed(0)}% of your monthly budget.`,
            type: budgetUsage >= 90 ? 'warning' : 'info'
          })
        }
      }
    }
    
    // Insight 4: Overall spending trend
    if (lastMonthSpent > 0 && Math.abs(percentChange) >= 5) {
      insights.push({
        icon: percentChange > 0 ? FiTrendingUp : FiTrendingDown,
        text: `Overall spending is ${percentChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(0)}% from last month.`,
        type: percentChange > 0 ? 'warning' : 'success'
      })
    }
    
    // Insight 5: Category with significant change (if not already covered)
    if (lastMonthSpent > 0 && insights.length < 4) {
      for (const [categoryName, categorySpent] of Object.entries(byCategory)) {
        if (categoryName === topCategory?.[0]) continue // Skip if already covered
        
        const lastMonthCategorySpent = lastMonthByCategory[categoryName] || 0
        if (lastMonthCategorySpent > 0 && categorySpent > 0) {
          const categoryChange = ((categorySpent - lastMonthCategorySpent) / lastMonthCategorySpent) * 100
          if (Math.abs(categoryChange) >= 20) {
            insights.push({
              icon: categoryChange > 0 ? FiTrendingUp : FiTrendingDown,
              text: `${categoryName} spending ${categoryChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(categoryChange).toFixed(0)}% compared to last month.`,
              type: categoryChange > 0 ? 'warning' : 'success'
            })
            break
          }
        }
      }
    }
    
    return insights.slice(0, 4) // Limit to 4 insights
  }, [topCategory, byCategory, lastMonthByCategory, totalSpent, lastMonthSpent, percentChange, budgets])

  // Find max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...monthlyData.map(m => Math.max(m.income, m.spend)), 1)
  }, [monthlyData])

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        {/* Monthly Bar Chart */}
        <section className="card col-12 monthly-overview-card">
          <h2>Monthly Overview</h2>
          <div className="monthly-bar-chart-container">
            <div className="monthly-bar-chart-scroll">
              {monthlyData.map((month, index) => {
                const isSelected = month.monthIndex === selectedMonth
                const incomeHeight = maxValue > 0 ? (month.income / maxValue) * 100 : 0
                const spendHeight = maxValue > 0 ? (month.spend / maxValue) * 100 : 0
                
                return (
                  <div
                    key={index}
                    className={`monthly-bar-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMonth(month.monthIndex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedMonth(month.monthIndex)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${month.month} month`}
                  >
                    <div className="monthly-bar-wrapper">
                      <div className="monthly-bar-stack">
                        {/* Income bar (solid) - left side */}
                        <div className="monthly-bar-group">
                          {month.income > 0 && (
                            <div
                              className="monthly-bar-income"
                              style={{ height: `${incomeHeight}%` }}
                              title={`Income: $${month.income.toFixed(2)}`}
                            />
                          )}
              </div>
                        {/* Spending bar (dotted) - right side */}
                        <div className="monthly-bar-group">
                          {month.spend > 0 && (
                            <div
                              className="monthly-bar-spend"
                              style={{ height: `${spendHeight}%` }}
                              title={`Spending: $${month.spend.toFixed(2)}`}
                            />
                          )}
                  </div>
                </div>
                </div>
                    <div className="monthly-bar-label">{month.month}</div>
                  </div>
                )
              })}
                </div>
            <div className="monthly-bar-legend">
              <div className="legend-item">
                <div className="legend-bar legend-income"></div>
                <span>Income</span>
            </div>
              <div className="legend-item">
                <div className="legend-bar legend-spend"></div>
                <span>Spending</span>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Summary Section */}
        <section className="hero-summary-container col-12">
          <div className="hero-summary-card">
            {/* Income Card */}
            <div className="hero-card-item">
              <div className="hero-card-content">
                <div className="hero-card-icon hero-card-icon-income">
                  <FiDollarSign />
                </div>
                <div className="hero-card-right">
                  <div className="hero-card-value">${totalIncome.toFixed(2)}</div>
                  <div className="hero-card-text">
                    {totalIncome > 0 
                      ? `You earned $${totalIncome.toFixed(2)} this month.`
                      : 'No income recorded this month.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Spend Card */}
            <div className="hero-card-item">
              <div className="hero-card-content">
                <div className="hero-card-icon hero-card-icon-spend">
                  <FiCreditCard />
                </div>
                <div className="hero-card-right">
                  <div className="hero-card-value">${totalSpent.toFixed(2)}</div>
                  <div className="hero-card-text">
                    {totalIncome > 0 && totalSpent > 0
                      ? (() => {
                          const percent = (totalSpent / totalIncome) * 100
                          if (percent > 100) {
                            return `You spent ${percent.toFixed(0)}% more than you earned.`
                          } else if (percent > 80) {
                            return `You spent ${percent.toFixed(0)}% of your income.`
                          } else {
                            return `You spent ${percent.toFixed(0)}% of your income.`
                          }
                        })()
                      : totalSpent > 0
                      ? `You spent $${totalSpent.toFixed(2)} this month.`
                      : 'No spending recorded this month.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income Card */}
            <div className="hero-card-item">
              <div className="hero-card-content">
                <div className={`hero-card-icon hero-card-icon-net ${netDifference >= 0 ? 'hero-card-icon-positive' : 'hero-card-icon-negative'}`}>
                  {netDifference >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                </div>
                <div className="hero-card-right">
                  <div className={`hero-card-value ${netDifference >= 0 ? 'positive' : 'negative'}`}>
                    ${netDifference >= 0 ? '+' : ''}{netDifference.toFixed(2)}
                  </div>
                  <div className="hero-card-text">
                    {netDifference > 0
                      ? `You saved $${netDifference.toFixed(2)} this month.`
                      : netDifference < 0
                      ? `You overspent by $${Math.abs(netDifference).toFixed(2)}.`
                      : 'Income and spending are equal.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card col-6">
          <h3 className="chart-title">Spending Breakdown</h3>
          
          {!hasChartData ? (
            <div className="breakdown-empty">
              <p className="muted">No category data yet.</p>
            </div>
          ) : (
            <>
              <div className="donut-chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '300px' }}>
                <PieChart width={300} height={300}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx={150}
                    cy={150}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    label={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}-${entry.name}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      // Show original value (with sign) in tooltip
                      // The payload contains the full data object
                      const originalValue = props.payload?.originalValue ?? value
                      const sign = originalValue < 0 ? '-' : ''
                      return `${sign}$${Math.abs(originalValue).toFixed(2)}`
                    }}
                    labelFormatter={(label) => label}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)'
                    }}
                  />
                </PieChart>
              </div>
              <div className="category-list">
                {sortedCategories
                  .filter(category => {
                    // Exclude Income from Spending Breakdown
                    if (category.name === 'Income') {
                      return false
                    }
                    // Show all categories that have non-zero values (same filter as chart)
                    const val = Number(category.value)
                    const isZero = val === 0 || !Number.isFinite(val)
                    return !isZero
                  })
                  .map((category, index) => (
                    <div key={category.name} className="category-item">
                      <div className="category-dot" style={{ backgroundColor: category.color }}></div>
                      <div className="category-name">{category.name}</div>
                      <div className="category-amount">${category.value.toFixed(2)}</div>
                      <div className="category-percentage">{category.percentage.toFixed(0)}%</div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>

        <section className="card col-6">
          <h3 className="chart-title">Daily Spending Trend</h3>
          {!hasDailyData ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="daily-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(day) => day}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#F4A261"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#F4A261" }}
                    activeDot={{ r: 5, fill: "#F4A261", stroke: "#fff", strokeWidth: 2 }}
                    name="Spent"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card col-12">
          <h3 className="chart-title">This Month vs Last Month</h3>
          <div className="comparison-container">
            <div className="comparison-columns">
              <div className="comparison-column">
                <h4 className="comparison-column-title">This Month</h4>
                <div className="comparison-metric">
                  <div className="comparison-label">Total Spending</div>
                  <div className="comparison-value">${totalSpent.toFixed(2)}</div>
                </div>
                <div className="comparison-metric">
                  <div className="comparison-label">Transactions</div>
                  <div className="comparison-value">{thisMonthTransactions}</div>
                </div>
                {thisMonthAvgDaily > 0 && (
                  <div className="comparison-metric">
                    <div className="comparison-label">Avg Daily Spend</div>
                    <div className="comparison-value">${thisMonthAvgDaily.toFixed(2)}</div>
                  </div>
                )}
              </div>
              
              <div className="comparison-column">
                <h4 className="comparison-column-title">Last Month</h4>
                <div className="comparison-metric">
                  <div className="comparison-label">Total Spending</div>
                  <div className="comparison-value">${lastMonthSpent.toFixed(2)}</div>
                </div>
                <div className="comparison-metric">
                  <div className="comparison-label">Transactions</div>
                  <div className="comparison-value">{lastMonthTransactions}</div>
                </div>
                {lastMonthAvgDaily > 0 && (
                  <div className="comparison-metric">
                    <div className="comparison-label">Avg Daily Spend</div>
                    <div className="comparison-value">${lastMonthAvgDaily.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="comparison-summary">{getComparisonSentence()}</p>
          </div>
        </section>

        {keyInsights.length > 0 && (
          <section className="card col-12">
            <h3 className="chart-title">Key Insights</h3>
            <div className="insights-chips">
              {keyInsights.map((insight, index) => {
                const IconComponent = insight.icon
                return (
                  <div key={index} className={`insight-chip insight-chip-${insight.type}`}>
                    <IconComponent className="insight-chip-icon" />
                    <span className="insight-chip-text">{insight.text}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
