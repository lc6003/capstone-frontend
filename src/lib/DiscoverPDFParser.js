// Discover PDF Parser - Handles Discover credit card statement PDFs only

// Development-only logging helpers
const isDev = import.meta.env.DEV
const devLog = (...args) => {
  if (isDev) console.log(...args)
}
const devWarn = (...args) => {
  if (isDev) console.warn(...args)
}

/**
 * Detects if the PDF text is from a Discover credit card statement.
 * Detection succeeds if the text contains "DISCOVER" and at least one of:
 *  - "PURCHASES"
 *  - "PAYMENTS"
 *  - "PAYMENTS AND CREDITS"
 * @param {string} text - The extracted PDF text
 * @returns {boolean} - True if this appears to be a Discover statement
 */
const isDiscoverStatement = (text) => {
  if (!text || typeof text !== 'string') {
    return false
  }

  const upper = text.toUpperCase()
  if (!upper.includes('DISCOVER')) {
    return false
  }

  return (
    upper.includes('PURCHASES') ||
    upper.includes('PAYMENTS AND CREDITS') ||
    upper.includes('PAYMENTS')
  )
}

/**
 * Maps Discover merchant categories to app-level categories.
 * Uses the Discover-provided category as the primary signal.
 * @param {string} merchantCategory
 * @returns {string}
 */
const mapDiscoverCategoryToApp = (merchantCategory) => {
  if (!merchantCategory || typeof merchantCategory !== 'string') {
    return 'Other'
  }

  const c = merchantCategory.toLowerCase()

  // Food / Restaurants
  if (/(restaurant|dining|fast food|food|bar|cafe|coffee)/.test(c)) return 'Food'
  if (/(grocery|supermarket)/.test(c)) return 'Food'

  // Bills / Utilities
  if (/(utility|utilities|phone|internet|cable|water|electric|gas bill)/.test(c)) return 'Bills'

  // Travel & Transportation
  if (/(travel|airline|hotel|motel|lodging|car rental|transportation|rail|taxi|rideshare|uber|lyft)/.test(c)) return 'Travel'
  if (/(gas station|fuel)/.test(c)) return 'Travel'

  // Shopping / Retail
  if (/(retail|shopping|department store|warehouse club|wholesale|online shopping|general merchandise)/.test(c)) return 'Shopping'

  // Entertainment
  if (/(entertainment|amusement|movie|theater|cinema|streaming|music)/.test(c)) return 'Entertainment'

  // Health
  if (/(health|medical|pharmacy|drug store|hospital|clinic|dental|vision)/.test(c)) return 'Health'

  // Miscellaneous / Other
  if (/(service|professional|fee|charges|other)/.test(c)) return 'Miscellaneous'

  return 'Other'
}

/**
 * Parses a Discover Transactions entry (combined multi-line string)
 * into a transaction object.
 * Expected structure (after joining lines):
 *   MM/DD  DESCRIPTION (possibly multi-line)  DISCOVER CATEGORY  AMOUNT
 *
 * @param {string} rawEntry - Combined text for a single transaction
 * @returns {{date:string, description:string, amount:number, category:string} | null}
 */
const parseDiscoverTransactionLine = (rawEntry) => {
  if (!rawEntry || typeof rawEntry !== 'string') {
    return null
  }

  // Collapse internal newlines and extra spaces
  let line = rawEntry.replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!line) return null

  // Ignore obvious headers
  const headerPatterns = [
    /^trans\s*date/i,
    /^post\s*date/i,
    /^description/i,
    /^merchant\s*category/i,
    /^amount/i,
    /^purchases/i,
    /^payments?/i
  ]
  for (const pattern of headerPatterns) {
    if (pattern.test(line)) {
      return null
    }
  }

  // Find trailing amount (may include $, commas, optional negative, optional CR/DR)
  const amountRegex = /(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(CR|DR)?\s*$/i
  const amountMatch = line.match(amountRegex)
  if (!amountMatch) {
    return null
  }

  let amountStr = amountMatch[1]
  const crDr = amountMatch[2] ? amountMatch[2].toUpperCase() : null

  const prefix = line.slice(0, amountMatch.index).trim()
  if (!prefix) return null

  // Extract date
  const dateMatch = prefix.match(/^(\d{1,2}\/\d{1,2})\s+(.+)$/)
  if (!dateMatch) {
    return null
  }

  const date = dateMatch[1] // MM/DD (year not provided in statement row)
  const rest = dateMatch[2].trim()
  if (!rest) {
    return null
  }

  // Discover merchant categories we explicitly trust.
  // We only treat these (or very similar strings) as categories.
  const explicitCategories = [
    'restaurants',
    'restaurant',
    'merchandise',
    'travel/entertainment',
    'travel & entertainment',
    'travel',
    'entertainment',
    'services',
    'service',
    'gas',
    'gasoline',
    'grocery',
    'groceries',
    'online shopping',
    'shopping',
    'retail'
  ]

  let description = rest
  let merchantCategory = ''

  // Try to find the rightmost explicit Discover category token in the rest-of-line text.
  // We scan from right to left to keep description as large as possible.
  const lowerRest = rest.toLowerCase()
  let bestMatchIndex = -1
  let bestMatchValue = ''

  explicitCategories.forEach((cat) => {
    const idx = lowerRest.lastIndexOf(cat)
    if (idx !== -1 && idx > bestMatchIndex) {
      bestMatchIndex = idx
      bestMatchValue = rest.substr(idx, cat.length)
    }
  })

  if (bestMatchIndex !== -1) {
    description = rest.slice(0, bestMatchIndex).trim()
    merchantCategory = bestMatchValue.trim()
  } else {
    // No explicit Discover category found; keep entire rest as description.
    description = rest.trim()
    merchantCategory = ''
  }

  if (!description) {
    return null
  }

  // Parse amount string into a number
  let sign = 1
  if (amountStr.startsWith('-')) {
    sign = -1
    amountStr = amountStr.slice(1)
  }

  amountStr = amountStr.replace(/\$/g, '').replace(/,/g, '').trim()
  let amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    return null
  }

  // CR (credit) should be negative, DR (debit) positive
  if (crDr === 'CR') {
    sign = -1
  } else if (crDr === 'DR') {
    sign = 1
  }

  amount = sign * amount

  if (!isFinite(amount)) {
    return null
  }

  const category = mapDiscoverCategoryToApp(merchantCategory)

  return {
    date,
    description,
    amount,
    category
  }
}

/**
 * Parses a Discover credit card statement PDF text and extracts transactions.
 * - Splits text into lines
 * - Locates "Transactions" section
 * - Stops when reaching footer sections like "Fees and Interest Charged"
 *
 * @param {string} text - The extracted PDF text
 * @returns {Array<{date:string, description:string, amount:number, category:string}>}
 */
export const parseDiscoverPDF = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      devWarn('parseDiscoverPDF: Invalid text input')
      return []
    }

    if (!isDiscoverStatement(text)) {
      devWarn('parseDiscoverPDF: Not a Discover statement (missing DISCOVER/TRANSACTIONS keywords)')
      return []
    }

    devLog('=== Discover PDF Parser: Starting parse ===')

    // Normalize whitespace for regex-based parsing (no line-based assumptions)
    let normalized = text.replace(/\u00A0/g, ' ')
    normalized = normalized.replace(/\s+/g, ' ').trim()

    if (!normalized) {
      devWarn('parseDiscoverPDF: Normalized text is empty')
      return []
    }

    // Global regex to find Discover-style transactions in a continuous text stream.
    // Pattern:
    //   (MM/DD) (description...) (optional merchant category words) (amount)
    const transactionRegex =
      /(\d{1,2}\/\d{1,2})\s+(.+?)\s+(?:([A-Za-z][A-Za-z\/&\s]+?)\s+)?([+\-]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g

    const transactions = []
    let match
    let matchCount = 0

    while ((match = transactionRegex.exec(normalized)) !== null) {
      matchCount += 1

      const rawDate = match[1]
      let rawDescription = match[2] || ''
      const rawMerchantCategory = (match[3] || '').trim()
      let amountStr = match[4] || ''

      // Clean description: collapse spaces and drop common FX noise like "@", "EUR", "GBP"
      rawDescription = rawDescription
        .replace(/@/g, ' ')
        .replace(/\b(EUR|GBP|USD|EXCHANGE|EXCH|RATE|FOREIGN)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (!rawDescription || !rawDate || !amountStr) {
        continue
      }

      // Amount parsing with sign handling
      let sign = 1
      if (amountStr.startsWith('-')) {
        sign = -1
        amountStr = amountStr.slice(1)
      } else if (amountStr.startsWith('+')) {
        amountStr = amountStr.slice(1)
      }

      // Payments should be negative
      if (/payment/i.test(rawDescription)) {
        sign = -1
      }

      const numericStr = amountStr.replace(/\$/g, '').replace(/,/g, '').trim()
      const numericVal = parseFloat(numericStr)
      if (isNaN(numericVal)) {
        continue
      }
      const amount = sign * numericVal

      if (!isFinite(amount)) {
        continue
      }

      // Category handling
      let category
      if (rawMerchantCategory) {
        category = mapDiscoverCategoryToApp(rawMerchantCategory)
      } else {
        category = 'Uncategorized'
      }

      const tx = {
        date: rawDate,
        description: rawDescription,
        amount,
        category
      }

      if (transactions.length === 0) {
        console.debug('First Discover transaction parsed (regex):', tx)
      }

      transactions.push(tx)
    }

    console.debug('Discover regex matches found:', matchCount)

    devLog('=== Discover PDF Parser: Parse complete ===')
    devLog('Total transactions parsed:', transactions.length)
    transactions.forEach((t, idx) => devLog(`Transaction ${idx + 1}:`, t))

    return transactions
  } catch (error) {
    console.error('Error in parseDiscoverPDF:', error)
    devWarn('parseDiscoverPDF error:', error.message)
    return []
  }
}


