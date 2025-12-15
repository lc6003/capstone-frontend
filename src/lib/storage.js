const KEYS = {
  budgets: 'cv_budgets_v1',
  expenses: 'cv_expenses_v1',
  incomeActual: 'cv_income_actual_v1',
  incomeExpected: 'cv_income_expected_v1',
  uploadHistory: 'cv_upload_history_v1'
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
export function updateExpense(id, updatedData){
  const expenses = getExpenses().map(e => 
    e.id === id ? { ...e, ...updatedData } : e
  )
  saveExpenses(expenses)
  return expenses
}

// Upload history functions
export function getUploadHistory(){
  return read(KEYS.uploadHistory, [])
}

export function addUploadHistoryEntry(fileType, importedCount){
  const history = getUploadHistory()
  const entry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    fileType: fileType, // "CSV" | "PDF" | "IMAGE"
    importedCount: importedCount
  }
  history.push(entry)
  write(KEYS.uploadHistory, history)
  return history
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

export function getBudgetTotalsByType() {
  const budgets = getBudgets()
  let recurring = 0, variable = 0, total = 0
  for (const b of budgets) {
    const amt = Number(b.limit) || 0
    if (!Number.isFinite(amt) || amt <= 0) continue 
    if (b.type === 'recurring') recurring += amt
    else variable += amt
    total += amt
  }
  return { recurring, variable, total }
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

//Income helpers
export function getIncomeTotals() {
  const actual = JSON.parse(localStorage.getItem(KEYS.incomeActual) || '[]')
  const expected = JSON.parse(localStorage.getItem(KEYS.incomeExpected) || '[]')

  return {
    actual: actual.reduce((a, b) => a + b, 0),
    expected: expected.reduce((a, b) => a + b, 0)
  }
}

export function getIncome(type) {
  const key = type === 'expected' ? KEYS.incomeExpected : KEYS.incomeActual
  return JSON.parse(localStorage.getItem(key) || '[]')
}

export function saveIncome(type, data) {
  const key = type === 'expected' ? KEYS.incomeExpected : KEYS.incomeActual
  localStorage.setItem(key, JSON.stringify(data))
}

export function removeLastIncome(type) {
  const key = type === 'expected' ? KEYS.incomeExpected : KEYS.incomeActual
  const incomes = JSON.parse(localStorage.getItem(key) || '[]')
  const updated = incomes.slice(0, -1)
  localStorage.setItem(key, JSON.stringify(updated))
  return updated
}

// Credit Card Tracker Helpers
const CARD_KEY = 'cv_credit_cards_v1'

export function getCreditCards() {
  return JSON.parse(localStorage.getItem(CARD_KEY) || '[]')
}

export function saveCreditCards(cards) {
  localStorage.setItem(CARD_KEY, JSON.stringify(cards))
}

export function addCreditCard(newCard) {
  const cards = getCreditCards()
  cards.push({ id: crypto.randomUUID(), ...newCard })
  saveCreditCards(cards)
  return cards
}

export function updateCreditCard(id, updatedCard) {
  const cards = getCreditCards().map(c =>
    c.id === id ? { ...c, ...updatedCard } : c
  )
  saveCreditCards(cards)
  return cards
}

export function removeCreditCard(id) {
  const cards = getCreditCards().filter(c => c.id !== id)
  saveCreditCards(cards)
  return cards
}

export function calculateRealTimeBalance(card) {
  const { balance = 0, pending = 0, payment = 0, planned = 0 } = card
  return Number(balance) + Number(pending) - Number(payment) - Number(planned)
}

export function getTotalCreditCardDebt() {
  const cards = getCreditCards() || []
  return cards.reduce((sum, card) => sum + calculateRealTimeBalance(card), 0)
}

// New Credit Card Tracker Helpers (userCreditCards)
const USER_CARD_KEY = 'userCreditCards'

export function getUserCreditCards() {
  try {
    return JSON.parse(localStorage.getItem(USER_CARD_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveUserCreditCards(cards) {
  localStorage.setItem(USER_CARD_KEY, JSON.stringify(cards))
}

export function addUserCreditCard(newCard) {
  const cards = getUserCreditCards()
  cards.push({ id: crypto.randomUUID(), ...newCard })
  saveUserCreditCards(cards)
  return cards
}

export function removeUserCreditCard(id) {
  const cards = getUserCreditCards().filter(c => c.id !== id)
  saveUserCreditCards(cards)
  return cards
}