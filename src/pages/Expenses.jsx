import { useMemo, useState } from "react"
import { addExpense, getExpenses, removeExpense, getBudgets, getCreditCards, addCreditCard, removeCreditCard, saveCreditCards, calculateRealTimeBalance, getAllocations, saveAllocation } from "../lib/storage.js"
import { FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function CreditCardTracker() {
  const [cards, setCards] = useState(getCreditCards())
  const [isEditing, setIsEditing] = useState(false)

  function handleAddCard() {
    const newCard = { id: crypto.randomUUID(), name: "", balance: "", pending: "", payment: "" }
    const updated = [...cards, newCard]
    setCards(updated)
    saveCreditCards(updated)
  }
  function handleChange(index, field, value) {
    const updated = [...cards]
    updated[index][field] = value
    setCards(updated)
    saveCreditCards(updated)
  }
  function handleDelete(index) {
    const updated = cards.filter((_, i) => i !== index)
    setCards(updated)
    saveCreditCards(updated)
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
              {cards.map((card, i) => (
                <tr key={card.id}>
                  <td><input className="input" value={card.name} onChange={e => handleChange(i, "name", e.target.value)} /></td>
                  <td><input className="input" type="number" value={card.balance} onChange={e => handleChange(i, "balance", e.target.value)} /></td>
                  <td><input className="input" type="number" value={card.pending} onChange={e => handleChange(i, "pending", e.target.value)} /></td>
                  <td><input className="input" type="number" value={card.payment} onChange={e => handleChange(i, "payment", e.target.value)} /></td>
                  <td>${calculateRealTimeBalance(card).toFixed(2)}</td>
                  <td><button className="btn danger" onClick={() => handleDelete(i)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <button className="btn secondary" onClick={handleAddCard}>+ Add Credit Card</button>
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
                <tr key={card.id}>
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
  const [_, force] = useState(0)
  const navigate = useNavigate();
  const budgets = getBudgets()
  const allocations = getAllocations();
  const [editingCategory, setEditingCategory] = useState(null);
  const [allocationInput, setAllocationInput] = useState("");
  const [form, setForm] = useState({
    amount: "",
    category: budgets[0]?.name || "",
    date: new Date().toISOString().slice(0,10),
    note: ""
  })
  const expenses = useMemo(
    () => getExpenses().sort((a,b)=> new Date(b.date) - new Date(a.date)),
    [_]
  )

  function submit(e){
    e.preventDefault()
    if(!form.amount) return
    addExpense({ ...form, amount: Number(form.amount) })
    setForm(f => ({ ...f, amount:"", note:"" }))
    force(x => x + 1)
  }
  function del(id){
    removeExpense(id)
    force(x => x + 1)
  }

  function startAllocationEdit(category) {
    setEditingCategory(category);
    setAllocationInput(allocations[category] ?? "");
  }

  function saveAllocationEdit() {
    saveAllocation(editingCategory, Number(allocationInput || 0));
    setEditingCategory(null);
    setAllocationInput("");
    force((x) => x + 1);
  }

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>Spending</h2>
          <form className="row" onSubmit={submit}>
            <input className="input" type="number" step="0.01" placeholder="Amount"
                   value={form.amount} onChange={e=>setForm({ ...form, amount:e.target.value })}
                   style={{ maxWidth:160 }} />
            <select className="select" value={form.category} onChange={e=>setForm({ ...form, category:e.target.value })}
                    style={{ maxWidth:220 }}>
              <option value="">Uncategorized</option>
              {budgets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <input className="input" type="date" value={form.date} onChange={e=>setForm({ ...form, date:e.target.value })}
                   style={{ maxWidth:180 }} />
            <input className="input" type="text" placeholder="Note" value={form.note}
                   onChange={e=>setForm({ ...form, note:e.target.value })} />
            <button className="btn" type="submit">Add</button>
          </form>
        </section>

        <section className="card col-12">
          <h3>Recent</h3>
          {expenses.length === 0 ? (
            <p className="muted">No expenses yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Category</th><th>Amount</th><th>Allocated</th><th>Note</th><th></th></tr>
              </thead>

              <tbody>
                {expenses.map(e => {
                  const allocated = allocations[e.category] ?? 0;
                  const isEditing = editingCategory === e.category;
                  return (
                    <tr key={e.id}>
                      <td>{new Date(e.date).toLocaleDateString()}</td>
                      <td>{e.category || "Uncategorized"}</td>
                      <td>${Number(e.amount).toFixed(2)}</td>
                      {/* Allocation column */}
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input type="number" className="input" style={{ width: 90 }} value={allocationInput} onChange={e => setAllocationInput(e.target.value)}/>
                            <button className="btn" onClick={saveAllocationEdit}>Save</button>
                          </div>
                        ) : (
                          <>
                            ${allocated.toFixed(2)}
                            <button className="alloc-edit-btn" title="Edit Allocated" onClick={() => startAllocationEdit(e.category)} style={{ marginLeft: "0.4rem", display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "middle" }}><FiEdit2 size={14}/></button>
                          </>
                        )}
                      </td>
                      <td>{e.note}</td>
                      <td><button className="btn danger" onClick={() => del(e.id)}>Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <CreditCardTracker />

        <section className="card col-12 center">
          <button className="btn" onClick={() => navigate("/cash-stuffing")}>
            Open Cash Stuffing Feature
          </button>
        </section>
      </div>
    </div>
  );
}
