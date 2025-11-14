import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { fetchBudgets, fetchExpenses, fetchIncome, fetchCreditCards } from "../lib/api.js"
import "../styles/dashboard.css"

const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—")

function calculateRealTimeBalance(card) {
  const balance = Number(card.balance) || 0
  const pending = Number(card.pending) || 0
  const payment = Number(card.payment) || 0
  return balance + pending - payment
}

export default function Dashboard(){
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState({ actual: [], expected: [] })
  const [creditCards, setCreditCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [budgetsData, expensesData, actualIncome, expectedIncome, cardsData] = await Promise.all([
        fetchBudgets(),
        fetchExpenses(),
        fetchIncome('actual'),
        fetchIncome('expected'),
        fetchCreditCards()
      ])
      setBudgets(budgetsData)
      setExpenses(expensesData)
      setIncome({ actual: actualIncome, expected: expectedIncome })
      setCreditCards(cardsData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  
  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category || "Uncategorized"
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0)
    return acc
  }, {})

  const budgetLimits = budgets.reduce((acc, b) => {
    if (Number.isFinite(b.limit)) {
      acc[b.name] = b.limit
    }
    return acc
  }, {})

  const now = new Date()
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const sum = thisMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const budgetedTotal = budgets.reduce((s, b) => s + (Number(b.limit) || 0), 0)
  const actual = income.actual.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const expected = income.expected.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const totalDebt = creditCards.reduce((sum, card) => sum + calculateRealTimeBalance(card), 0)
  const categories = Object.keys(byCategory)
  const overs = categories.filter(c => {
    const spent = Number(byCategory[c]) || 0
    const limit = budgetLimits[c]
    return Number.isFinite(limit) && spent > limit
  })

  const envelopeItems = categories.map(c => {
    const spent = Number(byCategory[c]) || 0
    const limit = budgetLimits[c]
    const pct = Number.isFinite(limit) && limit > 0 ? Math.min(100, Math.round((spent/limit)*100)) : 0
    return {name: c, spent, limit, pct}
  }).sort((a,b) => b.pct - a.pct).slice(0, 8)

  if (loading) {
    return (
      <div className="dashboard-page-wrapper">
        <div className="dashboard-container dash">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return(
    <div className="dashboard-page-wrapper">
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />
      <div className="dashboard-container dash">
        <div className="grid">
        <section className="card col-12">
          <h2>Welcome back</h2>
          <p className="muted">Quick summary of your budgets and spending.</p>
          <div className="row gap-8">
            <Link to="/expenses" className="btn secondary">Add Expense</Link>
            <Link to="/budget" className="btn secondary">New Budget</Link>
            <Link to="/insights" className="btn">View Insights</Link>
          </div>
        </section>

        <section className="card col-6 kpi">
          <h3>Income</h3>
          <p className="muted">Income earned this month.</p>
          <div className="stat"><b>{money(actual)}</b></div>
          <p className="muted label">Expected income for this month: <b>{money(expected)}</b></p>
        </section>

        <section className="card col-6 kpi">
          <h3>Total Budgeted Amount</h3>
          <div className="stat">{money(budgetedTotal)}</div>
          <p className="muted label">Sum of all recurring and variable budgets.</p>
        </section>

        <section className="card col-6 kpi">
          <h3>Total Spent (All time)</h3>
          <div className="stat">{money(total)}</div>
          <p className="muted label">This month so far: <b>{money(sum)}</b></p>
        </section>

        <section className="card col-6 kpi">
          <h3>Credit Card Debt</h3>
          <div className="stat">{money(totalDebt)}</div>
          <p className="muted">The sum of all credit card balances after input payments.</p>
        </section>

        <section className="card col-12">
          <h3>Envelopes</h3>
          {envelopeItems.length===0?(
            <p className="muted">No budgets yet. Create one on the <Link to="/budget">Budget</Link> page.</p>
          ):(
            <div className="envelopes">
              {envelopeItems.map(e=>(
                <div key={e.name} className="panel">
                  <div className="panel-head">
                    <strong>{e.name}</strong>
                    <span className="muted">{money(e.spent)}{Number.isFinite(e.limit)?` / ${money(e.limit).slice(1)}`:""}</span>
                  </div>
                  <div className="progress"><div style={{width:`${e.pct}%`}}/></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card col-6">
          <h3>Budgets At Risk</h3>
          {overs.length===0?(
            <p className="muted">No categories over their limit</p>
          ):(
            <ul className="list">
              {overs.map(c=>{
                const spent=Number(byCategory[c])||0
                const limit=budgetLimits[c]
                return(
                  <li key={c} className="list-row">
                    <span>{c}</span>
                    <span>{money(spent)} / {Number.isFinite(limit)?money(limit):"—"}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card col-12 mt-16">
          <h3>By Category</h3>
          {categories.length===0?(
            <p className="muted">No expenses yet. Add one on the <Link to="/expenses">Expenses</Link> page.</p>
          ):(
            <table className="table">
              <thead><tr><th>Category</th><th>Spent</th><th>Limit</th></tr></thead>
              <tbody>
                {categories.map(c=>{
                  const spent=Number(byCategory[c])||0
                  const limit=budgetLimits[c]
                  return(
                    <tr key={c}>
                      <td>{c}</td>
                      <td>{money(spent)}</td>
                      <td>{Number.isFinite(limit)?money(limit):<span className="pill">No limit</span>}</td>
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