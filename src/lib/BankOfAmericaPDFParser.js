// Bank of America PDF Parser - Handles Bank of America bank statement PDFs only

// Development-only logging helpers
const isDev = import.meta.env.DEV
const devLog = (...args) => {
  if (isDev) console.log(...args)
}
const devWarn = (...args) => {
  if (isDev) console.warn(...args)
}

/**
 * Detects if the PDF text is from a Bank of America statement.
 * Detection succeeds if the text contains at least one of:
 *  - "BANK OF AMERICA"
 *  - "Your checking account"
 *  - "Deposits and other credits"
 *  - "Withdrawals and other debits"
 * @param {string} text - The extracted PDF text
 * @returns {boolean} - True if this appears to be a Bank of America statement
 */
const isBankOfAmericaStatement = (text) => {
  if (!text || typeof text !== 'string') {
    return false
  }

  const upper = text.toUpperCase()
  
  // Check for Bank of America identifier
  if (upper.includes('BANK OF AMERICA')) {
    return true
  }
  
  // Check for characteristic Bank of America statement sections
  if (upper.includes('YOUR CHECKING ACCOUNT')) {
    return true
  }
  
  if (upper.includes('DEPOSITS AND OTHER CREDITS')) {
    return true
  }
  
  if (upper.includes('WITHDRAWALS AND OTHER DEBITS')) {
    return true
  }

  return false
}

/**
 * Assigns a category based on transaction description.
 * Reuses the same categorization system as other parsers.
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
 * Extracts the year from the statement text (usually found in statement period or date ranges)
 * @param {string} text - The full PDF text
 * @returns {number} - The year found, or current year if not found
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
  devWarn('Could not extract year from Bank of America statement, using current year:', currentYear)
  return currentYear
}

/**
 * Parses a Bank of America bank statement PDF text and extracts transactions.
 * - Splits text into lines
 * - Locates transaction sections:
 *   a) "Deposits and other credits"
 *   b) "Withdrawals and other debits"
 * - Stops when reaching footer sections like "Service fees", "Important Information", "Account security", "Page X of Y"
 * - Extracts transactions in format: MM/DD  DESCRIPTION  AMOUNT
 *
 * @param {string} text - The extracted PDF text
 * @returns {Array<{date:string, description:string, amount:number, category:string}>}
 */
export const parseBankOfAmericaPDF = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      devWarn('parseBankOfAmericaPDF: Invalid text input')
      return []
    }

    if (!isBankOfAmericaStatement(text)) {
      devWarn('parseBankOfAmericaPDF: Not a Bank of America statement (missing detection keywords)')
      return []
    }

    devLog('=== Bank of America PDF Parser: Starting parse ===')

    // Extract year from statement (needed since Bank of America uses MM/DD format)
    const statementYear = extractYearFromStatement(text)
    devLog('Extracted year from statement:', statementYear)

    // Normalize the text - replace non-breaking spaces
    let normalized = text.replace(/\u00A0/g, ' ')
    // Normalize line breaks to spaces (treat as continuous text for parsing)
    normalized = normalized.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ')

    devLog('Text length:', normalized.length)

    // Find transaction sections
    const upperNormalized = normalized.toUpperCase()
    
    // Look for "Deposits and other credits" section
    const depositsSectionStart = upperNormalized.indexOf('DEPOSITS AND OTHER CREDITS')
    
    // Look for "Withdrawals and other debits" section
    const withdrawalsSectionStart = upperNormalized.indexOf('WITHDRAWALS AND OTHER DEBITS')
    
    // Determine where to start parsing (earliest section start)
    let parseStartIndex = -1
    if (depositsSectionStart !== -1 && withdrawalsSectionStart !== -1) {
      parseStartIndex = Math.min(depositsSectionStart, withdrawalsSectionStart)
    } else if (depositsSectionStart !== -1) {
      parseStartIndex = depositsSectionStart
    } else if (withdrawalsSectionStart !== -1) {
      parseStartIndex = withdrawalsSectionStart
    }
    
    if (parseStartIndex === -1) {
      devWarn('Could not find transaction sections in Bank of America statement')
      return []
    }

    // Extract the relevant portion starting from transaction sections
    let transactionText = normalized.substring(parseStartIndex)
    
    // Calculate relative positions of sections in transactionText
    const depositsSectionStartInText = depositsSectionStart !== -1 ? depositsSectionStart - parseStartIndex : -1
    const withdrawalsSectionStartInText = withdrawalsSectionStart !== -1 ? withdrawalsSectionStart - parseStartIndex : -1

    // Identify transaction boundaries using date patterns FIRST
    // Support: MM/DD, MM/DD/YY, MM/DD/YYYY
    // Capture MM/DD part and normalize to MM/DD format
    const dateRegex = /\b(\d{1,2}\/\d{1,2})(?:\/(\d{2,4}))?\b/g
    
    // Find all date positions in the text BEFORE cutting off at footers
    // This ensures we capture dates that appear later in the text
    const datePositions = []
    let dateMatch
    // Reset regex lastIndex to ensure we scan from the beginning
    dateRegex.lastIndex = 0
    while ((dateMatch = dateRegex.exec(transactionText)) !== null) {
      // Normalize date to MM/DD format (extract just the MM/DD part)
      const mmddPart = dateMatch[1] // MM/DD part
      datePositions.push({
        index: dateMatch.index,
        date: mmddPart // Store as MM/DD for consistent processing
      })
    }

    // Find the last date position to ensure we include all transaction dates
    const lastDateIndex = datePositions.length > 0 
      ? Math.max(...datePositions.map(d => d.index + d.date.length))
      : -1

    // Stop parsing when footer-like sections appear, but only if they come after all dates
    const footerPatterns = [
      /SERVICE FEES/i,
      /IMPORTANT INFORMATION/i,
      /ACCOUNT SECURITY/i,
      /PAGE \d+ OF \d+/i,
      /PAGE \d+/i
    ]
    
    let footerCutoffIndex = transactionText.length
    for (const pattern of footerPatterns) {
      const footerMatch = transactionText.match(pattern)
      if (footerMatch) {
        const footerIndex = footerMatch.index
        // Only cut off at footer if it comes after all dates (with some buffer)
        // If dates appear after the footer marker, include them
        if (lastDateIndex === -1 || footerIndex > lastDateIndex + 100) {
          footerCutoffIndex = Math.min(footerCutoffIndex, footerIndex)
          devLog('Found footer:', footerMatch[0], 'at index', footerIndex)
        } else {
          devLog('Footer found but dates extend beyond it, including dates:', footerMatch[0])
        }
      }
    }
    
    // Cut off at the earliest footer, but ensure we include all dates
    if (footerCutoffIndex < transactionText.length) {
      // Include buffer after last date to capture any trailing transaction data
      const finalCutoffIndex = lastDateIndex !== -1 
        ? Math.max(footerCutoffIndex, lastDateIndex + 200)
        : footerCutoffIndex
      transactionText = transactionText.substring(0, finalCutoffIndex)
      devLog('Stopped parsing at footer, final cutoff index:', finalCutoffIndex)
    }

    // Re-scan for dates in the final transactionText to get correct positions
    // This ensures date positions are accurate after any cutoff
    datePositions.length = 0 // Clear previous positions
    dateRegex.lastIndex = 0 // Reset regex
    while ((dateMatch = dateRegex.exec(transactionText)) !== null) {
      const mmddPart = dateMatch[1] // MM/DD part
      datePositions.push({
        index: dateMatch.index,
        date: mmddPart // Store as MM/DD for consistent processing
      })
    }

    devLog('Found', datePositions.length, 'date patterns in transaction text')

    if (datePositions.length === 0) {
      devWarn('No date patterns found in Bank of America statement')
      return []
    }

    // Prepare date list for sequential assignment
    // Extract full date strings with year normalization
    const normalizedDates = []
    for (const datePos of datePositions) {
      // Extract the full date string at this position (may be MM/DD, MM/DD/YY, or MM/DD/YYYY)
      const dateMatch = transactionText.substring(datePos.index).match(/^(\d{1,2}\/\d{1,2})(?:\/(\d{2,4}))?/)
      if (dateMatch) {
        const mmddPart = dateMatch[1]
        const yearPart = dateMatch[2]
        
        // Use the year from the date if available, otherwise use statement year
        let transactionYear = statementYear
        if (yearPart) {
          const parsedYear = parseInt(yearPart, 10)
          // Convert 2-digit year to 4-digit year
          if (yearPart.length === 2) {
            // Assume 00-30 is 2000-2030, 31-99 is 1931-1999
            transactionYear = parsedYear <= 30 ? 2000 + parsedYear : 1900 + parsedYear
          } else {
            transactionYear = parsedYear
          }
        }
        
        normalizedDates.push({
          index: datePos.index,
          date: `${mmddPart}/${transactionYear}`
        })
      }
    }

    const transactions = []

    // AMOUNT-DRIVEN APPROACH: Find all monetary amounts and treat each as a transaction candidate
    // Pattern matches amounts with optional +/- sign, commas, and 2 decimal places
    const amountPattern = /([+\-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
    const amountMatches = []
    let match
    while ((match = amountPattern.exec(transactionText)) !== null) {
      // Skip if this is part of a date (MM/DD, MM/DD/YY, or MM/DD/YYYY)
      const beforeMatch = transactionText.substring(Math.max(0, match.index - 15), match.index)
      if (/\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(beforeMatch)) {
        continue
      }
      
      amountMatches.push({
        index: match.index,
        value: match[1],
        fullMatch: match[0]
      })
    }

    devLog('Found', amountMatches.length, 'amount patterns in transaction text')

    // Filter out false-positive amount matches:
    // 1. Repeated balance values (amounts that appear too frequently)
    // 2. Identical consecutive amounts (likely balance repeats)
    const amountFrequency = new Map()
    for (const amountMatch of amountMatches) {
      const normalizedValue = amountMatch.value.replace(/[+\-]/g, '')
      amountFrequency.set(normalizedValue, (amountFrequency.get(normalizedValue) || 0) + 1)
    }

    // Filter amounts: keep only those that appear infrequently (likely transactions, not balances)
    // Also skip consecutive identical amounts
    const filteredAmountMatches = []
    let previousAmountValue = null
    let previousAmountIndex = -1
    
    for (let i = 0; i < amountMatches.length; i++) {
      const amountMatch = amountMatches[i]
      const normalizedValue = amountMatch.value.replace(/[+\-]/g, '')
      const frequency = amountFrequency.get(normalizedValue) || 0
      
      // Skip if this amount appears too frequently (likely a balance value)
      // Threshold: if an amount appears more than 5 times, it's likely a balance
      if (frequency > 5) {
        continue
      }
      
      // Skip if this is identical to the immediately previous amount (consecutive duplicate)
      // Allow small gap (up to 50 chars) to account for formatting
      if (previousAmountValue === normalizedValue && 
          amountMatch.index - previousAmountIndex < 50) {
        continue
      }
      
      filteredAmountMatches.push(amountMatch)
      previousAmountValue = normalizedValue
      previousAmountIndex = amountMatch.index
    }

    devLog('Filtered to', filteredAmountMatches.length, 'amount patterns after removing false positives')

    // Process each amount as a potential transaction
    let dateIndex = 0 // Track which date to assign next
    for (const amountMatch of filteredAmountMatches) {
      const amountIndex = amountMatch.index
      const amountStr = amountMatch.value

      // Extract description: look backwards from the amount to find preceding text
      // Look back up to 300 characters to find the description
      const lookbackStart = Math.max(0, amountIndex - 300)
      const lookbackText = transactionText.substring(lookbackStart, amountIndex)
      
      // Find the start of the description by looking backwards for:
      // 1. Previous amount (if any) - description is between amounts
      // 2. Section headers - description starts after section header
      // 3. Beginning of relevant text block
      let descriptionStart = lookbackStart
      
      // Check if there's a previous amount in the lookback window
      // Look for amount pattern, but exclude if it's part of a date
      const amountPatternLookback = /([+\-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
      let previousAmountPos = -1
      let prevMatch
      while ((prevMatch = amountPatternLookback.exec(lookbackText)) !== null) {
        // Skip if this is part of a date
        const beforePrev = lookbackText.substring(Math.max(0, prevMatch.index - 15), prevMatch.index)
        if (!/\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(beforePrev)) {
          previousAmountPos = lookbackStart + prevMatch.index + prevMatch[0].length
        }
      }
      
      if (previousAmountPos !== -1) {
        // Description is between the previous amount and current amount
        descriptionStart = previousAmountPos
      } else {
        // Check for section headers
        const depositsHeader = lookbackText.toUpperCase().lastIndexOf('DEPOSITS AND OTHER CREDITS')
        const withdrawalsHeader = lookbackText.toUpperCase().lastIndexOf('WITHDRAWALS AND OTHER DEBITS')
        const lastHeader = Math.max(depositsHeader, withdrawalsHeader)
        if (lastHeader !== -1) {
          // Find the end of the header (look for space after header text, approximately 30 chars)
          const afterHeader = lookbackText.substring(lastHeader + 30).trim()
          const headerEnd = lookbackText.length - afterHeader.length
          descriptionStart = lookbackStart + headerEnd
        }
      }
      
      // Extract description text between descriptionStart and amountIndex
      let description = transactionText.substring(descriptionStart, amountIndex).trim()
      
      // Clean up description: remove dates, card numbers, extra spaces
      description = description
        .replace(/\bCARD\s+\d{4}\b/gi, '') // Remove card numbers
        .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '') // Remove embedded dates
        .replace(/\b(DATE|DESCRIPTION|AMOUNT|BALANCE|TOTAL|SUBTOTAL|CONTINUED|PAGE)\b/gi, '') // Remove header words
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim()

      // Skip if description is too short or looks like a header/total
      if (!description || description.length < 3) {
        continue
      }
      
      const descUpper = description.toUpperCase()
      if (
        descUpper.includes('TOTAL') ||
        descUpper.includes('BALANCE') ||
        descUpper.includes('SUBTOTAL') ||
        descUpper.includes('OPENING') ||
        descUpper.includes('CLOSING') ||
        descUpper.includes('BEGINNING') ||
        descUpper.includes('ENDING') ||
        descUpper === 'DATE' ||
        descUpper === 'DESCRIPTION' ||
        descUpper === 'AMOUNT'
      ) {
        continue // Skip balance-only amounts and summary totals
      }

      // Assign date sequentially from the date list
      if (dateIndex >= normalizedDates.length) {
        devWarn('Ran out of dates for transactions, skipping remaining amounts')
        break
      }
      
      const assignedDate = normalizedDates[dateIndex].date
      dateIndex++

      // Parse amount
      let sign = 1
      let cleanAmountStr = amountStr
      
      if (cleanAmountStr.startsWith('-')) {
        sign = -1
        cleanAmountStr = cleanAmountStr.slice(1)
      } else if (cleanAmountStr.startsWith('+')) {
        cleanAmountStr = cleanAmountStr.slice(1)
      }

      // Determine sign based on section:
      // - "Deposits and other credits" section → positive amounts
      // - "Withdrawals and other debits" section → negative amounts
      const isInDepositsSection = depositsSectionStartInText !== -1 && 
                                   amountIndex >= depositsSectionStartInText &&
                                   (withdrawalsSectionStartInText === -1 || amountIndex < withdrawalsSectionStartInText)
      const isInWithdrawalsSection = withdrawalsSectionStartInText !== -1 && 
                                      amountIndex >= withdrawalsSectionStartInText

      if (isInDepositsSection) {
        // Deposits and credits should be positive
        sign = Math.abs(sign) // Ensure positive
      } else if (isInWithdrawalsSection) {
        // Withdrawals and debits should be negative
        sign = -Math.abs(sign) // Ensure negative
      }

      const numericAmount = parseFloat(cleanAmountStr.replace(/,/g, ''))
      if (isNaN(numericAmount) || !isFinite(numericAmount)) {
        continue // Invalid amount
      }

      const amount = sign * Math.abs(numericAmount)
      const category = assignCategory(description)

      transactions.push({
        date: assignedDate,
        description: description,
        amount: amount,
        category: category
      })
    }

    // Filter out invalid transactions
    const validTransactions = transactions.filter(t => 
      t.date && 
      t.description && 
      t.amount !== null && 
      !isNaN(t.amount) &&
      isFinite(t.amount)
    )

    devLog('=== Bank of America PDF Parser: Parse complete ===')
    devLog('Total transactions parsed:', validTransactions.length)
    validTransactions.forEach((t, idx) => {
      devLog(`Transaction ${idx + 1}:`, t)
    })

    return validTransactions
  } catch (error) {
    console.error('Error in parseBankOfAmericaPDF:', error)
    devWarn('parseBankOfAmericaPDF error:', error.message)
    return []
  }
}

