import { useMemo, useState } from 'react'
import { addBudget, getBudgets, removeBudget, getExpenses } from '../lib/storage.js'

function spendFor(name, expenses){
  return expenses.filter(e=> (e.category||'') === name).reduce((s,e)=> s + (Number(e.amount)||0), 0)
}

export default function Budget(){
  const [_, force] = useState(0)
  const [form, setForm] = useState({ name:'', limit:'' })
  const budgets = useMemo(()=> getBudgets(), [_])
  const expenses = useMemo(()=> getExpenses(), [_])

  function submit(e){
    e.preventDefault()
    if(!form.name) return
    addBudget({ name: form.name, limit: Number(form.limit||0) })
    setForm({ name:'', limit:'' })
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
          
      <section className="card" style={{gridColumn:'span 6'}}>
        <h3>Recurring</h3>
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
        <h3>Variable</h3>
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
    </div>
  )
}
