import { useState, useEffect } from "react"
import { fetchBudgets, createBudget, deleteBudget, fetchIncome, createIncome, deleteIncome, fetchExpenses } from "../lib/api.js"
import { FaRegTrashAlt } from "react-icons/fa"

function IncomeColumn({ title, type, prefix }) {
  const [entries, setEntries] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [type])

  async function loadEntries() {
    try {
      const data = await fetchIncome(type)
      setEntries(data)
    } catch (error) {
      console.error('Failed to load income:', error)
    }
  }

  async function addEntry(e) {
    e.preventDefault()
    const amount = parseFloat(input)
    if (!amount || amount <= 0) return

    try {
      setLoading(true)
      await createIncome({ type, amount })
      setInput("")
      await loadEntries()
    } catch (error) {
      console.error('Failed to add income:', error)
      alert('Failed to add income')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteLast() {
    if (entries.length === 0) return
    const lastEntry = entries[entries.length - 1]
    
    try {
      setLoading(true)
      await deleteIncome(lastEntry._id)
      await loadEntries()
    } catch (error) {
      console.error('Failed to delete income:', error)
      alert('Failed to delete income')
    } finally {
      setLoading(false)
    }
  }

  const total = entries.reduce((a, b) => a + b.amount, 0)

  return (
    <div>
      <h4 style={{ marginBottom: "0.5rem" }}>
        {title}: <span style={{ fontWeight: 800, color: "green" }}>${total.toFixed(2)}</span>
      </h4>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;

        return (
          <div
            key={entry._id}
            style={{
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>
              Paycheck {i + 1}: ${entry.amount.toFixed(2)}
            </span>
            {isLast && (
              <button
                className="btn danger"
                onClick={handleDeleteLast}
                title="Delete last entry"
                type="button"
                disabled={loading}
                style={{
                  minWidth: "40px",
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                  position: "relative",
                  top: "-4px"
                }}
              >
                <FaRegTrashAlt size={16} color="white" />
              </button>
            )}
          </div>
        );
      })}
      <form onSubmit={addEntry} style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", flexWrap:"nowrap" }}>
        <label style={{ marginRight: "0.5rem" }}>{prefix} {entries.length + 1}:</label>
        <input 
          className="input" 
          type="number" 
          step="0.01" 
          placeholder="$ amount" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          style={{ width: 120, marginRight: "0.5rem" }}
          disabled={loading}
        />
        <button className="btn" type="submit" disabled={loading}>Add</button>
      </form>
    </div>
  )
}

function spendFor(name, expenses){
  return expenses.filter(e => (e.category || "") === name).reduce((s, e) => s + (Number(e.amount) || 0), 0)
}

export default function Budget() {
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", limit: "", type: "" })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [budgetsData, expensesData] = await Promise.all([
        fetchBudgets(),
        fetchExpenses()
      ])
      setBudgets(budgetsData)
      setExpenses(expensesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  async function submit(e) {
    e.preventDefault()
    if(!form.name || !form.type){
      window.alert("Please write a category name and select either 'Recurring' or 'Variable' before adding a budget.")
      return
    }

    try {
      setLoading(true)
      await createBudget({ name: form.name, limit: Number(form.limit || 0), type: form.type })
      setForm({ name: "", limit: "", type: "" })
      await loadData()
    } catch (error) {
      console.error('Failed to create budget:', error)
      alert('Failed to create budget')
    } finally {
      setLoading(false)
    }
  }

  async function del(id) {
    try {
      setLoading(true)
      await deleteBudget(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete budget:', error)
      alert('Failed to delete budget')
    } finally {
      setLoading(false)
    }
  }

  const recurringBudgets = budgets.filter(b => b.type === "recurring")
  const variableBudgets = budgets.filter(b => b.type !== "recurring")
  
  const recurring = recurringBudgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0)
  const variable = variableBudgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0)
  const total = recurring + variable

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>Budget</h2>
          <form className="row" onSubmit={submit} style={{ flexDirection:"column", gap:"0.75rem", alignItems:"flex-start" }}>
            <input 
              className="input" 
              placeholder="Category name (e.g., Groceries)" 
              value={form.name} 
              onChange={e => setForm({ ...form, name:e.target.value })} 
              style={{ width:"100%", maxWidth:500 }}
              disabled={loading}
            />
            <div className="row" style={{ gap:"1rem", flexWrap:"wrap", alignItems:"center" }}>
              <input 
                className="input" 
                type="number" 
                step="0.01" 
                placeholder="Monthly limit (optional)" 
                value={form.limit} 
                onChange={e => setForm({ ...form, limit:e.target.value })} 
                style={{ maxWidth:220 }}
                disabled={loading}
              />
              <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                <label style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <input 
                    type="radio" 
                    name="budgetType" 
                    value="recurring" 
                    checked={form.type === "recurring"} 
                    onChange={e => setForm({ ...form, type:e.target.value })}
                    disabled={loading}
                  />
                  Recurring (monthly)
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <input 
                    type="radio" 
                    name="budgetType" 
                    value="variable" 
                    checked={form.type === "variable"} 
                    onChange={e => setForm({ ...form, type:e.target.value })}
                    disabled={loading}
                  />
                  Variable
                </label>
              </div>
              <button className="btn" type="submit" disabled={loading}>Add</button>
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
                    <tr key={b._id}>
                      <td>{b.name}</td>
                      <td>{b.limit ? `$${Number(b.limit).toFixed(2)}` : <span className="pill">No limit</span>}</td>
                      <td>${spent.toFixed(2)}</td>
                      <td style={{ color: remaining < 0 ? "#ef4444" : "#22c55e" }}>
                        {Number.isFinite(remaining) ? `$${remaining.toFixed(2)}` : "—"}
                      </td>
                      <td><button className="btn danger" onClick={() => del(b._id)} disabled={loading}>Delete</button></td>
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
                    <tr key={b._id}>
                      <td>{b.name}</td>
                      <td>{b.limit ? `$${Number(b.limit).toFixed(2)}` : <span className="pill">No limit</span>}</td>
                      <td>${spent.toFixed(2)}</td>
                      <td style={{ color: remaining < 0 ? "#ef4444" : "#22c55e" }}>
                        {Number.isFinite(remaining) ? `$${remaining.toFixed(2)}` : "—"}
                      </td>
                      <td><button className="btn danger" onClick={() => del(b._id)} disabled={loading}>Delete</button></td>
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
            <IncomeColumn title="Actual Income" type="actual" prefix="Paycheck" />
            <IncomeColumn title="Expected Income" type="expected" prefix="Expected Paycheck" />
          </div>
        </section>
      </div>
    </div>
  )
}