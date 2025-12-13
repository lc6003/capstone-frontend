import { useMemo, useState } from "react"
import { addBudget, getBudgets, removeBudget, getExpenses, getBudgetTotalsByType, removeLastIncome } from "../lib/storage.js"
import { FaRegTrashAlt } from "react-icons/fa"
import { useNavigate } from "react-router-dom"

function IncomeColumn({ title, storageKey, prefix }) {
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem(storageKey) || "[]"))
  const [input, setInput] = useState("")

  function addEntry(e) {
    e.preventDefault()
    const amount = parseFloat(input)
    if (!amount || amount <= 0) return
    const updated = [...entries, amount]
    setEntries(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('incomeUpdated'))
    setInput("")
  }
  function handleDeleteLast() {
    const type = storageKey.includes("expected") ? "expected" : "actual"
    const updated = removeLastIncome(type)
    setEntries(updated)
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('incomeUpdated'))
  }

  const total = entries.reduce((a, b) => a + b, 0)

  return (
    <div>
      <h4 style={{ marginBottom: "0.5rem" }}>
        {title}: <span style={{ fontWeight: 800, color: "green" }}>${total.toFixed(2)}</span>
      </h4>
      {entries.map((amt, i) => (
        <div key={i} style={{ marginBottom: "1rem" }}>Paycheck {i + 1}: ${amt.toFixed(2)}</div>
      ))}
      <form onSubmit={addEntry} style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", flexWrap:"nowrap" }}>
        <label style={{ marginRight: "0.5rem" }}>{prefix} {entries.length + 1}:</label>
        <input className="input" type="number" step="0.01" placeholder="$ amount" value={input} onChange={(e) => setInput(e.target.value)} style={{ width: 120, marginRight: "0.5rem" }} />
        <button className="btn" type="submit">Add</button>
        <button className="btn danger" onClick={handleDeleteLast} title="Delete last entry" style={{  marginLeft: "0.5rem", minWidth: "40px", height: "40px", display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "middle", background: "crimson"}}>
          <FaRegTrashAlt size={16} color="white" />
        </button>      
      </form>
    </div>
  )
}

function spendFor(name, expenses){
  return expenses.filter(e => (e.category || "") === name).reduce((s, e) => s + (Number(e.amount) || 0), 0)
}

export default function Budget(){
  const [_, force] = useState(0)
  const [form, setForm] = useState({ name:"", limit:"", type:"" })
  const navigate = useNavigate()
  const budgets = useMemo(() => getBudgets(), [_])
  const { recurring, variable, total } = useMemo(() => getBudgetTotalsByType(), [_])
  const expenses = useMemo(() => getExpenses(), [_])

  function submit(e){
    e.preventDefault()
    if(!form.name || !form.type){
      window.alert("⚠️ Please write a category name and select either 'Recurring' or 'Variable' before adding a budget.")
      return
    }
    addBudget({ name: form.name, limit: Number(form.limit || 0), type: form.type })
    setForm({ name:"", limit:"", type:"" })
    force(x => x + 1)
  }
  function del(id){
    removeBudget(id)
    force(x => x + 1)
  }

  const recurringBudgets = budgets.filter(b => b.type === "recurring")
  const variableBudgets = budgets.filter(b => b.type !== "recurring")

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>Budget</h2>
          <form className="row" onSubmit={submit} style={{ flexDirection:"column", gap:"0.75rem", alignItems:"flex-start" }}>
            <input className="input" placeholder="Category name (e.g., Groceries)" value={form.name} onChange={e => setForm({ ...form, name:e.target.value })} style={{ width:"100%", maxWidth:500 }} />
            <div className="row" style={{ gap:"1rem", flexWrap:"wrap", alignItems:"center" }}>
              <input className="input" type="number" step="0.01" placeholder="Monthly limit (optional)" value={form.limit} onChange={e => setForm({ ...form, limit:e.target.value })} style={{ maxWidth:220 }} />
              <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                <label style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <input type="radio" name="budgetType" value="recurring" checked={form.type === "recurring"} onChange={e => setForm({ ...form, type:e.target.value })}/>
                  Recurring (monthly)
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <input type="radio" name="budgetType" value="variable" checked={form.type === "variable"} onChange={e => setForm({ ...form, type:e.target.value })}/>
                  Variable
                </label>
              </div>
              <button className="btn" type="submit">Add</button>
            </div>
          </form>
        </section>

        <section className="card col-12 center">
          <h3>Total Budgeted</h3>
          <div style={{ fontSize:36, fontWeight:800, marginTop:4 }}>${total.toFixed(2)}</div>
        </section>

        <section className="card col-12">
          <div className="two-col">
            <div className="center">
              <h4 style={{ margin:0 }}>Recurring Expenses</h4>
              <div style={{ fontSize:24, fontWeight:700, color:"#2563eb", marginTop:4 }}>${recurring.toFixed(2)}</div>
            </div>
            <div className="center">
              <h4 style={{ margin:0 }}>Variable Expenses</h4>
              <div style={{ fontSize:24, fontWeight:700, color:"#f59e0b", marginTop:4 }}>${variable.toFixed(2)}</div>
            </div>
          </div>
        </section>

        <section className="card col-6">
          <h3>Recurring</h3>
          {recurringBudgets.length === 0 ? (
            <p className="muted">No recurring budgets yet.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Category</th><th>Limit</th><th>Spent</th><th>Remaining</th><th></th></tr></thead>
              <tbody>
                {recurringBudgets.map(b => {
                  const spent = spendFor(b.name, expenses)
                  const remaining = (Number(b.limit)||0) - spent
                  return (
                    <tr key={b.id}>
                      <td>{b.name}</td>
                      <td>{b.limit ? `$${Number(b.limit).toFixed(2)}` : <span className="pill">No limit</span>}</td>
                      <td>${spent.toFixed(2)}</td>
                      <td style={{ color: remaining < 0 ? "#ef4444" : "#22c55e" }}>
                        {Number.isFinite(remaining) ? `$${remaining.toFixed(2)}` : "—"}
                      </td>
                      <td><button className="btn danger" onClick={() => del(b.id)}>Delete</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="card col-6">
          <h3>Variable</h3>
          {variableBudgets.length === 0 ? (
            <p className="muted">No variable budgets yet.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Category</th><th>Limit</th><th>Spent</th><th>Remaining</th><th></th></tr></thead>
              <tbody>
                {variableBudgets.map(b => {
                  const spent = spendFor(b.name, expenses)
                  const remaining = (Number(b.limit)||0) - spent
                  return (
                    <tr key={b.id}>
                      <td>{b.name}</td>
                      <td>{b.limit ? `$${Number(b.limit).toFixed(2)}` : <span className="pill">No limit</span>}</td>
                      <td>${spent.toFixed(2)}</td>
                      <td style={{ color: remaining < 0 ? "#ef4444" : "#22c55e" }}>
                        {Number.isFinite(remaining) ? `$${remaining.toFixed(2)}` : "—"}
                      </td>
                      <td><button className="btn danger" onClick={() => del(b.id)}>Delete</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="card col-12">
          <h3>Income Tracker</h3>
          <p className="muted" style={{ marginBottom:"1rem" }}>Track your actual and expected income below.</p>
          <div className="two-col">
            <IncomeColumn title="Actual Income" storageKey="cv_income_actual_v1" prefix="Paycheck" />
            <IncomeColumn title="Expected Income" storageKey="cv_income_expected_v1" prefix="Expected Paycheck" />
          </div>
        </section>

        <section className="card col-12 center">
          <button className="btn" onClick={() => navigate("/cash-stuffing")}>
            Open Cash Stuffing Feature
          </button>
        </section>
      </div>
    </div>
  )
}
