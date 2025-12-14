// Generate duplicate ID from date + description + amount
export const generateDuplicateId = (transaction) => {
  const date = (transaction.date || '').toString().trim().toLowerCase()
  const description = (transaction.description || '').toString().trim().toLowerCase()
  const amount = transaction.amount !== null ? transaction.amount.toString() : '0'
  return `${date}|${description}|${amount}`
}

// Convert transaction date to YYYY-MM-DD format
export const normalizeTransactionDate = (dateStr) => {
  if (!dateStr || !dateStr.toString().trim()) {
    return new Date().toISOString().slice(0, 10)
  }
  
  const date = dateStr.toString().trim()
  
  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }
  
  // Try to parse the date and format it as YYYY-MM-DD
  const parsedDate = new Date(date)
  if (!isNaN(parsedDate.getTime())) {
    // Get local date in YYYY-MM-DD format
    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // If parsing fails, use today's date
  return new Date().toISOString().slice(0, 10)
}

// Convert transaction to expense format
export const transactionToExpense = (transaction) => {
  return {
    amount: transaction.amount !== null && transaction.amount !== undefined 
      ? Math.abs(transaction.amount) 
      : 0,
    category: transaction.category || 'Other',
    date: normalizeTransactionDate(transaction.date),
    note: transaction.description || ''
  }
}

