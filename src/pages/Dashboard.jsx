import { Link } from 'react-router-dom'
import { totals, monthInsights, getBudgetTotalsByType, getIncomeTotals, getTotalCreditCardDebt } from '../lib/storage.js'

export default function Dashboard(){
  const { total, byCategory, budgetLimits } = totals()
  const { sum } = monthInsights()
  const { total: budgetedTotal } = getBudgetTotalsByType()
  const { actual, expected } = getIncomeTotals()
  const totalDebt = getTotalCreditCardDebt()

  const categories = Object.keys(byCategory)
  const overs = categories.filter(c => byCategory[c] > (budgetLimits[c]||Infinity))

  return (
    <div className="grid">
      <section className="card" style={{gridColumn:'span 12'}}>
        <h2 style={{margin:'0 0 6px'}}>Welcome back 👋</h2>
        <p className="muted">Quick summary of your budgets and spending.</p>
        <div className="spacer"></div>
        <div className="row">
          <Link to="/expenses" className="btn secondary">Add Expense</Link>
          <Link to="/budget" className="btn secondary">New Budget</Link>
          <Link to="/insights" className="btn">View Insights</Link>
        </div>
      </section>

      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Income</h3>
        <p className='muted'>Income earned this month.</p>
        <div style={{fontSize:36,fontWeight:800}}><b>${actual.toFixed(2)}</b></div>
        <p className="muted">Expected income for this month: <b>${expected.toFixed(2)}</b></p>
      </section>

      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Total Budgeted Amount</h3>
        <div style={{fontSize:36,fontWeight:800}}>${budgetedTotal.toFixed(2)}</div>
        <p className="muted">Sum of all recurring and variable budgets.</p>
      </section>

      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Total Spent (All time)</h3>
        <div style={{fontSize:36,fontWeight:800}}>${total.toFixed(2)}</div>
        <p className="muted">This month so far: <b>${sum.toFixed(2)}</b></p>
      </section>

      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Budgets At Risk</h3>
        {overs.length === 0 ? <p className="muted">No categories over their limit 🎉</p> : (
          <ul>
            {overs.map(c => (
              <li key={c} className="row" style={{justifyContent:'space-between'}}>
                <span>{c}</span>
                <span>${byCategory[c].toFixed(2)} / ${budgetLimits[c].toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Credit Card Debt</h3>
        <div style={{fontSize:36,fontWeight:800}}>${totalDebt.toFixed(2)}</div>
        <p className="muted">The sum of all credit card balances after input payments. </p>
      </section>

      <section className="card" style={{gridColumn:'span 12'}}>
        <h3>By Category</h3>
        {categories.length===0 ? <p className="muted">No expenses yet. Add one on the <Link to="/expenses">Expenses</Link> page.</p> : (
          <table className="table">
            <thead><tr><th>Category</th><th>Spent</th><th>Limit</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c}>
                  <td>{c}</td>
                  <td>${byCategory[c].toFixed(2)}</td>
                  <td>{Number.isFinite(budgetLimits[c])? `$${budgetLimits[c].toFixed(2)}` : <span className="pill">No limit</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
