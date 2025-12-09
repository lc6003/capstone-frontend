import { useState, useEffect } from "react"
import {
  fetchBudgets,
  createBudget,
  deleteBudget,
  fetchIncome,
  createIncome,
  deleteIncome,
  fetchExpenses
} from "../lib/api.js"
import { useTranslation } from "react-i18next"

function IncomeColumn({ title, storageKey, prefix }) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // Map your old storageKey to API "type"
  const type = storageKey && storageKey.includes("expected") ? "expected" : "actual"

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  async function loadEntries() {
    try {
      const data = await fetchIncome(type)
      setEntries(data || [])
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
      alert("Failed to add income")
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
      alert("Failed to delete income")
    } finally {
      setLoading(false)
    }
  }

  const total = entries.reduce((a, b) => a + (b.amount || 0), 0)

  return (
    <div>
      <h4 style={{ marginBottom: "0.5rem" }}>
        {title}:{" "}
        <span style={{ fontWeight: 800, color: "green" }}>
          ${total.toFixed(2)}
        </span>
      </h4>
      {entries.map((entry, i) => (
        <div key={entry._id || i} style={{ marginBottom: "1rem" }}>
          {prefix} {i + 1}: ${entry.amount.toFixed(2)}
        </div>
      ))}
      <form onSubmit={addEntry} style={{ marginTop: "0.5rem" }}>
        <label style={{ marginRight: "0.5rem" }}>
          {prefix} {entries.length + 1}:
        </label>
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder={t("budget.incomeTracker.inputPlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: 120, marginRight: "0.5rem" }}
          disabled={loading}
        />
        <button className="btn" type="submit" disabled={loading}>
          {t("budget.incomeTracker.add")}
        </button>
        <button
          className="btn danger"
          onClick={handleDeleteLast}
          style={{ marginLeft: "0.5rem" }}
          type="button"
          disabled={loading || entries.length === 0}
        >
          {t("budget.incomeTracker.deleteLast")}
        </button>
      </form>
    </div>
  )
}

function spendFor(name, expenses) {
  return expenses
    .filter((e) => (e.category || "") === name)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0)
}

export default function Budget() {
  const { t } = useTranslation()
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
      setBudgets(budgetsData || [])
      setExpenses(expensesData || [])
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name || !form.type) {
      window.alert(t("budget.form.missingFieldsAlert"))
      return
    }

    try {
      setLoading(true)
      await createBudget({
        name: form.name,
        limit: Number(form.limit || 0),
        type: form.type
      })
      setForm({ name: "", limit: "", type: "" })
      await loadData()
    } catch (error) {
      console.error("Failed to create budget:", error)
      alert("Failed to create budget")
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
      console.error("Failed to delete budget:", error)
      alert("Failed to delete budget")
    } finally {
      setLoading(false)
    }
  }

  const recurringBudgets = budgets.filter((b) => b.type === "recurring")
  const variableBudgets = budgets.filter((b) => b.type !== "recurring")

  const recurring = recurringBudgets.reduce(
    (sum, b) => sum + (Number(b.limit) || 0),
    0
  )
  const variable = variableBudgets.reduce(
    (sum, b) => sum + (Number(b.limit) || 0),
    0
  )
  const total = recurring + variable

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>{t("budget.title")}</h2>
          <form
            className="row"
            onSubmit={submit}
            style={{
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "flex-start"
            }}
          >
            <input
              className="input"
              placeholder={t("budget.form.namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", maxWidth: 500 }}
              disabled={loading}
            />
            <div
              className="row"
              style={{ gap: "1rem", flexWrap: "wrap", alignItems: "center" }}
            >
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder={t("budget.form.limitPlaceholder")}
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
                style={{ maxWidth: 220 }}
                disabled={loading}
              />
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <input
                    type="radio"
                    name="budgetType"
                    value="recurring"
                    checked={form.type === "recurring"}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
                    }
                    disabled={loading}
                  />
                  {t("budget.form.typeRecurring")}
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <input
                    type="radio"
                    name="budgetType"
                    value="variable"
                    checked={form.type === "variable"}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
                    }
                    disabled={loading}
                  />
                  {t("budget.form.typeVariable")}
                </label>
              </div>
              <button className="btn" type="submit" disabled={loading}>
                {t("budget.form.submit")}
              </button>
            </div>
          </form>
        </section>

        <section className="card col-12 center">
          <h3>{t("budget.totalBudgetedTitle")}</h3>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>
            ${total.toFixed(2)}
          </div>
        </section>

        <section className="card col-12">
          <div className="two-col">
            <div className="center">
              <h4 style={{ margin: 0 }}>
                {t("budget.summary.recurringTitle")}
              </h4>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#2563eb",
                  marginTop: 4
                }}
              >
                ${recurring.toFixed(2)}
              </div>
            </div>
            <div className="center">
              <h4 style={{ margin: 0 }}>
                {t("budget.summary.variableTitle")}
              </h4>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#f59e0b",
                  marginTop: 4
                }}
              >
                ${variable.toFixed(2)}
              </div>
            </div>
          </div>
        </section>

        <section className="card col-6">
          <h3>{t("budget.recurring.title")}</h3>
          {recurringBudgets.length === 0 ? (
            <p className="muted">{t("budget.recurring.empty")}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("budget.table.category")}</th>
                  <th>{t("budget.table.limit")}</th>
                  <th>{t("budget.table.spent")}</th>
                  <th>{t("budget.table.remaining")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recurringBudgets.map((b) => {
                  const spent = spendFor(b.name, expenses)
                  const remaining = (Number(b.limit) || 0) - spent
                  return (
                    <tr key={b._id}>
                      <td>{b.name}</td>
                      <td>
                        {b.limit ? (
                          `$${Number(b.limit).toFixed(2)}`
                        ) : (
                          <span className="pill">
                            {t("budget.noLimitPill")}
                          </span>
                        )}
                      </td>
                      <td>${spent.toFixed(2)}</td>
                      <td
                        style={{
                          color: remaining < 0 ? "#ef4444" : "#22c55e"
                        }}
                      >
                        {Number.isFinite(remaining)
                          ? `$${remaining.toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn danger"
                          onClick={() => del(b._id)}
                          disabled={loading}
                        >
                          {t("budget.table.delete")}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="card col-6">
          <h3>{t("budget.variable.title")}</h3>
          {variableBudgets.length === 0 ? (
            <p className="muted">{t("budget.variable.empty")}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("budget.table.category")}</th>
                  <th>{t("budget.table.limit")}</th>
                  <th>{t("budget.table.spent")}</th>
                  <th>{t("budget.table.remaining")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {variableBudgets.map((b) => {
                  const spent = spendFor(b.name, expenses)
                  const remaining = (Number(b.limit) || 0) - spent
                  return (
                    <tr key={b._id}>
                      <td>{b.name}</td>
                      <td>
                        {b.limit ? (
                          `$${Number(b.limit).toFixed(2)}`
                        ) : (
                          <span className="pill">
                            {t("budget.noLimitPill")}
                          </span>
                        )}
                      </td>
                      <td>${spent.toFixed(2)}</td>
                      <td
                        style={{
                          color: remaining < 0 ? "#ef4444" : "#22c55e"
                        }}
                      >
                        {Number.isFinite(remaining)
                          ? `$${remaining.toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn danger"
                          onClick={() => del(b._id)}
                          disabled={loading}
                        >
                          {t("budget.table.delete")}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="card col-12">
          <h3>{t("budget.incomeTracker.title")}</h3>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            {t("budget.incomeTracker.subtitle")}
          </p>
          <div className="two-col">
            <IncomeColumn
              title={t("budget.incomeTracker.actualTitle")}
              storageKey="cv_income_actual_v1"
              prefix={t("budget.incomeTracker.prefixPaycheck")}
            />
            <IncomeColumn
              title={t("budget.incomeTracker.expectedTitle")}
              storageKey="cv_income_expected_v1"
              prefix={t("budget.incomeTracker.prefixExpectedPaycheck")}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
