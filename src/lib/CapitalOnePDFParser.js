// Capital One PDF Parser - Handles Capital One bank statement PDFs only

// Development-only logging helpers
const isDev = import.meta.env.DEV
const devLog = (...args) => {
  if (isDev) console.log(...args)
}
const devWarn = (...args) => {
  if (isDev) console.warn(...args)
}

/**
 * Detects if the PDF text is from a Capital One bank statement.
 * Detection succeeds if the text contains "CAPITAL ONE" or "Capital One"
 * @param {string} text - The extracted PDF text
 * @returns {boolean} - True if this appears to be a Capital One statement
 */
const isCapitalOneStatement = (text) => {
  if (!text || typeof text !== 'string') {
    return false
  }

  const upper = text.toUpperCase()
  return upper.includes('CAPITAL ONE')
}

/**
 * Maps month abbreviations to month numbers (1-12)
 * @param {string} monthAbbr - Month abbreviation (e.g., "Aug", "Jan")
 * @returns {number|null} - Month number (1-12) or null if not found
 */
const monthAbbrToNumber = (monthAbbr) => {
  const months = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  }
  return months[monthAbbr.toLowerCase()] || null
}

/**
 * Normalizes a Capital One date string (e.g., "Aug 1", "Aug 14") to MM/DD/YYYY format
 * @param {string} dateStr - Date string like "Aug 1" or "Aug 14"
 * @param {number} year - The statement year
 * @returns {string|null} - Normalized date in MM/DD/YYYY format or null if invalid
 */
const normalizeCapitalOneDate = (dateStr, year) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null
  }

  // Pattern: "Aug 1", "Aug 14", "Aug 31", etc.
  const match = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2})$/)
  if (!match) {
    return null
  }

  const monthAbbr = match[1]
  const day = parseInt(match[2], 10)

  if (isNaN(day) || day < 1 || day > 31) {
    return null
  }

  const month = monthAbbrToNumber(monthAbbr)
  if (!month) {
    return null
  }

  // Format as MM/DD/YYYY
  const monthStr = month.toString().padStart(2, '0')
  const dayStr = day.toString().padStart(2, '0')
  return `${monthStr}/${dayStr}/${year}`
}

/**
 * Extracts the year from the statement text (usually found in statement period or date ranges)
 * @param {string} text - The full PDF text
 * @returns {number} - The year found, or current year if not found
 */
const extractYearFromStatement = (text) => {
  // Look for statement period with date ranges like "Aug 1 - Aug 31, 2024"
  // Pattern 1: Statement period with comma-separated year: "Aug 1 - Aug 31, 2024"
  const statementPeriodPattern = /statement\s+period[:\s]+[^,]*,\s*(\d{4})/i
  const statementMatch = text.match(statementPeriodPattern)
  if (statementMatch) {
    const year = parseInt(statementMatch[1], 10)
    if (year >= 2000 && year <= 2099) {
      devLog('Extracted year from statement period:', year)
      return year
    }
  }

  // Pattern 2: Date range with year at end: "Aug 1, 2024 - Aug 31, 2024" or "Aug 1 - Aug 31, 2024"
  const dateRangePattern = /[A-Za-z]{3}\s+\d{1,2}[,\s]+\d{4}/i
  const dateRangeMatch = text.match(dateRangePattern)
  if (dateRangeMatch) {
    const yearMatch = dateRangeMatch[0].match(/(\d{4})/)
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10)
      if (year >= 2000 && year <= 2099) {
        devLog('Extracted year from date range:', year)
        return year
      }
    }
  }

  // Pattern 3: Standard date format with year: MM/DD/YYYY
  const standardDatePattern = /\b\d{1,2}\/\d{1,2}\/(\d{4})\b/
  const standardDateMatch = text.match(standardDatePattern)
  if (standardDateMatch) {
    const year = parseInt(standardDateMatch[1], 10)
    if (year >= 2000 && year <= 2099) {
      devLog('Extracted year from standard date format:', year)
      return year
    }
  }
  
  // Default to current year if not found
  const currentYear = new Date().getFullYear()
  devWarn('Could not extract year from Capital One statement, using current year:', currentYear)
  return currentYear
}

/**
 * Assigns a category based on transaction description and Capital One category.
 * Uses Capital One category if available, otherwise infers from description.
 * @param {string} capitalOneCategory - The category from Capital One statement
 * @param {string} description - The transaction description
 * @returns {string} - The assigned category
 */
const assignCategory = (capitalOneCategory, description) => {
  // If Capital One provides a category, try to use it
  if (capitalOneCategory && typeof capitalOneCategory === 'string') {
    const cat = capitalOneCategory.toLowerCase()
    
    // Map Capital One categories to app categories
    if (/(restaurant|dining|fast food|food|bar|cafe|coffee)/.test(cat)) return 'Food'
    if (/(grocery|supermarket|grocery store)/.test(cat)) return 'Food'
    if (/(utility|utilities|phone|internet|cable|water|electric|gas bill|rent)/.test(cat)) return 'Bills'
    if (/(travel|airline|hotel|motel|lodging|car rental|transportation|rail|taxi|rideshare|uber|lyft)/.test(cat)) return 'Travel'
    if (/(gas|gas station|fuel)/.test(cat)) return 'Travel'
    if (/(retail|shopping|department store|warehouse club|wholesale|online shopping|general merchandise|store)/.test(cat)) return 'Shopping'
    if (/(entertainment|amusement|movie|theater|cinema|streaming|music)/.test(cat)) return 'Entertainment'
    if (/(health|medical|pharmacy|drug store|hospital|clinic|dental|vision)/.test(cat)) return 'Health'
    if (/(service|professional|fee|charges)/.test(cat)) return 'Miscellaneous'
  }

  // Fallback to description-based categorization
  if (!description || typeof description !== 'string') {
    return 'Other'
  }
  const d = description.toLowerCase()

  // Income: deposit, payroll, paycheck, salary
  if (/(deposit|payroll|paycheck|salary)/.test(d)) return 'Income'

  // Food: grocery, restaurant, dining, fast food, food, bar, cafe, coffee
  if (/(restaurant|dining|fast food|food|bar|cafe|coffee)/.test(d)) return 'Food'
  if (/(grocery|supermarket)/.test(d)) return 'Food'

  // Bills: rent, bill, electric, utilities, internet, phone, cable, water, gas bill
  if (/(rent|bill|electric|utilities|internet|phone|cable|water|gas bill)/.test(d)) return 'Bills'

  // Travel: gas, uber, lyft, metro, travel, airline, hotel, motel, lodging, car rental, transportation, rail, taxi, rideshare, gas station, fuel
  if (/(travel|airline|hotel|motel|lodging|car rental|transportation|rail|taxi|rideshare|uber|lyft)/.test(d)) return 'Travel'
  if (/(gas|gas station|fuel)/.test(d)) return 'Travel'

  // Shopping: shopping, store, gift, retail, department store, warehouse club, wholesale, online shopping, general merchandise
  if (/(shopping|store|gift|retail|department store|warehouse club|wholesale|online shopping|general merchandise)/.test(d)) return 'Shopping'

  // Entertainment: restaurant, coffee, cafe, entertainment, amusement, movie, theater, cinema, streaming, music
  if (/(entertainment|amusement|movie|theater|cinema|streaming|music)/.test(d)) return 'Entertainment'

  // Health: pharmacy, hospital, clinic, health, medical, drug store, dental, vision
  if (/(pharmacy|hospital|clinic|health|medical|drug store|dental|vision)/.test(d)) return 'Health'

  // Miscellaneous: atm, withdrawal, transfer, service, professional, fee, charges
  if (/(atm|withdrawal|transfer|service|professional|fee|charges)/.test(d)) return 'Miscellaneous'

  // Default
  return 'Other'
}

/**
 * Parses a Capital One bank statement PDF text and extracts transactions.
 * Locates the transaction table section starting after the column header row.
 * Parses each transaction row into: date, description, amount, category
 * 
 * @param {string} text - The extracted PDF text
 * @returns {Array<{date:string, description:string, amount:number, category:string}>}
 */
export const parseCapitalOnePDF = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      devWarn('parseCapitalOnePDF: Invalid text input')
      return []
    }

    if (!isCapitalOneStatement(text)) {
      devWarn('parseCapitalOnePDF: Not a Capital One statement (missing CAPITAL ONE keyword)')
      return []
    }

    devLog('=== Capital One PDF Parser: Starting parse ===')

    // Extract year from statement (needed since Capital One uses "Aug 1" format)
    const statementYear = extractYearFromStatement(text)
    devLog('Extracted year from statement:', statementYear)

    // Normalize the text - replace non-breaking spaces and normalize whitespace
    let normalized = text.replace(/\u00A0/g, ' ')
    // Normalize line breaks to spaces (treat as continuous text)
    normalized = normalized.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ')
    // Collapse multiple spaces to single space
    normalized = normalized.replace(/\s+/g, ' ').trim()

    devLog('Text length:', normalized.length)

    // Find the transaction table section
    // Look for column headers: DATE | DESCRIPTION | CATEGORY | AMOUNT | BALANCE
    // The table typically appears after account information on Page 2
    const headerPatterns = [
      /DATE\s+DESCRIPTION\s+CATEGORY\s+AMOUNT\s+BALANCE/i,
      /DATE\s+DESCRIPTION\s+CATEGORY\s+AMOUNT/i,
      /DATE.*?DESCRIPTION.*?CATEGORY.*?AMOUNT/i
    ]

    let tableStartIndex = -1
    for (const pattern of headerPatterns) {
      const match = normalized.match(pattern)
      if (match) {
        // Start parsing after the header row
        tableStartIndex = match.index + match[0].length
        devLog('Found transaction table header at index:', match.index)
        break
      }
    }

    if (tableStartIndex === -1) {
      devWarn('Could not find transaction table header in Capital One statement')
      return []
    }

    // Extract the transaction section (everything after the header)
    let transactionText = normalized.substring(tableStartIndex).trim()

    // Stop parsing at footer sections (but NOT at "Opening Balance" or "Closing Balance" which are valid table rows)
    // Stop ONLY at: Fees Summary and Page footers
    const footerPatterns = [
      /fee\s+summary/i,
      /page\s+\d+\s+of/i,
      /page\s+\d+$/i
    ]

    let earliestFooterIndex = transactionText.length
    for (const pattern of footerPatterns) {
      const match = transactionText.match(pattern)
      if (match) {
        earliestFooterIndex = Math.min(earliestFooterIndex, match.index)
        devLog('Found footer:', match[0], 'at index', match.index)
      }
    }

    // Cut off at the earliest footer if found
    if (earliestFooterIndex < transactionText.length) {
      transactionText = transactionText.substring(0, earliestFooterIndex).trim()
      devLog('Stopped parsing at footer, cutoff index:', earliestFooterIndex)
    }

    // LINE-BASED PARSING: Find all date positions to identify transaction rows
    // Date pattern: "Aug 1", "Aug 14", "Aug 31" (3-letter month + space + 1-2 digit day)
    const datePattern = /\b([A-Za-z]{3}\s+\d{1,2})\b/g
    const datePositions = []
    let dateMatch
    
    // Reset regex lastIndex to ensure we start from the beginning
    datePattern.lastIndex = 0
    while ((dateMatch = datePattern.exec(transactionText)) !== null) {
      datePositions.push({
        index: dateMatch.index,
        dateStr: dateMatch[1]
      })
    }

    devLog('Found', datePositions.length, 'date patterns in transaction text')

    const transactions = []
    let matchCount = 0

    // Process each line starting with a date
    for (let i = 0; i < datePositions.length; i++) {
      const currentDatePos = datePositions[i]
      const nextDatePos = i + 1 < datePositions.length ? datePositions[i + 1] : null

      // Extract the line: from current date to next date (or end of text)
      const lineStart = currentDatePos.index
      const lineEnd = nextDatePos ? nextDatePos.index : transactionText.length
      const line = transactionText.substring(lineStart, lineEnd).trim()

      matchCount += 1

      // Normalize date to MM/DD/YYYY
      const normalizedDate = normalizeCapitalOneDate(currentDatePos.dateStr, statementYear)
      if (!normalizedDate) {
        devWarn('Could not normalize date:', currentDatePos.dateStr)
        continue
      }

      // Skip lines that don't contain a dollar sign (likely headers or broken continuation lines)
      if (!line.includes('$')) {
        continue
      }

      // Find amount in the line
      // Capital One amounts format: - $1,000.00, + $2,652.81, $3,660.83 (sign space $ number)
      // Match amounts with: optional +/- sign and space, then $ sign, then digits with .XX decimal
      // Also match amounts without sign: $ number or just number with .XX decimal
      const amountPattern = /([+\-]\s+\$\d{1,3}(?:,\d{3})*\.\d{2}|\$\d{1,3}(?:,\d{3})*\.\d{2}|\d{1,3}(?:,\d{3})*\.\d{2})/
      const amountMatch = line.match(amountPattern)
      
      if (!amountMatch) {
        // Silently skip if no amount pattern matches (likely malformed or header line)
        continue
      }

      const amountStr = amountMatch[1]
      const amountIndex = amountMatch.index

      // Extract description: everything between date and amount
      // Date is at the start of the line, so skip it
      const dateLength = currentDatePos.dateStr.length
      let description = line.substring(dateLength, amountIndex).trim()
      
      // Clean description: collapse multiple spaces
      description = description.replace(/\s+/g, ' ').trim()

      // Skip balance rows
      const descUpper = description.toUpperCase()
      if (
        descUpper.includes('OPENING BALANCE') ||
        descUpper.includes('CLOSING BALANCE')
      ) {
        continue
      }

      // Skip if description is empty or too short
      if (!description || description.length < 3) {
        continue
      }

      // Parse amount string (handle optional space between sign and $)
      let sign = 1
      let cleanAmountStr = amountStr.trim()
      
      if (cleanAmountStr.startsWith('-')) {
        sign = -1
        // Remove - and any following space
        cleanAmountStr = cleanAmountStr.replace(/^-\s*/, '')
      } else if (cleanAmountStr.startsWith('+')) {
        // Remove + and any following space
        cleanAmountStr = cleanAmountStr.replace(/^\+\s*/, '')
        // For Capital One, + means credit/deposit (positive), - means debit/expense (negative)
        sign = 1
      }

      const numericStr = cleanAmountStr.replace(/\$/g, '').replace(/,/g, '').trim()
      const numericVal = parseFloat(numericStr)
      if (isNaN(numericVal) || !isFinite(numericVal)) {
        devWarn('Invalid amount:', amountStr)
        continue
      }

      // Amount: positive for credits, negative for debits
      const amount = sign * Math.abs(numericVal)

      // Assign category based on description (category column is optional, so we use description)
      const category = assignCategory('', description)

      const tx = {
        date: normalizedDate,
        description: description,
        amount: amount,
        category: category
      }

      transactions.push(tx)
    }

    devLog('=== Capital One PDF Parser: Parse complete ===')
    devLog('Date patterns found (potential rows):', matchCount)
    devLog('Total transactions parsed:', transactions.length)
    transactions.forEach((t, idx) => {
      devLog(`Transaction ${idx + 1}:`, t)
    })

    return transactions
  } catch (error) {
    console.error('Error in parseCapitalOnePDF:', error)
    devWarn('parseCapitalOnePDF error:', error.message)
    return []
  }
}

