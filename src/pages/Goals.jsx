import { useState, useEffect } from "react"
import { fetchGoals, createGoal, updateGoal, contributeToGoal, withdrawFromGoal, deleteGoal } from "../lib/api.js"

const CATEGORIES = [
  { value: 'vacation', label: 'Vacation', icon: '✈️', color: '#3b82f6' },
  { value: 'debt', label: 'Pay Off Debt', icon: '💳', color: '#ef4444' },
  { value: 'emergency', label: 'Emergency Fund', icon: '🚨', color: '#f59e0b' },
  { value: 'purchase', label: 'Big Purchase', icon: '🛍️', color: '#8b5cf6' },
  { value: 'education', label: 'Education', icon: '🎓', color: '#10b981' },
  { value: 'home', label: 'Home', icon: '🏠', color: '#6366f1' },
  { value: 'other', label: 'Other', icon: '🎯', color: '#6b7280' }
]

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    targetAmount: "",
    targetDate: "",
    category: "other"
  })
  const [contributionModal, setContributionModal] = useState(null)
  const [contributionAmount, setContributionAmount] = useState("")

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      setLoading(true)
      const data = await fetchGoals()
      setGoals(data)
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!form.name || !form.targetAmount || !form.targetDate) {
      alert('Please fill in all required fields')
      return
    }

    const categoryData = CATEGORIES.find(c => c.value === form.category)

    try {
      setLoading(true)
      const goalData = {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        icon: categoryData.icon,
        color: categoryData.color
      }

      if (editingGoal) {
        await updateGoal(editingGoal._id, goalData)
      } else {
        await createGoal(goalData)
      }

      setForm({
        name: "",
        description: "",
        targetAmount: "",
        targetDate: "",
        category: "other"
      })
      setShowForm(false)
      setEditingGoal(null)
      await loadGoals()
    } catch (error) {
      console.error('Failed to save goal:', error)
      alert('Failed to save goal')
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(goal) {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      description: goal.description || "",
      targetAmount: goal.targetAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      category: goal.category
    })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this goal?')) return

    try {
      setLoading(true)
      await deleteGoal(id)
      await loadGoals()
    } catch (error) {
      console.error('Failed to delete goal:', error)
      alert('Failed to delete goal')
    } finally {
      setLoading(false)
    }
  }

  async function handleContribution(isWithdrawal = false) {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setLoading(true)
      const amount = parseFloat(contributionAmount)
      
      if (isWithdrawal) {
        await withdrawFromGoal(contributionModal._id, amount)
      } else {
        await contributeToGoal(contributionModal._id, amount)
      }

      setContributionModal(null)
      setContributionAmount("")
      await loadGoals()
    } catch (error) {
      console.error('Failed to process transaction:', error)
      alert(error.message || 'Failed to process transaction')
    } finally {
      setLoading(false)
    }
  }

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Savings Goals</h2>
              <p className="muted">Set and track your financial goals</p>
            </div>
            <button 
              className="btn" 
              onClick={() => {
                setShowForm(true)
                setEditingGoal(null)
                setForm({
                  name: "",
                  description: "",
                  targetAmount: "",
                  targetDate: "",
                  category: "other"
                })
              }}
            >
              + New Goal
            </button>
          </div>
        </section>

        {showForm && (
          <section className="card col-12">
            <h3>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="name" className="label">Goal Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="input"
                  placeholder="e.g., Vacation, Emergency Fund"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="description" className="label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="input"
                  placeholder=""
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="row" style={{ gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="targetAmount" className="label">Target Amount *</label>
                  <input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="1234"
                    value={form.targetAmount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="targetDate" className="label">Target Date *</label>
                  <input
                    id="targetDate"
                    name="targetDate"
                    type="date"
                    className="input"
                    value={form.targetDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="category" className="label">Category *</label>
                <select
                  id="category"
                  name="category"
                  className="select"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row" style={{ gap: "0.5rem" }}>
                <button type="submit" className="btn" disabled={loading}>
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => {
                    setShowForm(false)
                    setEditingGoal(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {activeGoals.length === 0 && !showForm && (
          <section className="card col-12 center">
            <div style={{ padding: "2rem" }}>
              <h3>No active goals yet</h3>
              <p className="muted">Start by creating your first savings goal!</p>
            </div>
          </section>
        )}

        {activeGoals.map(goal => (
          <section key={goal._id} className="card col-6">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  fontSize: "2rem", 
                  width: "50px", 
                  height: "50px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: goal.color + '20',
                  borderRadius: "8px"
                }}>
                  {goal.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{goal.name}</h3>
                  {goal.description && (
                    <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="row" style={{ gap: "0.5rem" }}>
                <button 
                  className="btn secondary" 
                  style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                  onClick={() => handleEdit(goal)}
                >
                  Edit
                </button>
                <button 
                  className="btn danger" 
                  style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                  onClick={() => handleDelete(goal._id)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span className="muted">Progress</span>
                <span style={{ fontWeight: "600", color: goal.color }}>
                  {goal.progress.toFixed(0)}%
                </span>
              </div>
              <div style={{ 
                width: "100%", 
                height: "12px", 
                background: "#e5e7eb", 
                borderRadius: "6px",
                overflow: "hidden"
              }}>
                <div style={{ 
                  width: `${Math.min(100, goal.progress)}%`, 
                  height: "100%", 
                  background: goal.color,
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(2, 1fr)", 
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <div>
                <p className="muted" style={{ fontSize: "0.875rem", margin: "0 0 0.25rem" }}>Current</p>
                <p style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: goal.color }}>
                  ${goal.currentAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="muted" style={{ fontSize: "0.875rem", margin: "0 0 0.25rem" }}>Target</p>
                <p style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>
                  ${goal.targetAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="muted" style={{ fontSize: "0.875rem", margin: "0 0 0.25rem" }}>Remaining</p>
                <p style={{ fontSize: "1.125rem", fontWeight: "600", margin: 0 }}>
                  ${goal.remaining.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="muted" style={{ fontSize: "0.875rem", margin: "0 0 0.25rem" }}>Days Left</p>
                <p style={{ fontSize: "1.125rem", fontWeight: "600", margin: 0 }}>
                  {goal.daysRemaining > 0 ? goal.daysRemaining : 'Overdue'}
                </p>
              </div>
            </div>

            <div className="row" style={{ gap: "0.5rem" }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: goal.color }}
                onClick={() => setContributionModal(goal)}
              >
                Add Money
              </button>
              {goal.currentAmount > 0 && (
                <button 
                  className="btn danger" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setContributionModal(goal)
                  }}
                >
                  Withdraw
                </button>
              )}
            </div>
          </section>
        ))}

        {completedGoals.length > 0 && (
          <>
            <section className="card col-12">
              <h3>🎉 Completed Goals</h3>
            </section>
            {completedGoals.map(goal => (
              <section key={goal._id} className="card col-6" style={{ opacity: 0.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ fontSize: "2rem" }}></div>
                    <div>
                      <h4 style={{ margin: 0 }}>{goal.name}</h4>
                      <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
                        Completed {new Date(goal.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "#10b981" }}>
                      ${goal.targetAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {contributionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setContributionModal(null)}>
          <div 
            className="card" 
            style={{ maxWidth: "400px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Manage Goal: {contributionModal.name}</h3>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label htmlFor="amount" className="label">Amount</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="row" style={{ gap: "0.5rem" }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: contributionModal.color }}
                onClick={() => handleContribution(false)}
                disabled={loading}
              >
                Add Money
              </button>
              {contributionModal.currentAmount > 0 && (
                <button 
                  className="btn danger" 
                  style={{ width: "100%" }}
                  onClick={() => handleContribution(true)}
                  disabled={loading}
                >
                  Withdraw
                </button>
              )}
            </div>
            <button 
              className="btn secondary" 
              style={{ width: "100%", marginTop: "0.5rem" }}
              onClick={() => {
                setContributionModal(null)
                setContributionAmount("")
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}