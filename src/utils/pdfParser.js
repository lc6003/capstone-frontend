import * as pdfjsLib from "pdfjs-dist"
import { devLog, devWarn } from "./devLog.js"
import { configurePDFWorker } from "./pdfWorker.js"

// Timeout utility function
export const withTimeout = (promise, timeoutMs, errorMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

// Extract text from PDF using PDF.js with timeout protection
export const extractTextFromPDF = async (arrayBuffer) => {
  const PDF_PROCESSING_TIMEOUT = 15000 // 15 seconds timeout
  
  try {
    // Validate arrayBuffer
    if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error('Invalid PDF file: ArrayBuffer is required')
    }

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Invalid PDF file: File is empty')
    }

    // Ensure PDF.js is available
    if (!pdfjsLib || typeof pdfjsLib.getDocument !== 'function') {
      throw new Error('PDF.js library is not available')
    }

    // Ensure PDF.js worker is configured (should already be configured at top level)
    if (!pdfjsLib.GlobalWorkerOptions || !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      devWarn('PDF.js worker not configured, reconfiguring...')
      configurePDFWorker()
      
      if (!pdfjsLib.GlobalWorkerOptions || !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        throw new Error('Failed to configure PDF.js worker. Please refresh the page and try again.')
      }
    }

    // Wrap PDF loading with timeout and error handling
    let loadingTask
    try {
      loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        // Add options to prevent hanging
        verbosity: 0, // Reduce logging
        stopAtErrors: false, // Continue even if there are errors
        maxImageSize: 1024 * 1024, // Limit image size to prevent memory issues
      })
    } catch (taskError) {
      console.error('Failed to create PDF loading task:', taskError)
      throw new Error('Failed to initialize PDF processing. The file may be corrupted.')
    }

    // Apply timeout to PDF loading
    let pdf
    try {
      if (!loadingTask || !loadingTask.promise) {
        throw new Error('PDF loading task is invalid')
      }
      pdf = await withTimeout(
        loadingTask.promise,
        PDF_PROCESSING_TIMEOUT,
        'PDF loading timed out after 15 seconds'
      )
    } catch (loadError) {
      console.error('PDF loading failed:', loadError)
      // Cancel the loading task if possible
      if (loadingTask && loadingTask.destroy) {
        try {
          loadingTask.destroy()
        } catch (destroyError) {
          devWarn('Failed to destroy PDF loading task:', destroyError)
        }
      }
      throw new Error(loadError.message || 'Failed to load PDF document')
    }

    if (!pdf || !pdf.numPages) {
      throw new Error('Invalid PDF: Could not read PDF structure')
    }

    let fullText = ''
    const maxPages = 50 // Safety limit to prevent infinite loops
    const pagesToProcess = Math.min(pdf.numPages || 1, maxPages)

    // Validate page count
    if (!pdf.numPages || pdf.numPages === 0) {
      throw new Error('PDF has no pages')
    }

    // Extract text from each page with timeout protection
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        // Safety check to prevent infinite loops
        if (pageNum > maxPages) {
          devWarn(`Reached maximum page limit (${maxPages}), stopping extraction`)
          break
        }

        // Apply timeout to each page extraction
        let page
        try {
          page = await withTimeout(
            pdf.getPage(pageNum),
            5000, // 5 seconds per page
            `Page ${pageNum} extraction timed out`
          )
        } catch (pageGetError) {
          devWarn(`Failed to get page ${pageNum}:`, pageGetError.message)
          continue // Skip this page
        }

        if (!page) {
          devWarn(`Page ${pageNum} is null or undefined`)
          continue
        }

        let textContent
        try {
          textContent = await withTimeout(
            page.getTextContent(),
            5000, // 5 seconds per page text extraction
            `Page ${pageNum} text extraction timed out`
          )
        } catch (textError) {
          devWarn(`Failed to extract text from page ${pageNum}:`, textError.message)
          continue // Skip this page
        }
        
        // Combine text items from the page (with safety check)
        if (textContent && textContent.items && Array.isArray(textContent.items)) {
          try {
            const pageText = textContent.items
              .map(item => {
                try {
                  return (item && item.str) ? String(item.str) : ''
                } catch (itemError) {
                  return ''
                }
              })
              .filter(str => str && str.length > 0)
              .join(' ')
        
            if (pageText && pageText.trim().length > 0) {
              fullText += pageText + '\n'
            }
          } catch (textProcessError) {
            devWarn(`Error processing text from page ${pageNum}:`, textProcessError.message)
          }
        } else {
          devWarn(`Page ${pageNum} has no text content`)
        }
        
      } catch (pageError) {
        devWarn(`Error processing page ${pageNum}:`, pageError.message)
        // Continue with next page instead of failing completely
        // Don't add error message to text to keep it clean
      }
    }

    if (pdf.numPages > maxPages) {
      // Note: PDF has more pages than maxPages, only processed first maxPages
    }

    const result = fullText.trim()
    
    if (!result || result.length === 0) {
      throw new Error('PDF extraction completed but no text was found. The PDF may be image-based or corrupted.')
    }

    // DIAGNOSTIC: Log raw extracted PDF text
    devLog('=== PDF DIAGNOSTIC: Raw Extracted Text ===')
    devLog('Length:', result.length, 'characters')
    devLog('First 2000 characters:', result.substring(0, 2000))
    devLog('Full text:', result)
    devLog('=== End Raw Text ===')

    return result
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    // Provide more specific error messages
    if (error.message.includes('timeout')) {
      throw new Error('PDF processing timed out. The file may be too large or corrupted. Please try a smaller file.')
    } else if (error.message.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file. Please ensure the file is a valid PDF document.')
    } else if (error.message.includes('password')) {
      throw new Error('This PDF is password-protected. Please remove the password and try again.')
    } else {
      throw new Error(`Failed to process PDF: ${error.message}`)
    }
  }
}

// Normalize PDF text before parsing - removes headers, footers, and non-transaction lines
export const normalizePDFText = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  let normalized = text

  // Replace non-breaking spaces with regular spaces
  normalized = normalized.replace(/\u00A0/g, ' ')

  // Remove tab characters
  normalized = normalized.replace(/\t/g, ' ')

  // Normalize line breaks - handle various line break formats
  normalized = normalized.replace(/\r\n/g, '\n') // Windows
  normalized = normalized.replace(/\r/g, '\n') // Old Mac

  // Replace multiple spaces with single space (but preserve line structure first)
  normalized = normalized.replace(/[ \t]+/g, ' ')

  // Split into lines for processing
  const lines = normalized.split('\n').map(line => line.trim()).filter(line => line.length > 0)

  // Comprehensive header/footer patterns to remove
  const headerFooterPatterns = [
    /^statement period/i,
    /^statement date/i,
    /^opening balance/i,
    /^closing balance/i,
    /^beginning balance/i,
    /^ending balance/i,
    /^account number/i,
    /^account holder/i,
    /^account name/i,
    /^page \d+$/i,
    /^total/i,
    /^subtotal/i,
    /^balance/i,
    /^summary/i,
    /^statement summary/i,
    /^date\s+description\s+amount/i,
    /^transaction.*date/i,
    /^posted.*date/i,
    /^\d+\s+of\s+\d+$/i, // Page numbers like "1 of 5"
    /^page\s+\d+/i,
    /^previous balance/i,
    /^new balance/i,
    /^available balance/i,
    /^credit limit/i,
    /^minimum payment/i,
    /^payment due/i,
    /^statement ending/i,
    /^statement beginning/i,
    /^period/i,
    /^from.*to/i, // Date ranges like "From 01/01/2024 to 01/31/2024"
  ]

  const cleanedLines = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Skip empty lines
    if (!line || line.length < 3) {
      continue
    }
    
    // Skip header/footer patterns
    let isHeaderFooter = false
    for (const pattern of headerFooterPatterns) {
      if (pattern.test(line)) {
        isHeaderFooter = true
        break
      }
    }
    
    // Skip lines that are clearly not transactions (e.g., account numbers, statement info)
    if (!isHeaderFooter) {
      // Skip lines that look like account numbers (long strings of numbers)
      if (/^\d{10,}$/.test(line.replace(/[\s-]/g, ''))) {
        continue
      }
      
      // Skip lines that are just summary information
      if (/^(total|balance|summary|subtotal|opening|closing|beginning|ending)/i.test(line)) {
        continue
      }
      
      cleanedLines.push(line)
    }
  }

  // Join wrapped lines - if a line doesn't start with a date pattern, attach to previous
  // BUT only if it looks like a continuation (not a header/footer/summary)
  const datePattern = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|[A-Za-z]{3}\s+\d{1,2}|[A-Za-z]+\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/
  const headerFooterKeywords = ['balance', 'total', 'summary', 'statement', 'account', 'page', 'period', 'opening', 'closing', 'beginning', 'ending', 'previous', 'new', 'available', 'credit', 'minimum', 'payment', 'due']
  const mergedLines = []
  
  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i]
    
    // Check if line starts with a date
    if (datePattern.test(line)) {
      mergedLines.push(line)
    } else if (mergedLines.length > 0) {
      // Only merge if it doesn't look like a header/footer/summary line
      const lineLower = line.toLowerCase()
      const isHeaderFooter = headerFooterKeywords.some(keyword => lineLower.includes(keyword)) || 
                             /^\d{10,}$/.test(line.replace(/[\s-]/g, '')) || // Account numbers
                             /^(total|balance|summary|subtotal)/i.test(line) // Summary patterns
      
      if (!isHeaderFooter && line.length > 0) {
        // Attach to previous line with a space (likely continuation of description)
        mergedLines[mergedLines.length - 1] += ' ' + line
      }
      // If it is a header/footer, skip it (don't merge, don't add as new line)
    } else {
      // Line doesn't start with date and no previous line - skip it (not a transaction)
      continue
    }
  }

  // Join back into text
  normalized = mergedLines.join('\n')

  // Final cleanup: remove multiple spaces (but preserve line breaks)
  normalized = normalized.replace(/[ ]{2,}/g, ' ')

  const finalNormalized = normalized.trim()
  
  // DIAGNOSTIC: Log cleaned text after filtering headers/footers
  devLog('=== PDF DIAGNOSTIC: Cleaned Text (After Header/Footer Removal) ===')
  devLog('Length:', finalNormalized.length, 'characters')
  devLog('Number of lines:', finalNormalized.split('\n').length)
  devLog('First 2000 characters:', finalNormalized.substring(0, 2000))
  devLog('All cleaned lines:')
  finalNormalized.split('\n').forEach((line, idx) => {
    devLog(`Line ${idx + 1}:`, line)
  })
  devLog('=== End Cleaned Text ===')

  // Return normalized text, or empty string if no valid lines found
  return finalNormalized
}

// Parse PDF text to extract transactions
export const parsePDFTransactions = (pdfText) => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      return []
    }

    // Use the raw PDF text and split by date pattern MM/DD/YYYY
    // This matches the sample format:
    // "12/02/2024 Direct Deposit – Payroll +$2,150.00 $6,000.00"
    const text = pdfText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g

    const matches = []
    let match
    while ((match = dateRegex.exec(text)) !== null) {
      matches.push({ index: match.index, date: match[1] })
    }

    if (matches.length === 0) {
      return []
    }

    // Helper to assign category based on description
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

    const transactions = []

    for (let i = 0; i < matches.length; i++) {
      const { index, date } = matches[i]
      const start = index
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length
      let block = text.substring(start, end).trim()

      if (!block.startsWith(date)) {
        continue
      }

      // Remove the date from the block to get the rest of the content
      let rest = block.slice(date.length).trim()

      if (!rest) continue

      // Skip opening/closing balance lines
      if (/opening balance/i.test(rest) || /closing balance/i.test(rest)) {
        continue
      }

      // Extract the first currency amount after the description (ignore trailing balance)
      // Formats handled: $3,850.00, +$2,150.00, -$1,550.00
      const amountMatch = rest.match(/([+\-]?\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/)
      if (!amountMatch) {
        continue
      }

      const amountStr = amountMatch[1]
      const amountIndex = amountMatch.index

      // Description is everything between the date and the first amount
      let description = rest.substring(0, amountIndex).trim()
      description = description.replace(/\s+/g, ' ')

      if (!description) {
        continue
      }

      // Parse amount string into a number
      let numeric = amountStr
      let sign = 1
      if (numeric.startsWith('+')) {
        numeric = numeric.slice(1)
      } else if (numeric.startsWith('-')) {
        sign = -1
        numeric = numeric.slice(1)
      }
      numeric = numeric.replace('$', '').replace(/,/g, '')
      let amount = parseFloat(numeric)
      if (isNaN(amount)) {
        continue
      }
      amount = sign * amount

      const category = assignCategory(description)

      transactions.push({
        date,
        description,
        amount,
        category
      })
    }

    return transactions
  } catch (error) {
    console.error('Error in parsePDFTransactions:', error)
    // Return empty array instead of crashing
    return []
  }
}

