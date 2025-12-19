// Citi PDF Parser - Handles Citi bank statement PDFs only
// This parser is specifically designed for Citi statements and should not be used for other banks

// Development-only logging helpers
const isDev = import.meta.env.DEV
const devLog = (...args) => {
  if (isDev) console.log(...args)
}
const devWarn = (...args) => {
  if (isDev) console.warn(...args)
}

/**
 * Detects if the PDF text is from a Citi bank statement
 * @param {string} text - The extracted PDF text
 * @returns {boolean} - True if this appears to be a Citi statement
 */
const isCitiStatement = (text) => {
  if (!text || typeof text !== 'string') {
    return false
  }
  
  const upperText = text.toUpperCase()
  return (
    upperText.includes('CITIBANK') &&
    upperText.includes('CHECKING ACTIVITY') &&
    upperText.includes('REGULAR CHECKING')
  )
}

/**
 * Extracts the year from the statement text
 * Looks for "Statement Period Jun18 - Jul15, 2025" format
 * Falls back to the latest 4-digit year in the header
 * @param {string} text - The full PDF text
 * @returns {number} - The year found, or current year if not found
 */
const extractYearFromStatement = (text) => {
  // Pattern 1: "Statement Period Jun18 - Jul15, 2025" or similar
  const statementPeriodPattern = /statement\s+period[:\s]+[^,]*,\s*(\d{4})/i
  const statementMatch = text.match(statementPeriodPattern)
  if (statementMatch) {
    const year = parseInt(statementMatch[1], 10)
    if (year >= 2000 && year <= 2099) {
      devLog('Extracted year from statement period:', year)
      return year
    }
  }
  
  // Pattern 2: Find all 4-digit years in the text and use the latest one
  const yearPattern = /\b(\d{4})\b/g
  const years = []
  let yearMatch
  while ((yearMatch = yearPattern.exec(text)) !== null) {
    const year = parseInt(yearMatch[1], 10)
    if (year >= 2000 && year <= 2099) {
      years.push(year)
    }
  }
  
  if (years.length > 0) {
    const latestYear = Math.max(...years)
    devLog('Extracted year from header (latest 4-digit year):', latestYear)
    return latestYear
  }
  
  // Default to current year if not found
  const currentYear = new Date().getFullYear()
  devWarn('Could not extract year from Citi statement, using current year:', currentYear)
  return currentYear
}

/**
 * Converts MM/DD date string to ISO date string
 * @param {string} dateStr - Date string in MM/DD format
 * @param {number} year - The year to use
 * @returns {string|null} - ISO date string (YYYY-MM-DD) or null if invalid
 */
const convertToISODate = (dateStr, year) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null
  }
  
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (!match) {
    return null
  }
  
  const month = parseInt(match[1], 10)
  const day = parseInt(match[2], 10)
  
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }
  
  // Create date and validate
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  
  // Format as ISO string (YYYY-MM-DD)
  const monthStr = month.toString().padStart(2, '0')
  const dayStr = day.toString().padStart(2, '0')
  return `${year}-${monthStr}-${dayStr}`
}

/**
 * Parses a Citi bank statement PDF text and extracts transactions
 * @param {string} text - The extracted PDF text
 * @returns {Array<{date:string, description:string, amount:number, type:"debit"|"credit"}>}
 */
export const parseCitiPDF = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      devWarn('parseCitiPDF: Invalid text input')
      return []
    }

    // Check if this is a Citi statement
    if (!isCitiStatement(text)) {
      devWarn('parseCitiPDF: Not a Citi statement (missing CITIBANK/CHECKING ACTIVITY/REGULAR CHECKING keywords)')
      return []
    }

    devLog('=== Citi PDF Parser: Starting parse ===')

    // Extract year from statement (needed since Citi uses MM/DD format)
    const statementYear = extractYearFromStatement(text)
    devLog('Extracted year from statement:', statementYear)

    // Normalize the text - replace non-breaking spaces
    let normalized = text.replace(/\u00A0/g, ' ')
    // Normalize line breaks to spaces (treat as continuous text)
    normalized = normalized.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ')

    devLog('Text length:', normalized.length)

    // Find the "CHECKING ACTIVITY" section
    const upperNormalized = normalized.toUpperCase()
    const checkingActivityIndex = upperNormalized.indexOf('CHECKING ACTIVITY')
    
    if (checkingActivityIndex === -1) {
      devWarn('Could not find CHECKING ACTIVITY section in Citi statement')
      return []
    }

    // Extract text starting from "CHECKING ACTIVITY"
    let transactionText = normalized.substring(checkingActivityIndex)

    // Find "Regular Checking" within the CHECKING ACTIVITY section
    const regularCheckingIndex = transactionText.toUpperCase().indexOf('REGULAR CHECKING')
    
    if (regularCheckingIndex === -1) {
      devWarn('Could not find REGULAR CHECKING section in Citi statement')
      return []
    }

    // Start parsing after "Regular Checking"
    transactionText = transactionText.substring(regularCheckingIndex + 'REGULAR CHECKING'.length).trim()

    // Stop parsing before footer sections
    const stopPatterns = [
      /TOTAL SUBTRACTED\/ADDED/i,
      /THANKYOU POINTS/i,
      /OVERDRAFT AND RETURNED ITEM FEES/i
    ]
    
    let earliestStopIndex = transactionText.length
    for (const pattern of stopPatterns) {
      const match = transactionText.match(pattern)
      if (match) {
        earliestStopIndex = Math.min(earliestStopIndex, match.index)
        devLog('Found stop pattern:', match[0], 'at index', match.index)
      }
    }
    
    // Cut off at the earliest stop pattern
    if (earliestStopIndex < transactionText.length) {
      transactionText = transactionText.substring(0, earliestStopIndex).trim()
      devLog('Stopped parsing at stop pattern, cutoff index:', earliestStopIndex)
    }

    // Find all MM/DD date patterns to identify transaction rows
    const datePattern = /\b(\d{1,2}\/\d{1,2})\b/g
    const datePositions = []
    let dateMatch
    
    // Reset regex lastIndex to ensure we start from the beginning
    datePattern.lastIndex = 0
    while ((dateMatch = datePattern.exec(transactionText)) !== null) {
      // Skip if this is part of a larger date (MM/DD/YYYY) or other context
      const beforeMatch = transactionText.substring(Math.max(0, dateMatch.index - 5), dateMatch.index)
      const afterMatch = transactionText.substring(dateMatch.index + dateMatch[0].length, dateMatch.index + dateMatch[0].length + 5)
      
      // Skip if it looks like part of MM/DD/YYYY
      if (/\d{1,2}\/$/.test(beforeMatch) || /^\/\d{4}/.test(afterMatch)) {
        continue
      }
      
      datePositions.push({
        index: dateMatch.index,
        date: dateMatch[1]
      })
    }

    devLog('Found', datePositions.length, 'date patterns in transaction text')

    if (datePositions.length === 0) {
      devWarn('No date patterns found in Citi statement')
      return []
    }

    const transactions = []

    // Process each transaction block (from one date to the next)
    for (let i = 0; i < datePositions.length; i++) {
      const currentDatePos = datePositions[i]
      const nextDatePos = i + 1 < datePositions.length ? datePositions[i + 1] : null

      // Extract the transaction block: from current date to next date (or end of text)
      const blockStart = currentDatePos.index
      const blockEnd = nextDatePos ? nextDatePos.index : transactionText.length
      const transactionBlock = transactionText.substring(blockStart, blockEnd).trim()

      // Skip if block is empty or too short
      if (!transactionBlock || transactionBlock.length < 5) {
        continue
      }

      // Convert date to ISO format
      const isoDate = convertToISODate(currentDatePos.date, statementYear)
      if (!isoDate) {
        continue
      }

      // Find amounts in the block
      // Look for amounts that appear in "Amount Subtracted" or "Amount Added" columns
      // Pattern: numbers with commas and .XX decimal
      const amountPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
      const amountMatches = []
      let amountMatch
      
      while ((amountMatch = amountPattern.exec(transactionBlock)) !== null) {
        // Skip if this is part of a date
        const beforeAmount = transactionBlock.substring(Math.max(0, amountMatch.index - 10), amountMatch.index)
        if (/\d{1,2}\/\d{1,2}/.test(beforeAmount)) {
          continue
        }
        
        amountMatches.push({
          index: amountMatch.index,
          value: amountMatch[1]
        })
      }

      // Determine which amount to use and whether it's subtracted or added
      // In Citi statements, the structure is: Date | Description | Amount Subtracted | Amount Added | Balance
      // When normalized to a single line, it looks like: "06/15 MERCHANT 100.00 0.00 5000.00"
      // Strategy: Identify amounts by position - typically 3 amounts: [Subtracted, Added, Balance]
      let subtractedAmount = null
      let addedAmount = null
      let subtractedIndex = -1
      let addedIndex = -1

      // Sort amounts by position to identify columns
      const sortedAmounts = [...amountMatches].sort((a, b) => a.index - b.index)
      
      // Identify which amounts are in which columns
      // Pattern: If 3 amounts, order is [Subtracted, Added, Balance]
      //          If 2 amounts, could be [Subtracted, Balance] or [Added, Balance] or [Subtracted, Added]
      //          If 1 amount, it's the transaction amount (need to infer type from context)
      
      if (sortedAmounts.length >= 3) {
        // Three amounts: [Amount Subtracted, Amount Added, Balance]
        // Use first two, skip last (balance)
        const firstAmt = sortedAmounts[0]
        const secondAmt = sortedAmounts[1]
        const firstValue = parseFloat(firstAmt.value.replace(/,/g, ''))
        const secondValue = parseFloat(secondAmt.value.replace(/,/g, ''))
        
        // First amount = Amount Subtracted (if non-zero)
        if (firstValue !== 0) {
          subtractedAmount = firstAmt.value
          subtractedIndex = firstAmt.index
        }
        
        // Second amount = Amount Added (if non-zero)
        if (secondValue !== 0) {
          addedAmount = secondAmt.value
          addedIndex = secondAmt.index
        }
      } else if (sortedAmounts.length === 2) {
        // Two amounts: Could be [Subtracted, Balance] or [Added, Balance] or [Subtracted, Added]
        const firstAmt = sortedAmounts[0]
        const secondAmt = sortedAmounts[1]
        const firstValue = parseFloat(firstAmt.value.replace(/,/g, ''))
        const secondValue = parseFloat(secondAmt.value.replace(/,/g, ''))
        
        // Check if second amount looks like a balance (usually larger, or appears after description)
        // Balance is typically much larger than transaction amounts
        const isSecondLikelyBalance = secondValue > Math.abs(firstValue) * 10 || secondValue > 1000
        
        if (isSecondLikelyBalance) {
          // Pattern: [Transaction Amount, Balance]
          // Assume first is the transaction amount - need to check if it's subtracted or added
          // Default to subtracted (debit) as most transactions are expenses
          if (firstValue !== 0) {
            subtractedAmount = firstAmt.value
            subtractedIndex = firstAmt.index
          }
        } else {
          // Pattern: [Amount Subtracted, Amount Added] (no balance shown, or balance is elsewhere)
          if (firstValue !== 0) {
            subtractedAmount = firstAmt.value
            subtractedIndex = firstAmt.index
          }
          if (secondValue !== 0) {
            addedAmount = secondAmt.value
            addedIndex = secondAmt.index
          }
        }
      } else if (sortedAmounts.length === 1) {
        // Single amount: transaction amount (need to infer if subtracted or added)
        // Default to subtracted (debit) as most transactions are expenses
        const amt = sortedAmounts[0]
        const value = parseFloat(amt.value.replace(/,/g, ''))
        if (value !== 0) {
          subtractedAmount = amt.value
          subtractedIndex = amt.index
        }
      }

      // Determine which amount to use: use subtracted if it exists, otherwise use added
      // Never use both - each transaction has either a subtracted OR added amount, not both
      let transactionAmount = null
      let isSubtracted = false
      let amountIndex = -1

      if (subtractedAmount !== null) {
        // Use subtracted amount (expense/debit)
        transactionAmount = subtractedAmount
        isSubtracted = true
        amountIndex = subtractedIndex
      } else if (addedAmount !== null) {
        // Use added amount (income/credit)
        transactionAmount = addedAmount
        isSubtracted = false
        amountIndex = addedIndex
      } else {
        // No valid transaction amount found, skip this row
        continue
      }

      if (transactionAmount === null) {
        // No valid amount found, skip this transaction
        continue
      }

      // Extract description: everything between the date and the amount
      const dateLength = currentDatePos.date.length
      let description = transactionBlock.substring(dateLength, amountIndex).trim()
      
      // Clean description: remove column headers and common noise
      description = description
        .replace(/\b(AMOUNT SUBTRACTED|AMOUNT ADDED|SUBTRACTED|ADDED|BALANCE)\b/gi, '')
        .replace(/\b(BEGINNING|ENDING|TOTAL|SUBTOTAL|MONTHLY SERVICE FEE|RELATIONSHIP SUMMARY|CLIENT SERVICES|RECONCILIATION)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()

      // Skip if description is empty, too short, or looks like a summary row
      if (!description || description.length < 3) {
        continue
      }

      const descUpper = description.toUpperCase()
      // Skip summary rows, balance rows, and fee summary rows
      if (
        descUpper.includes('BEGINNING BALANCE') ||
        descUpper.includes('ENDING BALANCE') ||
        descUpper.includes('TOTAL SUBTRACTED') ||
        descUpper.includes('TOTAL ADDED') ||
        descUpper.includes('TOTAL SUBTRACTED/ADDED') ||
        descUpper.includes('MONTHLY SERVICE FEE') ||
        descUpper.includes('RELATIONSHIP SUMMARY') ||
        descUpper.includes('CLIENT SERVICES') ||
        descUpper.includes('RECONCILIATION') ||
        descUpper.includes('OVERDRAFT') ||
        descUpper.includes('RETURNED ITEM') ||
        descUpper.includes('RETURNED ITEM FEE') ||
        descUpper.includes('OVERDRAFT FEE') ||
        descUpper === 'TOTAL' ||
        descUpper === 'BALANCE' ||
        descUpper === 'AMOUNT' ||
        descUpper === 'SUBTRACTED' ||
        descUpper === 'ADDED' ||
        /^TOTAL\s+/.test(descUpper) ||
        /^BALANCE\s+/.test(descUpper) ||
        /^OVERDRAFT\s+/.test(descUpper) ||
        /^RETURNED\s+ITEM/.test(descUpper)
      ) {
        continue
      }

      // Parse amount
      const numericAmount = parseFloat(transactionAmount.replace(/,/g, ''))
      if (isNaN(numericAmount) || !isFinite(numericAmount)) {
        continue
      }

      // Normalize amount: Amount Subtracted → negative value (debit), Amount Added → positive value (credit)
      // If Amount Subtracted exists → amount = -value
      // If Amount Added exists → amount = +value
      const amount = isSubtracted ? -Math.abs(numericAmount) : Math.abs(numericAmount)
      const type = amount < 0 ? 'debit' : 'credit'

      const transaction = {
        date: isoDate,
        description: description,
        amount: amount,
        type: type
      }

      transactions.push(transaction)
    }

    // Filter out invalid transactions
    const validTransactions = transactions.filter(t => 
      t.date && 
      t.description && 
      t.amount !== null && 
      !isNaN(t.amount) &&
      isFinite(t.amount) &&
      t.type
    )

    devLog('=== Citi PDF Parser: Parse complete ===')
    devLog('Total transactions parsed:', validTransactions.length)
    validTransactions.forEach((t, idx) => {
      devLog(`Transaction ${idx + 1}:`, t)
    })

    return validTransactions
  } catch (error) {
    console.error('Error in parseCitiPDF:', error)
    devWarn('parseCitiPDF error:', error.message)
    return []
  }
}

