import { Link } from "react-router-dom"
import {
  totals,
  monthInsights,
  getBudgetTotalsByType,
  getIncomeTotals,
  getTotalCreditCardDebt
} from "../lib/storage.js"
import "../styles/dashboard.css"


const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—")

export default function Dashboard(){
  const t=totals()||{}
  const total=Number.isFinite(t?.total)?t.total:0
  const byCategory=t?.byCategory||{}
  const budgetLimits=t?.budgetLimits||{}
  const m=monthInsights()||{}
  const sum=Number.isFinite(m?.sum)?m.sum:0
  const b=getBudgetTotalsByType()||{}
  const budgetedTotal=Number.isFinite(b?.total)?b.total:0
  const inc=getIncomeTotals()||{}
  const actual=Number.isFinite(inc?.actual)?inc.actual:0
  const expected=Number.isFinite(inc?.expected)?inc.expected:0
  const debtRaw=getTotalCreditCardDebt?.()
  const totalDebt=Number.isFinite(debtRaw)?debtRaw:0

  const categories=Object.keys(byCategory)
  const overs=categories.filter(c=>{
    const spent=Number(byCategory[c])||0
    const limit=budgetLimits[c]
    return Number.isFinite(limit)&&spent>limit
  })

  const envelopeItems=categories.map(c=>{
    const spent=Number(byCategory[c])||0
    const limit=budgetLimits[c]
    const pct=Number.isFinite(limit)&&limit>0?Math.min(100,Math.round((spent/limit)*100)):0
    return {name:c,spent,limit,pct}
  }).sort((a,b)=>b.pct-a.pct).slice(0,8)

  return(
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2 style={{margin:"0 0 6px"}}>Welcome back 👋</h2>
          <p className="muted">Quick summary of your budgets and spending.</p>
          <div className="spacer"/>
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
            <p className="muted">No categories over their limit 🎉</p>
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
  )
}
