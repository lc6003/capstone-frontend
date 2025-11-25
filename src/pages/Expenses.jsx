import { useMemo, useState } from "react"
import {
  addExpense,
  getExpenses,
  removeExpense,
  getBudgets,
  getCreditCards,
  addCreditCard,
  removeCreditCard,
  saveCreditCards,
  calculateRealTimeBalance
} from "../lib/storage.js"

import { useTranslation } from "react-i18next"

function CreditCardTracker() {
  const { t } = useTranslation()
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
      <h3>{t("expenses.creditCards.title")}</h3>

      {!isEditing && cards.length === 0 && (
        <div className="center" style={{ margin: "1rem 0" }}>
          <p className="muted">{t("expenses.creditCards.empty")}</p>
        </div>
      )}

      {isEditing && (
        <>
          <table className="table" style={{ marginBottom: "1rem" }}>
            <thead>
              <tr>
                <th>{t("expenses.creditCards.editTable.name")}</th>
                <th>{t("expenses.creditCards.editTable.balance")}</th>
                <th>{t("expenses.creditCards.editTable.pending")}</th>
                <th>{t("expenses.creditCards.editTable.payment")}</th>
                <th>{t("expenses.creditCards.editTable.realTimeBalance")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, i) => (
                <tr key={card.id}>
                  <td>
                    <input
                      className="input"
                      value={card.name}
                      onChange={e => handleChange(i, "name", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      value={card.balance}
                      onChange={e => handleChange(i, "balance", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      value={card.pending}
                      onChange={e => handleChange(i, "pending", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      value={card.payment}
                      onChange={e => handleChange(i, "payment", e.target.value)}
                    />
                  </td>
                  <td>${calculateRealTimeBalance(card).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn danger"
                      onClick={() => handleDelete(i)}
                    >
                      {t("expenses.creditCards.editTable.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem"
            }}
          >
            <button className="btn secondary" onClick={handleAddCard}>
              {t("expenses.creditCards.buttons.addCard")}
            </button>
            <button className="btn" onClick={toggleEdit}>
              {t("expenses.creditCards.buttons.done")}
            </button>
          </div>
        </>
      )}

      {!isEditing && cards.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>{t("expenses.creditCards.viewTable.name")}</th>
                <th>{t("expenses.creditCards.viewTable.balance")}</th>
                <th>{t("expenses.creditCards.viewTable.pending")}</th>
                <th>{t("expenses.creditCards.viewTable.payment")}</th>
                <th>{t("expenses.creditCards.viewTable.realTimeBalance")}</th>
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
            <button className="btn" onClick={toggleEdit}>
              {t("expenses.creditCards.buttons.edit")}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default function Expenses(){
  const { t } = useTranslation()
  const [_, force] = useState(0)
  const budgets = getBudgets()
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

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>{t("expenses.title")}</h2>
          <form className="row" onSubmit={submit}>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder={t("expenses.form.amountPlaceholder")}
              value={form.amount}
              onChange={e=>setForm({ ...form, amount:e.target.value })}
              style={{ maxWidth:160 }} 
            />
            <select
              className="select"
              value={form.category}
              onChange={e=>setForm({ ...form, category:e.target.value })}
              style={{ maxWidth:220 }}
            >
              <option value="">{t("expenses.form.categoryUncategorized")}</option>
              {budgets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e=>setForm({ ...form, date:e.target.value })}
              style={{ maxWidth:180 }}
              aria-label={t("expenses.form.dateLabel")}
            />
            <input
              className="input"
              type="text"
              placeholder={t("expenses.form.notePlaceholder")}
              value={form.note}
              onChange={e=>setForm({ ...form, note:e.target.value })}
            />
            <button className="btn" type="submit">
              {t("expenses.form.submit")}
            </button>
          </form>
        </section>

        <section className="card col-12">
          <h3>{t("expenses.recentTitle")}</h3>
          {expenses.length === 0 ? (
            <p className="muted">{t("expenses.recentEmpty")}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("expenses.table.date")}</th>
                  <th>{t("expenses.table.category")}</th>
                  <th>{t("expenses.table.amount")}</th>
                  <th>{t("expenses.table.note")}</th>
                  <th>{t("expenses.table.delete")}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{e.category || t("expenses.form.categoryUncategorized")}</td>
                    <td>${Number(e.amount).toFixed(2)}</td>
                    <td>{e.note}</td>
                    <td>
                      <button className="btn danger" onClick={()=>del(e.id)}>
                        {t("expenses.table.delete")}
                      </button>
                    </td>
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
