// Chase PDF Parser - Handles Chase bank statement PDFs only
// This parser is specifically designed for Chase statements and should not be used for other banks

// Development-only logging helpers
const isDev = import.meta.env.DEV
const devLog = (...args) => {
  if (isDev) console.log(...args)
}
const devWarn = (...args) => {
  if (isDev) console.warn(...args)
}

/**
 * Detects if the PDF text is from a Chase bank statement
 * @param {string} text - The extracted PDF text
 * @returns {boolean} - True if this appears to be a Chase statement
 */
const isChaseStatement = (text) => {
  if (!text || typeof text !== 'string') {
    return false
  }
  
  const upperText = text.toUpperCase()
  return upperText.includes('CHASE')
}

/**
 * Assigns a category based on transaction description
 * @param {string} description - The transaction description
 * @returns {string} - The assigned category
 */
const assignCategory = (description) => {
  if (!description || typeof description !== 'string') {
    return 'Other'
  }
  const d = description.toLowerCase()

  // Income: deposit, payroll, paycheck, salary
  if (/(deposit|payroll|paycheck|salary)/.test(d)) return 'Income'

  // Food: grocery
  if (/grocery/.test(d)) return 'Food'

  // Bills: rent, bill, electric, utilities, internet
  if (/(rent|bill|electric|utilities|internet)/.test(d)) return 'Bills'

  // Travel: gas, uber, lyft, metro
  if (/(gas|uber|lyft|metro)/.test(d)) return 'Travel'

  // Shopping: shopping, store, gift
  if (/(shopping|store|gift)/.test(d)) return 'Shopping'

  // Entertainment: restaurant, coffee, cafe
  if (/(restaurant|coffee|cafe)/.test(d)) return 'Entertainment'

  // Health: pharmacy, hospital, clinic, health
  if (/(pharmacy|hospital|clinic|health)/.test(d)) return 'Health'

  // Miscellaneous: atm, withdrawal, transfer
  if (/(atm|withdrawal|transfer)/.test(d)) return 'Miscellaneous'

  // Default
  return 'Other'
}

/**
 * Normalizes Chase transaction descriptions for more reliable categorization.
 * - Lowercases text
 * - Removes card numbers (e.g. "card 3208")
 * - Removes embedded dates (MM/DD)
 * - Removes currency noise phrases
 * - Collapses extra whitespace
 *
 * Example:
 *   "Card Purchase 10/27 Mta*Nyct Paygo New York NY Card 3208"
 *   -> "mta*nyct paygo new york ny"
 *
 * @param {string} description - The original transaction description
 * @returns {string} - The normalized description
 */
const normalizeChaseDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return ''
  }

  let d = description.toLowerCase()

  // Remove card numbers like "card 3208"
  d = d.replace(/\bcard\s+\d{4}\b/g, '')

  // Remove embedded dates like "10/27"
  d = d.replace(/\b\d{1,2}\/\d{1,2}\b/g, '')

  // Remove specific currency/FX noise phrases
  d = d.replace(
    /\b(pound\s+sterl|euro|exchg\s+rte|foreign\s+exch\s+rt\s+adj\s+fee)\b/g,
    ''
  )

  // Collapse extra whitespace
  d = d.replace(/\s+/g, ' ').trim()

  return d
}

/**
 * Extracts the year from the statement text (usually found in statement period or date ranges)
 * @param {string} text - The full PDF text
 * @returns {number|null} - The year found, or null if not found
 */
const extractYearFromStatement = (text) => {
  // Look for statement period or date ranges that include the year
  const yearPatterns = [
    /statement\s+period[:\s]+[^\n]*(\d{4})/i,
    /from\s+[^\n]*(\d{4})/i,
    /to\s+[^\n]*(\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/(\d{4}))/,
    /(\d{4})/ // Last resort: find any 4-digit year (likely between 2000-2099)
  ]
  
  for (const pattern of yearPatterns) {
    const match = text.match(pattern)
    if (match) {
      const year = parseInt(match[1] || match[2], 10)
      if (year >= 2000 && year <= 2099) {
        return year
      }
    }
  }
  
  // Default to current year if not found
  const currentYear = new Date().getFullYear()
  devWarn('Could not extract year from Chase statement, using current year:', currentYear)
  return currentYear
}

/**
 * Parses a Chase bank statement PDF text and extracts transactions
 * @param {string} text - The extracted PDF text (should be normalized/cleaned)
 * @returns {Array} - Array of transaction objects with { date, description, amount, category }
 */
export const parseChasePDF = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      devWarn('parseChasePDF: Invalid text input')
      return []
    }

    // Check if this is a Chase statement
    if (!isChaseStatement(text)) {
      devWarn('parseChasePDF: Not a Chase statement (missing CHASE keyword)')
      return []
    }

    devLog('=== Chase PDF Parser: Starting parse ===')

    // Extract year from statement (needed since Chase uses MM/DD format)
    const statementYear = extractYearFromStatement(text)
    devLog('Extracted year from statement:', statementYear)

    // Normalize the text - treat as ONE continuous string
    let normalized = text
    // Replace non-breaking spaces
    normalized = normalized.replace(/\u00A0/g, ' ')
    // Normalize line breaks to spaces (treat as continuous text)
    normalized = normalized.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ')
    // DO NOT collapse whitespace globally - preserve spacing between transactions

    devLog('Text length:', normalized.length)

    /**
     * Parses a transaction block (text between two MM/DD dates)
     * @param {string} block - The transaction block text
     * @param {number} year - The statement year
     * @returns {Object|null} - Transaction object or null if invalid
     */
    function parseTransactionBlock(block, year) {
      if (!block || typeof block !== 'string' || block.trim().length === 0) {
        return null
      }

      // Find the FIRST MM/DD date pattern in the block
      const datePattern = /\b(\d{1,2}\/\d{1,2})\b/
      const dateMatch = block.match(datePattern)
      
      if (!dateMatch) {
        return null // No date found, not a valid transaction block
      }

      const dateStr = dateMatch[1] // MM/DD
      const dateIndex = dateMatch.index
      const dateWithYear = `${dateStr}/${year}`

      // Find all negative amounts in the block (pattern: -\s*\d+\.\d{2})
      const negativeAmountPattern = /-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g
      
      const negativeAmountMatches = []
      let match
      while ((match = negativeAmountPattern.exec(block)) !== null) {
        // Skip if this is part of a date (MM/DD)
        const beforeMatch = block.substring(Math.max(0, match.index - 10), match.index)
        if (/\d{1,2}\/\d{1,2}/.test(beforeMatch)) {
          continue
        }
        
        negativeAmountMatches.push({
          index: match.index,
          value: match[1]
        })
      }

      let amount = null
      let amountIndex = -1

      // Use the LAST negative amount if found (ignore trailing balance)
      if (negativeAmountMatches.length > 0) {
        const lastNegativeAmount = negativeAmountMatches[negativeAmountMatches.length - 1]
        amountIndex = lastNegativeAmount.index
        const numericAmount = parseFloat(lastNegativeAmount.value.replace(/,/g, ''))
        if (!isNaN(numericAmount)) {
          amount = -Math.abs(numericAmount) // Negative (expenses)
        }
      } else {
        // No negative amounts found, look for positive amounts (deposits/Zelle)
        // Find all amounts that appear after the date and don't have a negative sign
        const allAmountPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g
        
        const positiveAmountMatches = []
        while ((match = allAmountPattern.exec(block)) !== null) {
          // Only consider amounts that appear after the date
          if (match.index > dateIndex) {
            // Check if there's a negative sign before this amount
            const beforeAmount = block.substring(Math.max(0, match.index - 5), match.index)
            if (beforeAmount.includes('-')) {
              continue // Skip negative amounts
            }
            
            // Skip if this is part of a date (MM/DD)
            const beforeMatch = block.substring(Math.max(0, match.index - 10), match.index)
            if (/\d{1,2}\/\d{1,2}/.test(beforeMatch)) {
              continue
            }
            
            positiveAmountMatches.push({
              index: match.index,
              value: match[1]
            })
          }
        }
        
        if (positiveAmountMatches.length > 0) {
          // Use the last positive amount (likely the transaction amount, not balance)
          const lastPositiveAmount = positiveAmountMatches[positiveAmountMatches.length - 1]
          amountIndex = lastPositiveAmount.index
          const numericAmount = parseFloat(lastPositiveAmount.value.replace(/,/g, ''))
          if (!isNaN(numericAmount)) {
            amount = Math.abs(numericAmount) // Positive (deposits)
          }
        }
      }

      if (amount === null || isNaN(amount)) {
        return null // No valid amount found
      }

      // Extract description: everything between the date and the amount
      // Start after the date
      const descriptionStart = dateIndex + dateStr.length
      
      // Extract description between date and amount
      let description = block.substring(descriptionStart, amountIndex).trim()
      
      // Clean extra spaces but preserve meaningful spacing
      // Replace multiple spaces/tabs with single space, but preserve single spaces
      description = description.replace(/[ \t]{2,}/g, ' ').trim()

      // Validate transaction
      if (!description || description.length === 0) {
        devWarn('Invalid transaction block (no description):', block.substring(0, 100))
        return null
      }

      const cleanedDescription = normalizeChaseDescription(description)

      return {
        date: dateWithYear,
        description: description,
        amount: amount,
        category: assignCategory(cleanedDescription)
      }
    }

    // Identify transaction boundaries using MM/DD date patterns
    const dateRegex = /\b\d{1,2}\/\d{1,2}\b/g
    
    // Find all date positions in the text
    const datePositions = []
    let dateMatch
    while ((dateMatch = dateRegex.exec(normalized)) !== null) {
      datePositions.push({
        index: dateMatch.index,
        date: dateMatch[0]
      })
    }

    devLog('Found', datePositions.length, 'date patterns in text')

    if (datePositions.length === 0) {
      devWarn('No date patterns found in Chase statement')
      return []
    }

    // Split the text into transaction blocks based on date positions
    // Each block starts at one MM/DD and ends before the next MM/DD
    const transactions = []

    for (let i = 0; i < datePositions.length; i++) {
      const currentDatePos = datePositions[i]
      const nextDatePos = i + 1 < datePositions.length ? datePositions[i + 1] : null

      // Extract the transaction block: from current date to next date (or end of text)
      const blockStart = currentDatePos.index
      const blockEnd = nextDatePos ? nextDatePos.index : normalized.length
      const transactionBlock = normalized.substring(blockStart, blockEnd)

      // Parse the transaction block
      const transaction = parseTransactionBlock(transactionBlock, statementYear)
      if (transaction) {
        transactions.push(transaction)
      }
    }

    // Filter out transactions with invalid amounts
    const validTransactions = transactions.filter(t => 
      t.date && 
      t.description && 
      t.amount !== null && 
      !isNaN(t.amount)
    )

    devLog('=== Chase PDF Parser: Parse complete ===')
    devLog('Total transactions parsed:', validTransactions.length)
    validTransactions.forEach((t, idx) => {
      devLog(`Transaction ${idx + 1}:`, t)
    })

    return validTransactions
  } catch (error) {
    console.error('Error in parseChasePDF:', error)
    devWarn('parseChasePDF error:', error.message)
    return []
  }
}

