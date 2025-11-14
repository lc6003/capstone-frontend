import { useState, useEffect } from "react"
import { fetchExpenses, createExpense, deleteExpense, fetchBudgets, fetchCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from "../lib/api.js"

function calculateRealTimeBalance(card) {
  const balance = Number(card.balance) || 0
  const pending = Number(card.pending) || 0
  const payment = Number(card.payment) || 0
  return balance + pending - payment
}

function CreditCardTracker() {
  const [cards, setCards] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCards()
  }, [])

  async function loadCards() {
    try {
      const data = await fetchCreditCards()
      setCards(data)
    } catch (error) {
      console.error('Failed to load credit cards:', error)
    }
  }

  async function handleAddCard() {
    const newCard = { name: "", balance: 0, pending: 0, payment: 0 }
    try {
      setLoading(true)
      await createCreditCard(newCard)
      await loadCards()
    } catch (error) {
      console.error('Failed to add card:', error)
      alert('Failed to add credit card')
    } finally {
      setLoading(false)
    }
  }

  async function handleChange(id, field, value) {
    const card = cards.find(c => c._id === id)
    if (!card) return

    const updated = { ...card, [field]: value }
    try {
      await updateCreditCard(id, updated)
      setCards(cards.map(c => c._id === id ? updated : c))
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  async function handleDelete(id) {
    try {
      setLoading(true)
      await deleteCreditCard(id)
      await loadCards()
    } catch (error) {
      console.error('Failed to delete card:', error)
      alert('Failed to delete credit card')
    } finally {
      setLoading(false)
    }
  }

  function toggleEdit() { setIsEditing(!isEditing) }

  return (
    <section className="card col-12">
      <h3>Credit Card Tracker</h3>

      {!isEditing && cards.length === 0 && (
        <div className="center" style={{ margin: "1rem 0" }}>
          <p className="muted">No credit card data yet.</p>
          <button className="btn" onClick={toggleEdit}>I want to add a credit card!</button>
        </div>
      )}

      {isEditing && (
        <>
          <table className="table" style={{ marginBottom: "1rem" }}>
            <thead>
              <tr>
                <th>Credit Card Name</th>
                <th>Card Balance</th>
                <th>Pending Charges</th>
                <th>Payment</th>
                <th>Real Time Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card._id}>
                  <td><input className="input" value={card.name} onChange={e => handleChange(card._id, "name", e.target.value)} /></td>
                  <td><input className="input" type="number" value={card.balance} onChange={e => handleChange(card._id, "balance", e.target.value)} /></td>
                  <td><input className="input" type="number" value={card.pending} onChange={e => handleChange(card._id, "pending", e.target.value)} /></td>
                  <td><input className="input" type="number" value={card.payment} onChange={e => handleChange(card._id, "payment", e.target.value)} /></td>
                  <td>${calculateRealTimeBalance(card).toFixed(2)}</td>
                  <td><button className="btn danger" onClick={() => handleDelete(card._id)} disabled={loading}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <button className="btn secondary" onClick={handleAddCard} disabled={loading}>+ Add Credit Card</button>
            <button className="btn" onClick={toggleEdit}>Done</button>
          </div>
        </>
      )}

      {!isEditing && cards.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Credit Card</th>
                <th>Balance</th>
                <th>Pending</th>
                <th>Payment</th>
                <th>Real Time Balance</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card._id}>
                  <td>{card.name}</td>
                  <td>${card.balance}</td>
                  <td>${card.pending}</td>
                  <td>${card.payment}</td>
                  <td>${calculateRealTimeBalance(card).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="btn" onClick={toggleEdit}>Edit</button>
          </div>
        </>
      )}
    </section>
  )
}

export default function Expenses(){
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0,10),
    note: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [expensesData, budgetsData] = await Promise.all([
        fetchExpenses(),
        fetchBudgets()
      ])
      setExpenses(expensesData)
      setBudgets(budgetsData)
      if (budgetsData.length > 0 && !form.category) {
        setForm(f => ({ ...f, category: budgetsData[0].name }))
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  async function submit(e){
    e.preventDefault()
    if(!form.amount) return
    
    try {
      setLoading(true)
      await createExpense({ ...form, amount: Number(form.amount) })
      setForm(f => ({ ...f, amount:"", note:"" }))
      await loadData()
    } catch (error) {
      console.error('Failed to add expense:', error)
      alert('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  async function del(id){
    try {
      setLoading(true)
      await deleteExpense(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  const sortedExpenses = [...expenses].sort((a,b)=> new Date(b.date) - new Date(a.date))

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>Spending</h2>
          <form className="row" onSubmit={submit}>
            <input className="input" type="number" step="0.01" placeholder="Amount"
                   value={form.amount} onChange={e=>setForm({ ...form, amount:e.target.value })}
                   style={{ maxWidth:160 }} disabled={loading} />
            <select className="select" value={form.category} onChange={e=>setForm({ ...form, category:e.target.value })}
                    style={{ maxWidth:220 }} disabled={loading}>
              <option value="">Uncategorized</option>
              {budgets.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
            <input className="input" type="date" value={form.date} onChange={e=>setForm({ ...form, date:e.target.value })}
                   style={{ maxWidth:180 }} disabled={loading} />
            <input className="input" type="text" placeholder="Note" value={form.note}
                   onChange={e=>setForm({ ...form, note:e.target.value })} disabled={loading} />
            <button className="btn" type="submit" disabled={loading}>Add</button>
          </form>
        </section>

        <section className="card col-12">
          <h3>Recent</h3>
          {sortedExpenses.length === 0 ? (
            <p className="muted">No expenses yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th><th></th></tr>
              </thead>
              <tbody>
                {sortedExpenses.map(e => (
                  <tr key={e._id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{e.category || "Uncategorized"}</td>
                    <td>${Number(e.amount).toFixed(2)}</td>
                    <td>{e.note}</td>
                    <td><button className="btn danger" onClick={()=>del(e._id)} disabled={loading}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="sep col-12"></div>

        <CreditCardTracker />
      </div>
    </div>
  )
}