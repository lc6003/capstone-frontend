import {
  fetchBudgets,
  createBudget,
  deleteBudget,
  fetchExpenses,
  createExpense,
  deleteExpense,
  fetchCreditCards,
  createCreditCard,
  updateCreditCard as updateCreditCardAPI,
  deleteCreditCard,
  fetchIncome,
  createIncome,
  deleteIncome
} from './api.js'

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

// Helper to check if user is authenticated (has token)
const isAuthenticated = () => {
  return !!localStorage.getItem('authToken')
}

// Sync version for immediate access (used in useMemo, etc.)
export function getBudgets(){
  return read(KEYS.budgets, [])
}

// Async version that syncs from API first
export async function syncBudgetsFromAPI(){
  if (isAuthenticated()) {
    try {
      const apiBudgets = await fetchBudgets()
      if (apiBudgets && Array.isArray(apiBudgets)) {
        // Sync to localStorage for offline access
        write(KEYS.budgets, apiBudgets)
        return apiBudgets
      }
    } catch (error) {
      console.warn('Failed to fetch budgets from API:', error)
    }
  }
  return getBudgets()
}

export function saveBudgets(budgets){
  write(KEYS.budgets, budgets)
}

export async function addBudget(newBudget){
  const budgetToAdd = { id: crypto.randomUUID(), type: newBudget.type || 'variable', ...newBudget }
  
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      const createdBudget = await createBudget(budgetToAdd)
      // Sync to localStorage
      const budgets = getBudgets()
      const updatedBudgets = [...budgets.filter(b => b.id !== createdBudget.id), createdBudget]
      saveBudgets(updatedBudgets)
      return updatedBudgets
    } catch (error) {
      console.warn('Failed to create budget via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const budgets = read(KEYS.budgets, [])
  budgets.push(budgetToAdd)
  saveBudgets(budgets)
  return budgets
}

export async function removeBudget(id){
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      await deleteBudget(id)
      // Sync to localStorage
      const budgets = read(KEYS.budgets, []).filter(b => b.id !== id)
      saveBudgets(budgets)
      return budgets
    } catch (error) {
      console.warn('Failed to delete budget via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const budgets = read(KEYS.budgets, []).filter(b => b.id !== id)
  saveBudgets(budgets)
  return budgets
}

// Sync version for immediate access (used in useMemo, etc.)
export function getExpenses(){
  return read(KEYS.expenses, [])
}

// Async version that syncs from API first
export async function syncExpensesFromAPI(){
  if (isAuthenticated()) {
    try {
      const apiExpenses = await fetchExpenses()
      if (apiExpenses && Array.isArray(apiExpenses)) {
        // Sync to localStorage for offline access
        write(KEYS.expenses, apiExpenses)
        return apiExpenses
      }
    } catch (error) {
      console.warn('Failed to fetch expenses from API:', error)
    }
  }
  return getExpenses()
}

export function saveExpenses(expenses){
  write(KEYS.expenses, expenses)
}

export async function addExpense(exp){
  const expenseToAdd = { id: crypto.randomUUID(), ...exp }
  
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      const createdExpense = await createExpense(expenseToAdd)
      // Sync to localStorage
      const expenses = getExpenses()
      const updatedExpenses = [...expenses.filter(e => e.id !== createdExpense.id), createdExpense]
      saveExpenses(updatedExpenses)
      return updatedExpenses
    } catch (error) {
      console.warn('Failed to create expense via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const expenses = read(KEYS.expenses, [])
  expenses.push(expenseToAdd)
  saveExpenses(expenses)
  return expenses
}

export async function removeExpense(id){
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      await deleteExpense(id)
      // Sync to localStorage
      const expenses = read(KEYS.expenses, []).filter(e => e.id !== id)
      saveExpenses(expenses)
      return expenses
    } catch (error) {
      console.warn('Failed to delete expense via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const expenses = read(KEYS.expenses, []).filter(e => e.id !== id)
  saveExpenses(expenses)
  return expenses
}

export async function updateExpense(id, updatedData){
  // Note: API doesn't have updateExpense endpoint, so we'll use localStorage
  // If API had update, we'd call it here first
  const expenses = read(KEYS.expenses, [])
  const updatedExpenses = expenses.map(e => 
    e.id === id ? { ...e, ...updatedData } : e
  )
  saveExpenses(updatedExpenses)
  return updatedExpenses
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
// Helper to parse YYYY-MM-DD date strings as local dates (not UTC)
function parseLocalDate(dateString) {
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateString)
}

export function isSameMonth(d1, d2){
  // Use local time methods to ensure consistent comparison
  // Both dates should be in local timezone for accurate month matching
  const date1 = d1 instanceof Date ? d1 : parseLocalDate(d1)
  const date2 = d2 instanceof Date ? d2 : parseLocalDate(d2)
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
}
export function monthInsights(){
  const now = new Date()
  // Filter expenses: exclude Income category and normalize negative amounts
  const expenses = getExpenses().filter(e => {
    // Parse expense date as local date to match with local 'now'
    const ed = parseLocalDate(e.date)
    return isSameMonth(ed, now) && e.category !== 'Income'
  })
  const byCategory = {}
  let sum = 0
  for(const e of expenses){
    // Normalize negative amounts: convert to positive for spending calculations
    const amt = Number(e.amount)||0
    const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
    sum += normalizedAmt
    const k = e.category || 'Uncategorized'
    byCategory[k] = (byCategory[k]||0) + normalizedAmt
  }
  return {sum, byCategory, expenses}
}

export function lastMonthInsights(){
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  // Filter expenses: exclude Income category and normalize negative amounts
  const expenses = getExpenses().filter(e => {
    // Parse expense date as local date to match with local 'lastMonth'
    const ed = parseLocalDate(e.date)
    return isSameMonth(ed, lastMonth) && e.category !== 'Income'
  })
  const byCategory = {}
  let sum = 0
  for(const e of expenses){
    // Normalize negative amounts: convert to positive for spending calculations
    const amt = Number(e.amount)||0
    const normalizedAmt = amt < 0 ? Math.abs(amt) : amt
    sum += normalizedAmt
    const k = e.category || 'Uncategorized'
    byCategory[k] = (byCategory[k]||0) + normalizedAmt
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

// Async version that syncs from API first
export async function syncIncomeFromAPI() {
  if (isAuthenticated()) {
    try {
      const apiIncome = await fetchIncome()
      if (apiIncome && Array.isArray(apiIncome)) {
        // Separate actual and expected income
        const actual = apiIncome.filter(i => i.type === 'actual').map(i => i.amount || 0)
        const expected = apiIncome.filter(i => i.type === 'expected').map(i => i.amount || 0)
        // Sync to localStorage
        write(KEYS.incomeActual, actual)
        write(KEYS.incomeExpected, expected)
        return { actual, expected }
      }
    } catch (error) {
      console.warn('Failed to fetch income from API:', error)
    }
  }
  return {
    actual: JSON.parse(localStorage.getItem(KEYS.incomeActual) || '[]'),
    expected: JSON.parse(localStorage.getItem(KEYS.incomeExpected) || '[]')
  }
}

export function getIncome(type) {
  const key = type === 'expected' ? KEYS.incomeExpected : KEYS.incomeActual
  return JSON.parse(localStorage.getItem(key) || '[]')
}

export async function saveIncome(type, data) {
  // Try API first if authenticated
  if (isAuthenticated() && Array.isArray(data) && data.length > 0) {
    try {
      // Create income entries for API
      const incomeEntries = data.map(amount => ({
        type: type,
        amount: amount
      }))
      // Note: API might need individual create calls or batch endpoint
      // For now, we'll save to localStorage and let sync handle it
    } catch (error) {
      console.warn('Failed to save income via API, using localStorage:', error)
    }
  }
  
  // Save to localStorage
  const key = type === 'expected' ? KEYS.incomeExpected : KEYS.incomeActual
  localStorage.setItem(key, JSON.stringify(data))
}

export async function removeLastIncome(type) {
  const key = type === 'expected' ? KEYS.incomeExpected : KEYS.incomeActual
  const incomes = JSON.parse(localStorage.getItem(key) || '[]')
  if (incomes.length === 0) return incomes
  
  const lastIncome = incomes[incomes.length - 1]
  const updated = incomes.slice(0, -1)
  
  // Try to delete from API if authenticated and we have an ID
  if (isAuthenticated() && lastIncome && lastIncome.id) {
    try {
      await deleteIncome(lastIncome.id)
    } catch (error) {
      console.warn('Failed to delete income via API, using localStorage:', error)
    }
  }
  
  localStorage.setItem(key, JSON.stringify(updated))
  return updated
}

// Credit Card Tracker Helpers
const CARD_KEY = 'cv_credit_cards_v1'

// Sync version for immediate access
export function getCreditCards() {
  return JSON.parse(localStorage.getItem(CARD_KEY) || '[]')
}

// Async version that syncs from API first
export async function syncCreditCardsFromAPI() {
  if (isAuthenticated()) {
    try {
      const apiCards = await fetchCreditCards()
      if (apiCards && Array.isArray(apiCards)) {
        // Sync to localStorage for offline access
        write(CARD_KEY, apiCards)
        return apiCards
      }
    } catch (error) {
      console.warn('Failed to fetch credit cards from API:', error)
    }
  }
  return getCreditCards()
}

export function saveCreditCards(cards) {
  localStorage.setItem(CARD_KEY, JSON.stringify(cards))
}

export async function addCreditCard(newCard) {
  const cardToAdd = { id: crypto.randomUUID(), ...newCard }
  
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      const createdCard = await createCreditCard(cardToAdd)
      // Sync to localStorage
      const cards = getCreditCards()
      const updatedCards = [...cards.filter(c => c.id !== createdCard.id), createdCard]
      saveCreditCards(updatedCards)
      return updatedCards
    } catch (error) {
      console.warn('Failed to create credit card via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const cards = JSON.parse(localStorage.getItem(CARD_KEY) || '[]')
  cards.push(cardToAdd)
  saveCreditCards(cards)
  return cards
}

export async function updateCreditCard(id, updatedCard) {
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      const updated = await updateCreditCardAPI(id, updatedCard)
      // Sync to localStorage
      const cards = getCreditCards()
      const updatedCards = cards.map(c => c.id === id ? updated : c)
      saveCreditCards(updatedCards)
      return updatedCards
    } catch (error) {
      console.warn('Failed to update credit card via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const cards = JSON.parse(localStorage.getItem(CARD_KEY) || '[]')
  const updatedCards = cards.map(c => c.id === id ? { ...c, ...updatedCard } : c)
  saveCreditCards(updatedCards)
  return updatedCards
}

export async function removeCreditCard(id) {
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      await deleteCreditCard(id)
      // Sync to localStorage
      const cards = JSON.parse(localStorage.getItem(CARD_KEY) || '[]').filter(c => c.id !== id)
      saveCreditCards(cards)
      return cards
    } catch (error) {
      console.warn('Failed to delete credit card via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const cards = JSON.parse(localStorage.getItem(CARD_KEY) || '[]').filter(c => c.id !== id)
  saveCreditCards(cards)
  return cards
}

export function calculateRealTimeBalance(card) {
  const { balance = 0, pending = 0, payment = 0, planned = 0 } = card
  return Number(balance) + Number(pending) - Number(payment) - Number(planned)
}

export function getTotalCreditCardDebt() {
  // Get old format cards
  const oldCards = getCreditCards() || []
  const oldDebt = oldCards.reduce((sum, card) => sum + calculateRealTimeBalance(card), 0)
  
  // Get new format cards (userCreditCards)
  const newCards = getUserCreditCards() || []
  const newDebt = newCards.reduce((sum, card) => sum + (Number(card.currentBalance) || 0), 0)
  
  return oldDebt + newDebt
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

// Async version that syncs from API first
export async function syncUserCreditCardsFromAPI() {
  if (isAuthenticated()) {
    try {
      const apiCards = await fetchCreditCards()
      if (apiCards && Array.isArray(apiCards)) {
        // Filter for new format cards (have cardName field) or transform old format
        const newFormatCards = apiCards
          .filter(card => card.cardName) // New format cards
          .map(card => ({
            id: card.id,
            cardName: card.cardName,
            creditLimit: card.creditLimit || card.limit || 0,
            currentBalance: card.currentBalance || card.balance || 0,
            dueDate: card.dueDate || '',
            logo: card.logo || ''
          }))
        saveUserCreditCards(newFormatCards)
        return newFormatCards
      }
    } catch (error) {
      console.warn('Failed to fetch user credit cards from API:', error)
    }
  }
  return getUserCreditCards()
}

export async function addUserCreditCard(newCard) {
  const cardToAdd = { id: crypto.randomUUID(), ...newCard }
  
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      // Transform to API format (API might accept both formats)
      const apiCard = {
        ...cardToAdd,
        name: newCard.cardName, // Some APIs might expect 'name' field
        limit: newCard.creditLimit,
        balance: newCard.currentBalance
      }
      const createdCard = await createCreditCard(apiCard)
      // Sync to localStorage
      const cards = getUserCreditCards()
      // Transform back to new format
      const transformedCard = {
        id: createdCard.id,
        cardName: createdCard.cardName || createdCard.name,
        creditLimit: createdCard.creditLimit || createdCard.limit || 0,
        currentBalance: createdCard.currentBalance || createdCard.balance || 0,
        dueDate: createdCard.dueDate || '',
        logo: createdCard.logo || ''
      }
      const updatedCards = [...cards.filter(c => c.id !== transformedCard.id), transformedCard]
      saveUserCreditCards(updatedCards)
      return updatedCards
    } catch (error) {
      console.warn('Failed to create user credit card via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const cards = getUserCreditCards()
  cards.push(cardToAdd)
  saveUserCreditCards(cards)
  return cards
}

export async function removeUserCreditCard(id) {
  // Try API first if authenticated
  if (isAuthenticated()) {
    try {
      await deleteCreditCard(id)
      // Sync to localStorage
      const cards = getUserCreditCards().filter(c => c.id !== id)
      saveUserCreditCards(cards)
      return cards
    } catch (error) {
      console.warn('Failed to delete user credit card via API, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage only
  const cards = getUserCreditCards().filter(c => c.id !== id)
  saveUserCreditCards(cards)
  return cards
}