import { useMemo, useState, useEffect } from "react"
import {
  monthInsights,
  lastMonthInsights,
  getIncomeTotals,
  getBudgets,
  getExpenses,
  isSameMonth
} from "../lib/storage.js"
import { fetchExpenses } from "../lib/api.js"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts"
import {
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiBarChart,
  FiRefreshCw,
  FiDollarSign,
  FiCreditCard
} from "react-icons/fi"
import { useTranslation } from "react-i18next"
import "../styles/dashboard.css"

export default function Insights() {
  const now = new Date()
  const currentMonth = now.getUTCMonth()
  const { t } = useTranslation()

  // All expenses (from API when possible, local storage as fallback)
  const [allExpenses, setAllExpenses] = useState(() => getExpenses())

  // Load from backend API once, fall back to local storage if it fails
  useEffect(() => {
    async function loadExpensesFromApi() {
      try {
        const data = await fetchExpenses()
        if (Array.isArray(data)) {
          setAllExpenses(data)
        } else {
          setAllExpenses(getExpenses())
        }
      } catch (error) {
        console.error("Failed to load expenses from API, using local storage instead.", error)
        setAllExpenses(getExpenses())
      }
    }
    loadExpensesFromApi()
  }, [])

  // Keep expenses in sync if localStorage changes (e.g., in other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      setAllExpenses(getExpenses())
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("expensesUpdated", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("expensesUpdated", handleStorageChange)
    }
  }, [])

  // State for selected month (default to current month)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // Calculate monthly data for all 12 months
  const monthlyData = useMemo(() => {
    const allIncome = getIncomeTotals()
    const currentYear = now.getUTCFullYear()

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ]

    return months.map((monthName, monthIndex) => {
      const monthDate = new Date(currentYear, monthIndex, 1)

      const monthExpenses = allExpenses.filter(e => {
        const ed = new Date(e.date)
        return isSameMonth(ed, monthDate)
      })
      const spend = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

      let income = 0
      if (monthIndex === currentMonth) {
        const allIncomeTotals = allIncome || {}
        income = allIncomeTotals.actual || 0
      }

      return {
        month: monthName,
        monthIndex,
        income,
        spend
      }
    })
  }, [allExpenses])

  // Get insights for selected month
  const { byCategory, expenses, sum } = useMemo(() => {
    const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
    const expenses = allExpenses.filter(e => {
      const ed = new Date(e.date)
      return isSameMonth(ed, selectedMonthDate)
    })

    const byCategory = {}
    let sum = 0
    for (const e of expenses) {
      const amt = Number(e.amount) || 0
      sum += amt
      const k = e.category || "Uncategorized"
      byCategory[k] = (byCategory[k] || 0) + amt
    }

    return { sum, byCategory, expenses }
  }, [selectedMonth, allExpenses])

  // Get last month insights (month before selected month)
  const lastMonth = useMemo(() => {
    const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
    const lastMonthDate = new Date(
      selectedMonthDate.getUTCFullYear(),
      selectedMonthDate.getUTCMonth() - 1,
      1
    )

    const expenses = allExpenses.filter(e => {
      const ed = new Date(e.date)
      return isSameMonth(ed, lastMonthDate)
    })

    let sum = 0
    for (const e of expenses) {
      const amt = Number(e.amount) || 0
      sum += amt
    }
    return { sum, expenses }
  }, [selectedMonth, allExpenses])

  // State to force re-render when income changes
  const [incomeUpdateTrigger, setIncomeUpdateTrigger] = useState(0)

  useEffect(() => {
    const handleStorageChange = () => {
      setIncomeUpdateTrigger(prev => prev + 1)
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("incomeUpdated", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("incomeUpdated", handleStorageChange)
    }
  }, [])

  const incomeData = useMemo(() => {
    return getIncomeTotals()
  }, [incomeUpdateTrigger])

  // Calculate metrics
  const totalSpent = sum
  const totalIncome = incomeData.actual || 0
  const netDifference = totalIncome - totalSpent

  const topCategory =
    Object.entries(byCategory).length > 0
      ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
      : null

  const lastMonthSpent = lastMonth.sum
  const percentChange =
    lastMonthSpent > 0 ? ((totalSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0

  // Summary sentence (top paragraph, if you use it later)
  const getSummarySentence = () => {
    const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
    const daysInMonth = new Date(
      selectedMonthDate.getUTCFullYear(),
      selectedMonthDate.getUTCMonth() + 1,
      0
    ).getUTCDate()
    const isCurrentMonth = selectedMonth === currentMonth
    const currentDay = isCurrentMonth ? now.getUTCDate() : daysInMonth

    if (isCurrentMonth && currentDay > 0) {
      const projectedSpending = (totalSpent / currentDay) * daysInMonth
      if (totalIncome > 0 && projectedSpending > totalIncome) {
        const overspend = projectedSpending - totalIncome
        return t("insights.hero.spendMoreThanEarned", {
          percent: ((projectedSpending / totalIncome) * 100).toFixed(0)
        })
      }
    }

    if (lastMonthSpent === 0) {
      if (totalSpent > 0) {
        return t("insights.comparison.firstMonth")
      }
      return t("insights.hero.spendNone")
    }

    const absChange = Math.abs(percentChange)
    if (percentChange < 0) {
      return t("insights.comparison.spendingDown", {
        dollars: `$${(Math.abs(totalSpent - lastMonthSpent)).toFixed(0)}`,
        percent: absChange.toFixed(1)
      })
    } else if (percentChange > 0) {
      return t("insights.comparison.spendingUp", {
        dollars: `$${(Math.abs(totalSpent - lastMonthSpent)).toFixed(0)}`,
        percent: absChange.toFixed(1)
      })
    } else {
      return t("insights.comparison.spendingSame")
    }
  }

  const getCategoryColor = index => {
    const colors = [
      "#F4A261",
      "#E07A3F",
      "#8B5CF6",
      "#F59E0B",
      "#10B981",
      "#EF4444",
      "#EC4899",
      "#14B8A6",
      "#D97706",
      "#DC2626"
    ]
    return colors[index % colors.length]
  }

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

  const chartData = useMemo(() => {
    if (!sortedCategories || sortedCategories.length === 0) {
      return []
    }

    const validData = sortedCategories
      .filter(cat => {
        const val = Number(cat.value)
        return val !== 0 && Number.isFinite(val)
      })
      .map((cat, idx) => ({
        name: cat.name || "Uncategorized",
        value: Math.abs(Number(cat.value)),
        originalValue: Number(cat.value),
        color: cat.color || getCategoryColor(idx)
      }))

    return validData
  }, [sortedCategories])

  const hasChartData = chartData.length > 0

  const dailySeries = useMemo(() => {
    const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
    const daysInMonth = new Date(
      selectedMonthDate.getUTCFullYear(),
      selectedMonthDate.getUTCMonth() + 1,
      0
    ).getUTCDate()
    const totals = Array.from({ length: daysInMonth }, (_, idx) => ({
      day: idx + 1,
      value: 0
    }))

    expenses.forEach(exp => {
      const date = new Date(exp.date)
      if (Number.isNaN(date.getTime())) return
      const dayIndex = date.getUTCDate()
      if (!Number.isFinite(dayIndex) || dayIndex < 1 || dayIndex > daysInMonth) return
      totals[dayIndex - 1].value += Number(exp.amount) || 0
    })

    return totals
  }, [expenses, selectedMonth])

  const hasDailyData = dailySeries.some(point => point.value > 0)

  const thisMonthTransactions = expenses.length
  const lastMonthTransactions = lastMonth.expenses.length

  const selectedMonthDate = new Date(now.getUTCFullYear(), selectedMonth, 1)
  const daysInSelectedMonth = new Date(
    selectedMonthDate.getUTCFullYear(),
    selectedMonthDate.getUTCMonth() + 1,
    0
  ).getUTCDate()
  const isCurrentMonth = selectedMonth === currentMonth
  const currentDay = isCurrentMonth ? now.getUTCDate() : daysInSelectedMonth
  const thisMonthAvgDaily = currentDay > 0 ? totalSpent / currentDay : 0

  const lastMonthDate = new Date(now.getUTCFullYear(), selectedMonth - 1, 1)
  const daysInLastMonth = new Date(
    lastMonthDate.getUTCFullYear(),
    lastMonthDate.getUTCMonth() + 1,
    0
  ).getUTCDate()
  const lastMonthAvgDaily = daysInLastMonth > 0 ? lastMonthSpent / daysInLastMonth : 0

  const getComparisonSentence = () => {
    if (lastMonthSpent === 0) {
      if (totalSpent > 0) {
        return t("insights.comparison.firstMonth")
      }
      return t("insights.comparison.noData")
    }

    const dollarDiff = totalSpent - lastMonthSpent
    const absPercentChange = Math.abs(percentChange)

    if (dollarDiff > 0) {
      return t("insights.comparison.spendingUp", {
        dollars: `$${Math.abs(dollarDiff).toFixed(0)}`,
        percent: absPercentChange.toFixed(1)
      })
    } else if (dollarDiff < 0) {
      return t("insights.comparison.spendingDown", {
        dollars: `$${Math.abs(dollarDiff).toFixed(0)}`,
        percent: absPercentChange.toFixed(1)
      })
    } else {
      return t("insights.comparison.spendingSame")
    }
  }

  const lastMonthByCategory = useMemo(() => {
    const categoryMap = {}
    for (const e of lastMonth.expenses) {
      const amt = Number(e.amount) || 0
      const key = e.category || "Uncategorized"
      categoryMap[key] = (categoryMap[key] || 0) + amt
    }
    return categoryMap
  }, [lastMonth.expenses])

  const budgets = useMemo(() => getBudgets(), [])

  const [recurringPayments, setRecurringPayments] = useState([])

  const merchantNormalizationMap = {
    STARBUCKS: "Starbucks",
    UBER: "Uber",
    "UBER *TRIP": "Uber",
    AMZN: "Amazon",
    "AMAZON MKTPLACE": "Amazon",
    MCDONALDS: "McDonald's"
  }

  const normalizeMerchant = name => {
    if (!name) return name

    const nameUpper = name.toUpperCase().trim()

    for (const [key, cleanVersion] of Object.entries(merchantNormalizationMap)) {
      if (nameUpper.includes(key)) {
        return cleanVersion
      }
    }

    let cleaned = name.trim()

    cleaned = cleaned.replace(/#\d+/g, "")
    cleaned = cleaned.replace(/\s+\d+$/, "")
    cleaned = cleaned.replace(/\s+/g, " ").trim()

    return cleaned
  }

  const detectRecurringPayments = transactions => {
    if (!transactions || transactions.length === 0) return []

    const merchantGroups = {}

    transactions.forEach(transaction => {
      const rawMerchant = (transaction.description || "").trim()
      if (!rawMerchant) return

      const merchant = normalizeMerchant(rawMerchant)

      const amount = Math.abs(Number(transaction.amount) || 0)
      const date = new Date(transaction.date)

      if (!isNaN(date.getTime()) && amount > 0) {
        if (!merchantGroups[merchant]) {
          merchantGroups[merchant] = []
        }
        merchantGroups[merchant].push({ date, amount })
      }
    })

    const recurring = []

    Object.entries(merchantGroups).forEach(([merchant, transactions]) => {
      if (transactions.length < 2) return

      const sorted = [...transactions].sort((a, b) => a.date - b.date)

      const amountGroups = []
      sorted.forEach(trans => {
        let foundGroup = false
        for (let group of amountGroups) {
          const avgAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length
          const percentDiff = Math.abs((trans.amount - avgAmount) / avgAmount)

          if (percentDiff <= 0.1) {
            group.push(trans)
            foundGroup = true
            break
          }
        }
        if (!foundGroup) {
          amountGroups.push([trans])
        }
      })

      amountGroups.forEach(group => {
        if (group.length < 2) return

        const timeDiffs = []
        for (let i = 1; i < group.length; i++) {
          const diffMs = group[i].date - group[i - 1].date
          const diffDays = diffMs / (1000 * 60 * 60 * 24)
          timeDiffs.push(diffDays)
        }

        let weeklyMatches = 0
        let monthlyMatches = 0

        for (let diff of timeDiffs) {
          if (diff >= 6 && diff <= 8) {
            weeklyMatches++
          }
          if (diff >= 30 && diff <= 32) {
            monthlyMatches++
          }
        }

        const threshold = Math.ceil(timeDiffs.length / 2)
        let frequency = null

        if (weeklyMatches >= threshold && weeklyMatches > 0) {
          frequency = "weekly"
        } else if (monthlyMatches >= threshold && monthlyMatches > 0) {
          frequency = "monthly"
        }

        if (frequency) {
          const averageAmount =
            group.reduce((sum, t) => sum + t.amount, 0) / group.length
          const lastCharge = group[group.length - 1].date

          recurring.push({
            merchant,
            averageAmount: Math.round(averageAmount * 100) / 100,
            frequency,
            lastCharge
          })
        }
      })
    })

    return recurring.sort((a, b) => b.lastCharge - a.lastCharge)
  }

  useEffect(() => {
    const detected = detectRecurringPayments(allExpenses)
    setRecurringPayments(detected)
  }, [allExpenses])

  const keyInsights = useMemo(() => {
    const insights = []

    if (topCategory && topCategory[1] > 0) {
      const topCategoryPercent =
        totalSpent > 0 ? (topCategory[1] / totalSpent) * 100 : 0
      insights.push({
        icon: FiBarChart,
        text: t("insights.keyInsights.topCategory", {
          category: topCategory[0],
          percent: topCategoryPercent.toFixed(0)
        }),
        type: "info"
      })
    }

    if (lastMonthSpent > 0 && topCategory) {
      const lastMonthCategorySpent = lastMonthByCategory[topCategory[0]] || 0
      if (lastMonthCategorySpent > 0) {
        const categoryChange =
          ((topCategory[1] - lastMonthCategorySpent) / lastMonthCategorySpent) * 100
        if (Math.abs(categoryChange) >= 10) {
          insights.push({
            icon: categoryChange > 0 ? FiTrendingUp : FiTrendingDown,
            text:
              categoryChange > 0
                ? t("insights.keyInsights.topCategoryChangeUp", {
                    category: topCategory[0],
                    percent: Math.abs(categoryChange).toFixed(0)
                  })
                : t("insights.keyInsights.topCategoryChangeDown", {
                    category: topCategory[0],
                    percent: Math.abs(categoryChange).toFixed(0)
                  }),
            type: categoryChange > 0 ? "warning" : "success"
          })
        }
      }
    }

    if (budgets.length > 0 && totalSpent > 0) {
      const totalBudget = budgets.reduce(
        (sum, b) => sum + (Number(b.limit) || 0),
        0
      )
      if (totalBudget > 0) {
        const budgetUsage = (totalSpent / totalBudget) * 100
        if (budgetUsage >= 70) {
          insights.push({
            icon: FiAlertTriangle,
            text: t("insights.keyInsights.budgetUsageHigh", {
              percent: budgetUsage.toFixed(0)
            }),
            type: budgetUsage >= 90 ? "warning" : "info"
          })
        }
      }
    }

    if (lastMonthSpent > 0 && Math.abs(percentChange) >= 5) {
      insights.push({
        icon: percentChange > 0 ? FiTrendingUp : FiTrendingDown,
        text:
          percentChange > 0
            ? t("insights.keyInsights.overallUp", {
                percent: Math.abs(percentChange).toFixed(0)
              })
            : t("insights.keyInsights.overallDown", {
                percent: Math.abs(percentChange).toFixed(0)
              }),
        type: percentChange > 0 ? "warning" : "success"
      })
    }

    if (lastMonthSpent > 0 && insights.length < 4) {
      for (const [categoryName, categorySpent] of Object.entries(byCategory)) {
        if (categoryName === topCategory?.[0]) continue

        const lastMonthCategorySpent = lastMonthByCategory[categoryName] || 0
        if (lastMonthCategorySpent > 0 && categorySpent > 0) {
          const categoryChange =
            ((categorySpent - lastMonthCategorySpent) / lastMonthCategorySpent) *
            100
          if (Math.abs(categoryChange) >= 20) {
            insights.push({
              icon: categoryChange > 0 ? FiTrendingUp : FiTrendingDown,
              text:
                categoryChange > 0
                  ? t("insights.keyInsights.categoryChangeUp", {
                      category: categoryName,
                      percent: Math.abs(categoryChange).toFixed(0)
                    })
                  : t("insights.keyInsights.categoryChangeDown", {
                      category: categoryName,
                      percent: Math.abs(categoryChange).toFixed(0)
                    }),
              type: categoryChange > 0 ? "warning" : "success"
            })
            break
          }
        }
      }
    }

    return insights.slice(0, 4)
  }, [
    topCategory,
    byCategory,
    lastMonthByCategory,
    totalSpent,
    lastMonthSpent,
    percentChange,
    budgets,
    t
  ])

  const maxValue = useMemo(() => {
    return Math.max(
      ...monthlyData.map(m => Math.max(m.income, m.spend)),
      1
    )
  }, [monthlyData])

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        {/* Monthly Bar Chart */}
        <section className="card col-12 monthly-overview-card">
          <h2>{t("insights.charts.monthlyOverviewTitle", "Monthly Overview")}</h2>
          <div className="monthly-bar-chart-container">
            <div className="monthly-bar-chart-scroll">
              {monthlyData.map((month, index) => {
                const isSelected = month.monthIndex === selectedMonth
                const incomeHeight =
                  maxValue > 0 ? (month.income / maxValue) * 100 : 0
                const spendHeight =
                  maxValue > 0 ? (month.spend / maxValue) * 100 : 0

                return (
                  <div
                    key={index}
                    className={`monthly-bar-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedMonth(month.monthIndex)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
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
                        <div className="monthly-bar-group">
                          {month.income > 0 && (
                            <div
                              className="monthly-bar-income"
                              style={{ height: `${incomeHeight}%` }}
                              title={t(
                                "insights.charts.monthlyOverviewLegendIncome",
                                "Income"
                              ) + `: $${month.income.toFixed(2)}`}
                            />
                          )}
                        </div>
                        <div className="monthly-bar-group">
                          {month.spend > 0 && (
                            <div
                              className="monthly-bar-spend"
                              style={{ height: `${spendHeight}%` }}
                              title={t(
                                "insights.charts.monthlyOverviewLegendSpend",
                                "Spending"
                              ) + `: $${month.spend.toFixed(2)}`}
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
                <span>
                  {t("insights.charts.monthlyOverviewLegendIncome", "Income")}
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-bar legend-spend"></div>
                <span>
                  {t("insights.charts.monthlyOverviewLegendSpend", "Spending")}
                </span>
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
                  <div className="hero-card-value">
                    ${totalIncome.toFixed(2)}
                  </div>
                  <div className="hero-card-text">
                    {totalIncome > 0
                      ? t("insights.hero.incomePositive", {
                          amount: `$${totalIncome.toFixed(2)}`
                        })
                      : t("insights.hero.incomeNone")}
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
                  <div className="hero-card-value">
                    ${totalSpent.toFixed(2)}
                  </div>
                  <div className="hero-card-text">
                    {totalIncome > 0 && totalSpent > 0
                      ? (() => {
                          const percent = (totalSpent / totalIncome) * 100
                          if (percent > 100) {
                            return t("insights.hero.spendMoreThanEarned", {
                              percent: percent.toFixed(0)
                            })
                          } else {
                            return t("insights.hero.spendOfIncome", {
                              percent: percent.toFixed(0)
                            })
                          }
                        })()
                      : totalSpent > 0
                      ? t("insights.hero.spendOnlyAmount", {
                          amount: `$${totalSpent.toFixed(2)}`
                        })
                      : t("insights.hero.spendNone")}
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income Card */}
            <div className="hero-card-item">
              <div className="hero-card-content">
                <div
                  className={`hero-card-icon hero-card-icon-net ${
                    netDifference >= 0
                      ? "hero-card-icon-positive"
                      : "hero-card-icon-negative"
                  }`}
                >
                  {netDifference >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                </div>
                <div className="hero-card-right">
                  <div
                    className={`hero-card-value ${
                      netDifference >= 0 ? "positive" : "negative"
                    }`}
                  >
                    ${netDifference >= 0 ? "+" : ""}
                    {netDifference.toFixed(2)}
                  </div>
                  <div className="hero-card-text">
                    {netDifference > 0
                      ? t("insights.hero.netSaved", {
                          amount: `$${netDifference.toFixed(2)}`
                        })
                      : netDifference < 0
                      ? t("insights.hero.netOverspent", {
                          amount: `$${Math.abs(netDifference).toFixed(2)}`
                        })
                      : t("insights.hero.netEqual")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card col-6">
          <h3 className="chart-title">
            {t("insights.charts.spendingBreakdownTitle", "Spending Breakdown")}
          </h3>

          {!hasChartData ? (
            <div className="breakdown-empty">
              <p className="muted">
                {t("insights.charts.spendingBreakdownEmpty", "No category data yet.")}
              </p>
            </div>
          ) : (
            <>
              <div
                className="donut-chart-container"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  height: "300px"
                }}
              >
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
                      const originalValue =
                        props.payload?.originalValue ?? value
                      const sign = originalValue < 0 ? "-" : ""
                      return `${sign}$${Math.abs(originalValue).toFixed(2)}`
                    }}
                    labelFormatter={label => label}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text)"
                    }}
                  />
                </PieChart>
              </div>
              <div className="category-list">
                {sortedCategories
                  .filter(category => {
                    const val = Number(category.value)
                    const isZero = val === 0 || !Number.isFinite(val)
                    if (category.name === "Income") {
                      return true
                    }
                    return !isZero
                  })
                  .map(category => (
                    <div key={category.name} className="category-item">
                      <div
                        className="category-dot"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div className="category-name">{category.name}</div>
                      <div className="category-amount">
                        ${category.value.toFixed(2)}
                      </div>
                      <div className="category-percentage">
                        {category.percentage.toFixed(0)}%
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>

        <section className="card col-6">
          <h3 className="chart-title">
            {t("insights.charts.dailyTrendTitle", "Daily Spending Trend")}
          </h3>
          {!hasDailyData ? (
            <p className="muted">
              {t("insights.charts.dailyTrendEmpty", "No data yet.")}
            </p>
          ) : (
            <div className="daily-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={day => day}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value => `$${value}`}
                  />
                  <Tooltip
                    formatter={value => `$${Number(value).toFixed(2)}`}
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text)"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#F4A261"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      stroke: "#fff",
                      fill: "#F4A261"
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#F4A261",
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    name={t("insights.charts.totalSpendingLabel", "Total Spending")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card col-12">
          <h3 className="chart-title">
            {t("insights.charts.thisVsLastTitle", "This Month vs Last Month")}
          </h3>
          <div className="comparison-container">
            <div className="comparison-columns">
              <div className="comparison-column">
                <h4 className="comparison-column-title">
                  {t("insights.charts.thisMonthColumn", "This Month")}
                </h4>
                <div className="comparison-metric">
                  <div className="comparison-label">
                    {t("insights.charts.totalSpendingLabel", "Total Spending")}
                  </div>
                  <div className="comparison-value">
                    ${totalSpent.toFixed(2)}
                  </div>
                </div>
                <div className="comparison-metric">
                  <div className="comparison-label">
                    {t("insights.charts.transactionsLabel", "Transactions")}
                  </div>
                  <div className="comparison-value">
                    {thisMonthTransactions}
                  </div>
                </div>
                {thisMonthAvgDaily > 0 && (
                  <div className="comparison-metric">
                    <div className="comparison-label">
                      {t("insights.charts.avgDailySpendLabel", "Avg Daily Spend")}
                    </div>
                    <div className="comparison-value">
                      ${thisMonthAvgDaily.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="comparison-column">
                <h4 className="comparison-column-title">
                  {t("insights.charts.lastMonthColumn", "Last Month")}
                </h4>
                <div className="comparison-metric">
                  <div className="comparison-label">
                    {t("insights.charts.totalSpendingLabel", "Total Spending")}
                  </div>
                  <div className="comparison-value">
                    ${lastMonthSpent.toFixed(2)}
                  </div>
                </div>
                <div className="comparison-metric">
                  <div className="comparison-label">
                    {t("insights.charts.transactionsLabel", "Transactions")}
                  </div>
                  <div className="comparison-value">
                    {lastMonthTransactions}
                  </div>
                </div>
                {lastMonthAvgDaily > 0 && (
                  <div className="comparison-metric">
                    <div className="comparison-label">
                      {t("insights.charts.avgDailySpendLabel", "Avg Daily Spend")}
                    </div>
                    <div className="comparison-value">
                      ${lastMonthAvgDaily.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="comparison-summary">{getComparisonSentence()}</p>
          </div>
        </section>

        {keyInsights.length > 0 && (
          <section className="card col-12">
            <h3 className="chart-title">
              {t("insights.keyInsightsTitle", "Key Insights")}
            </h3>
            <div className="insights-chips">
              {keyInsights.map((insight, index) => {
                const IconComponent = insight.icon
                return (
                  <div
                    key={index}
                    className={`insight-chip insight-chip-${insight.type}`}
                  >
                    <IconComponent className="insight-chip-icon" />
                    <span className="insight-chip-text">{insight.text}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Subscriptions Card */}
        <section className="card col-12">
          <h3 className="chart-title">
            {t("insights.subscriptions.title", "Subscriptions")}
          </h3>
          {recurringPayments.length === 0 ? (
            <p
              className="muted"
              style={{ padding: "20px 0", textAlign: "center" }}
            >
              {t(
                "insights.subscriptions.empty",
                "No recurring payments detected yet."
              )}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
                marginTop: "16px"
              }}
            >
              {recurringPayments.map((subscription, index) => {
                const lastChargeDate = new Date(subscription.lastCharge)
                const nextChargeDate = new Date(lastChargeDate)

                if (subscription.frequency === "weekly") {
                  nextChargeDate.setDate(nextChargeDate.getDate() + 7)
                } else if (subscription.frequency === "monthly") {
                  nextChargeDate.setMonth(nextChargeDate.getMonth() + 1)
                }

                const formatDate = date => {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                }

                const isUpcoming =
                  nextChargeDate <=
                  new Date(
                    new Date().setDate(new Date().getDate() + 7)
                  )

                return (
                  <div
                    key={index}
                    style={{
                      padding: "20px",
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--primary)"
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(244, 162, 97, 0.15)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px"
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "var(--text)",
                          flex: 1
                        }}
                      >
                        {subscription.merchant}
                      </h4>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          backgroundColor: "rgba(244, 162, 97, 0.15)",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--primary)",
                          textTransform: "capitalize"
                        }}
                      >
                        <FiRefreshCw size={12} />
                        {t(
                          `insights.subscriptions.frequency.${subscription.frequency}`,
                          subscription.frequency
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderTop: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)"
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                            marginBottom: "2px"
                          }}
                        >
                          {t(
                            "insights.subscriptions.averageAmount",
                            "Average Amount"
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "var(--text)"
                          }}
                        >
                          ${subscription.averageAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--muted)",
                          marginBottom: "4px"
                        }}
                      >
                        {t(
                          "insights.subscriptions.nextCharge",
                          "Next Expected Charge"
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: isUpcoming
                            ? "var(--primary)"
                            : "var(--text)"
                        }}
                      >
                        {formatDate(nextChargeDate)}
                        {isUpcoming && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "11px",
                              padding: "2px 6px",
                              backgroundColor: "rgba(244, 162, 97, 0.2)",
                              borderRadius: "4px",
                              color: "var(--primary)"
                            }}
                          >
                            {t("insights.subscriptions.soon", "Soon")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
