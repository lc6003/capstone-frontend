import { useState, useEffect } from "react"
import { fetchBudgets, createBudget, deleteBudget, fetchIncome, createIncome, deleteIncome } from "../lib/api.js"
import { FaRegTrashAlt } from "react-icons/fa"
import { useTranslation } from "react-i18next"

function IncomeColumn({ title, type, prefix }) {
  const { t } = useTranslation("common")
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
      console.error("Failed to load income:", error)
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
      console.error("Failed to add income:", error)
      alert(t("budget.alerts.failedAddIncome"))
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
      console.error("Failed to delete income:", error)
      alert(t("budget.alerts.failedDeleteIncome"))
    } finally {
      setLoading(false)
    }
  }

  const total = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      {/* Total */}
      <h4 style={{ marginBottom: "0.5rem" }}>
        {title}:{" "}
        <span style={{ fontWeight: 800, color: "green" }}>
          ${total.toFixed(2)}
        </span>
      </h4>

      {/* Paychecks list */}
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1

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
              {t("budget.income.paycheckLabel")} {i + 1}: $
              {entry.amount.toFixed(2)}
            </span>

            {isLast && (
              <button
                className="btn danger"
                onClick={handleDeleteLast}
                title={t("budget.income.deleteLastTitle")}
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
                  top: "-4px",
                  background: "crimson",
                }}
              >
                <FaRegTrashAlt size={16} color="white" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add paycheck form */}
      <form
        onSubmit={addEntry}
        style={{
          marginTop: "0.5rem",
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <label style={{ marginRight: "0.5rem" }}>
          {prefix} {entries.length + 1}:
        </label>

        <input
          className="input"
          type="number"
          step="0.01"
          placeholder={t("budget.income.amountPlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: 120, marginRight: "0.5rem" }}
          disabled={loading}
        />

        <button className="btn" type="submit" disabled={loading}>
          {t("budget.actions.add")}
        </button>
      </form>
    </div>
  )
}


export default function Budget() {
  const { t } = useTranslation("common")
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", limit: "", type: "" })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const budgetsData = await fetchBudgets()
      setBudgets(budgetsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  async function submit(e) {
    e.preventDefault()
    if(!form.name || !form.type){
      window.alert(t("budget.alerts.missingFields"))
      return
    }

    try {
      setLoading(true)
      await createBudget({ name: form.name, limit: Number(form.limit || 0), type: form.type })
      setForm({ name: "", limit: "", type: "" })
      await loadData()
    } catch (error) {
      console.error('Failed to create budget:', error)
      alert(t("budget.alerts.failedCreateBudget"))
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
      alert(t("budget.alerts.failedDeleteBudget"))
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

        {/* Creat a budget */}
        <section className="card col-12">
          <h2>{t("budget.title")}</h2>
          <form className="row" onSubmit={submit} style={{ flexDirection:"column", gap:"0.75rem", alignItems:"flex-start" }}>
            <input 
              className="input" 
              placeholder={t("budget.form.categoryPlaceholder")} 
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
                placeholder={t("budget.form.limitPlaceholder")} 
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
                  {t("budget.types.recurring")}
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
                  {t("budget.types.variable")}
                </label>
              </div>
              <button className="btn" type="submit" disabled={loading}>{t("budget.actions.add")}</button>
            </div>
          </form>
        </section>

        {/* Total Summary */}
        <section className="card col-12 center">
          <h3>{t("budget.summary.totalBudgeted")}</h3>
          <div style={{ fontSize:36, fontWeight:800, marginTop:4 }}>${total.toFixed(2)}</div>
        </section>

        {/* Individual Totals of Recurring/Variable Budgets */}
        <section className="card col-12">
          <div className="two-col">
            <div className="center">
              <h4 style={{ margin:0 }}>{t("budget.summary.recurringExpenses")}</h4>
              <div style={{ fontSize:24, fontWeight:700, color:"#2563eb", marginTop:4 }}>${recurring.toFixed(2)}</div>
            </div>
            <div className="center">
              <h4 style={{ margin:0 }}>{t("budget.summary.variableExpenses")}</h4>
              <div style={{ fontSize:24, fontWeight:700, color:"#f59e0b", marginTop:4 }}>${variable.toFixed(2)}</div>
            </div>
          </div>
        </section>

        {/* Recurring Budget Table */}
        <section className="card col-6">
          <h3>{t("budget.tables.recurringTitle")}</h3>
          {recurringBudgets.length === 0 ? (
            <p className="muted">{t("budget.tables.noneRecurring")}</p>
          ) : (
            <table className="table" style={{width: "100%", tableLayout: "fixed" }}>
              <colgroup><col style={{ width: "50%" }} /><col style={{ width: "30%" }} /><col style={{ width: "20%" }} /></colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>{t("budget.table.category")}</th>
                  <th style={{ textAlign: "center"}}>{t("budget.table.limit")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recurringBudgets.map(b => {
                  return (
                    <tr key={b._id}>
                      <td style={{ textAlign: "left"}}>{b.name}</td>
                      <td style={{ textAlign: "center"}}>{b.limit ? `$${Number(b.limit).toFixed(2)}` : <span className="pill">{t("budget.table.noLimit")}</span>}</td>
                      <td style={{ textAlign: "right"}}><button className="btn danger" onClick={() => del(b._id)} disabled={loading}>{t("budget.actions.delete")}</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
        
        {/* Varible Budget Table */}
        <section className="card col-6">
          <h3>{t("budget.tables.variableTitle")}</h3>
          {variableBudgets.length === 0 ? (
            <p className="muted">{t("budget.tables.noneVariable")}</p>
          ) : (
            <table className="table" style={{width: "100%", tableLayout: "fixed" }}>
              <colgroup><col style={{ width: "50%" }} /><col style={{ width: "50%" }} /><col style={{ width: "20%" }} /></colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>{t("budget.table.category")}</th>
                  <th style={{ textAlign: "center"}}>{t("budget.table.limit")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {variableBudgets.map(b => {
                  return (
                    <tr key={b._id}>
                      <td style={{ textAlign: "left"}}>{b.name}</td>
                      <td style={{ textAlign: "center"}}>{b.limit ? `$${Number(b.limit).toFixed(2)}` : <span className="pill">{t("budget.table.noLimit")}</span>}</td>
                      <td style={{ textAlign: "right"}}><button className="btn danger" onClick={() => del(b._id)} disabled={loading}>{t("budget.actions.delete")}</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="card col-12">
          <h3>{t("budget.income.title")}</h3>
          <p className="muted" style={{ marginBottom:"1rem" }}>{t("budget.income.subtitle")}</p>
          <div className="two-col">
            <IncomeColumn title={t("budget.income.actualTitle")} type="actual" prefix={t("budget.income.paycheck")} />
            <IncomeColumn title={t("budget.income.expectedTitle")} type="expected" prefix={t("budget.income.expectedPaycheck")} />
          </div>
        </section>
      </div>
    </div>
  )
}