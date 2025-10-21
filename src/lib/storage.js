const KEYS = {
  budgets: 'cv_budgets_v1',
  expenses: 'cv_expenses_v1'
}

// Helpers
const read = (k, fallback) => {
  try{ return JSON.parse(localStorage.getItem(k)) ?? fallback }catch{ return fallback }
}
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export function getBudgets(){
  return read(KEYS.budgets, [])
}
export function saveBudgets(budgets){
  write(KEYS.budgets, budgets)
}
export function addBudget(newBudget){
  const budgets = getBudgets()
  budgets.push({ id: crypto.randomUUID(), type:newBudget.type || 'variable', ...newBudget })
  saveBudgets(budgets)
  return budgets
}
export function removeBudget(id){
  const budgets = getBudgets().filter(b => b.id !== id)
  saveBudgets(budgets)
  return budgets
}

export function getExpenses(){
  return read(KEYS.expenses, [])
}
export function saveExpenses(expenses){
  write(KEYS.expenses, expenses)
}
export function addExpense(exp){
  const expenses = getExpenses()
  expenses.push({ id: crypto.randomUUID(), ...exp })
  saveExpenses(expenses)
  return expenses
}
export function removeExpense(id){
  const expenses = getExpenses().filter(e => e.id !== id)
  saveExpenses(expenses)
  return expenses
}

export function totals(){
  const budgets = getBudgets()
  const expenses = getExpenses()
  const byCategory = {}
  let total = 0
  for(const e of expenses){
    const amt = Number(e.amount) || 0
    total += amt
    const key = e.category || 'Uncategorized'
    byCategory[key] = (byCategory[key] || 0) + amt
  }
  const budgetLimits = {}
  for(const b of budgets){
    budgetLimits[b.name] = Number(b.limit) || 0
  }
  return { total, byCategory, budgetLimits, budgets, expenses }
}

// Month helpers
export function isSameMonth(d1, d2){
  return d1.getUTCFullYear()===d2.getUTCFullYear() && d1.getUTCMonth()===d2.getUTCMonth()
}
export function monthInsights(){
  const now = new Date()
  const expenses = getExpenses().filter(e => {
    const ed = new Date(e.date)
    return isSameMonth(ed, now)
  })
  const byCategory = {}
  let sum = 0
  for(const e of expenses){
    const amt = Number(e.amount)||0
    sum += amt
    const k = e.category || 'Uncategorized'
    byCategory[k] = (byCategory[k]||0) + amt
  }
  return {sum, byCategory, expenses}
}
