import { useMemo, useState } from 'react'
import { addBudget, getBudgets, removeBudget, getExpenses, getBudgetTotalsByType, removeLastIncome } from '../lib/storage.js'

function IncomeColumn({ title, storageKey, prefix }) {
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'))
  const [input, setInput] = useState('')

  function addEntry(e) {
    e.preventDefault()
    const amount = parseFloat(input)
    if (!amount || amount <= 0) return
    const updated = [...entries, amount]
    setEntries(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setInput('')
  }
  function handleDeleteLast() {
    const type = storageKey.includes('expected') ? 'expected' : 'actual'
    const updated = removeLastIncome(type)
    setEntries(updated)
  }

  const total = entries.reduce((a, b) => a + b, 0)

  return (
    <div>
          <h4 style={{ marginBottom: '0.5rem' }}>
            {title}: <span style={{ fontWeight: 800, color: 'green' }}>${total.toFixed(2)}</span>
          </h4>
          {entries.map((amt, i) => (
            <div key={i} style={{ marginBottom: '1rem'}}>
              Paycheck {i + 1}: ${amt.toFixed(2)}
            </div>
          ))}
      <form onSubmit={addEntry} style={{ marginTop: '0.5rem' }}>
        <label style={{ marginRight: '0.5rem' }}>{prefix} {entries.length + 1}:</label>
        <input className="input"type="number" step="0.01" placeholder="$ amount" value={input} onChange={(e) => setInput(e.target.value)} style={{ width: '120px', marginRight: '0.5rem' }} />
        <button className="btn" type="submit">Add</button>
        <button className="btn danger" onClick={handleDeleteLast} style={{ marginLeft: '0.5rem'}}>Delete Last Entry</button>
      </form>      
    </div>
  )
}

function spendFor(name, expenses){
  return expenses.filter(e=> (e.category||'') === name).reduce((s,e)=> s + (Number(e.amount)||0), 0)
}

export default function Budget(){
  const [_, force] = useState(0)
  const [form, setForm] = useState({ name:'', limit:'', type: '' })
  const budgets = useMemo(()=> getBudgets(), [_])
  const { recurring, variable, total } = useMemo(() => getBudgetTotalsByType(), [_])
  const expenses = useMemo(()=> getExpenses(), [_])

  function submit(e){
    e.preventDefault()
    if(!form.name || !form.type){
      window.alert("⚠️ Please write a category name and select either 'Recurring' or 'Variable' before adding a budget.")
      return
    }
    addBudget({ name: form.name, limit: Number(form.limit||0), type: form.type })
    setForm({ name:'', limit:'', type: '' })
    force(x=>x+1)
  }
  function del(id){
    removeBudget(id)
    force(x=>x+1)
  }

  const recurringBudgets = budgets.filter(b => b.type === 'recurring')
  const variableBudgets = budgets.filter(b => b.type !== 'recurring')

  return (
    <div className="grid">
      <section className="card" style={{gridColumn:'span 12'}}>
        <h2>Budgets</h2>
        <form className="row" onSubmit={submit} style={{flexDirection:'column', gap:'0.75rem', alignItems:'flex-start'}}>
          <input className="input" placeholder="Category name (e.g., Groceries)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{width:'100%', maxWidth:'500px'}} />
          <div className="row" style={{gap:'1rem', flexWrap:'wrap', alignItems:'center'}}>
            <input className="input" type="number" step="0.01" placeholder="Monthly limit (optional)" value={form.limit}  onChange={e=>setForm({...form, limit:e.target.value})} style={{maxWidth:220}} />
            <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
              <label style={{display:'flex', alignItems:'center', gap:'0.3rem'}}>
                <input type="radio" name="budgetType" value="recurring" checked={form.type === 'recurring'} onChange={e=>setForm({...form, type:e.target.value})}/>
                Recurring (monthly)
              </label>
              <label style={{display:'flex', alignItems:'center', gap:'0.3rem'}}>
                <input type="radio" name="budgetType" value="variable" checked={form.type === 'variable'}onChange={e=>setForm({...form, type:e.target.value})} />
                Variable
              </label>
            </div>
            <button className="btn" type="submit">Add</button>
          </div>
        </form>
      </section>
       <section className="card" style={{ gridColumn: 'span 12', textAlign: 'center' }}>
        <h3>Total Budgeted</h3>
        <div style={{ fontSize: 36, fontWeight: 800, marginTop: '0.25rem' }}>
          ${total.toFixed(2)}
        </div>
      </section>
      <section className="card" style={{ gridColumn: 'span 12', textAlign: 'center', marginTop: '0rem', paddingTop: '1rem' }}>
        <div style={{display: 'flex',justifyContent: 'space-around',alignItems: 'flex-start',marginTop: '0rem',textAlign: 'center'}}>
          <div>
            <h4 style={{ marginTop: 0.15, marginBottom: '0.15rem'}}>Recurring Expenses</h4>
            <div style={{fontSize: 24,fontWeight: 700, color: '#2563eb', marginTop: '0.15rem'}}>
              ${recurring.toFixed(2)}
            </div>
          </div>
          <div>
            <h4 style={{ marginTop: 0.15, marginBottom: '0.15rem'}}>Variable Expenses</h4>
            <div style={{ fontSize: 24, fontWeight: 700,color: '#f59e0b', marginTop: '0.15rem' }}>
              ${variable.toFixed(2)}
            </div>
          </div>
        </div>
      </section>
      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Recurring Expenses</h3>
        {recurringBudgets.length === 0 ? ( <p className="muted">No recurring budgets yet.</p> ) : (
          <table className="table">
            <thead><tr><th>Category</th><th>Limit</th><th>Spent</th><th>Remaining</th><th></th></tr></thead>
            <tbody>
              {recurringBudgets.map(b => {
                const spent = spendFor(b.name, expenses)
                const remaining = (Number(b.limit)||0) - spent
                return (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.limit? `$${Number(b.limit).toFixed(2)}` : <span className="pill">No limit</span>}</td>
                    <td>${spent.toFixed(2)}</td>
                    <td style={{color: remaining < 0 ? '#ef4444' : '#22c55e'}}>
                      {Number.isFinite(remaining)? `$${remaining.toFixed(2)}` : '—'}
                    </td>
                    <td><button className="btn danger" onClick={()=>del(b.id)}>Delete</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Variable Expenses</h3>
        {variableBudgets.length === 0 ? (
          <p className="muted">No variable budgets yet.</p>) : (
          <table className="table">
            <thead><tr><th>Category</th><th>Limit</th><th>Spent</th><th>Remaining</th><th></th></tr> </thead>
            <tbody>
              {variableBudgets.map(b => {
                const spent = spendFor(b.name, expenses)
                const remaining = (Number(b.limit)||0) - spent
                return (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.limit? `$${Number(b.limit).toFixed(2)}` : <span className="pill">No limit</span>}</td>
                    <td>${spent.toFixed(2)}</td>
                    <td style={{color: remaining < 0 ? '#ef4444' : '#22c55e'}}>
                      {Number.isFinite(remaining)? `$${remaining.toFixed(2)}` : '—'}
                    </td>
                    <td><button className="btn danger" onClick={()=>del(b.id)}>Delete</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
      <hr style={{ gridColumn: 'span 12', border: 'none', borderTop: '2px solid #e5e7eb', margin: '2rem 0' }} />
        <section className="card" style={{ gridColumn: 'span 12' }}>
        <h3>Income Tracker</h3>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Track your actual and expected income below.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          <IncomeColumn title="Actual Income" storageKey="cv_income_actual_v1"  prefix="Paycheck"/>
          <IncomeColumn title="Expected Income" storageKey="cv_income_expected_v1" prefix="Expected Paycheck"/>
        </div>
      </section>
    </div>
  )
}
