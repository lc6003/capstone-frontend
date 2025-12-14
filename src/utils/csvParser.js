import Papa from "papaparse"
import { devLog, devWarn } from "./devLog.js"
import { normalizeMerchant } from "./merchantNormalization.js"
import { categorizeTransaction } from "./categoryDetection.js"

// Parse CSV and convert to transaction objects
// Returns a Promise that resolves to an array of transactions
export const parseCSV = (csvText) => {
  return new Promise((resolve, reject) => {
    devLog('parseCSV called with text length:', csvText?.length || 0)
    
    if (!csvText || typeof csvText !== 'string') {
      const error = new Error('Invalid CSV text provided')
      console.error('parseCSV:', error.message, typeof csvText)
      reject(error)
      return
    }

    devLog('Starting PapaParse...')
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        devLog('PapaParse complete callback fired')
        devLog('Results:', {
          dataLength: results.data?.length || 0,
          errors: results.errors?.length || 0,
          meta: results.meta
        })
        
        const transactions = []
        const errors = []

        // Log available columns for debugging
        if (results.data && results.data.length > 0) {
          const firstRow = results.data[0]
          const availableColumns = Object.keys(firstRow)
          devLog('Available CSV columns:', availableColumns)
          devLog('First row sample:', firstRow)
        } else {
          devWarn('No data rows found in CSV')
        }

        results.data.forEach((row, index) => {
          try {
            // Skip completely empty rows
            if (Object.keys(row).length === 0 || Object.values(row).every(val => !val || val.toString().trim() === '')) {
              return
            }

            // Try to find common column names for date, description, and amount
            let date = null
            let description = null
            let amount = null

            // Common date column names (check various formats)
            const dateKeys = ['date', 'transaction date', 'trans_date', 'posted date', 'posting date', 'transaction_date', 'trans date', 'post date', 'date posted']
            for (const key of dateKeys) {
              if (row[key] && row[key].toString().trim()) {
                date = row[key].toString().trim()
                break
              }
            }

            // Common description/merchant column names
            const descKeys = ['description', 'merchant', 'transaction', 'details', 'memo', 'payee', 'vendor', 'name', 'merchant name', 'payee name', 'transaction description']
            for (const key of descKeys) {
              if (row[key] && row[key].toString().trim()) {
                description = row[key].toString().trim()
                break
              }
            }

            // Common amount column names
            const amountKeys = ['amount', 'transaction amount', 'debit', 'credit', 'balance', 'value', 'total', 'transaction_amount']
            
            // Try to find amount - handle both positive and negative values
            for (const key of amountKeys) {
              if (row[key] !== null && row[key] !== undefined && row[key].toString().trim() !== '') {
                let amountStr = row[key].toString().trim()
                
                // Remove currency symbols and commas
                amountStr = amountStr.replace(/[,$]/g, '')
                
                // Handle parentheses as negative (accounting format)
                const isNegative = amountStr.startsWith('(') && amountStr.endsWith(')')
                if (isNegative) {
                  amountStr = '-' + amountStr.slice(1, -1)
                }
                
                // Also check if it starts with minus sign
                if (!isNegative && !amountStr.startsWith('-')) {
                  // Some CSVs have debit/credit columns separately
                  // For now, we'll use the value as-is
                }
                
                const parsedAmount = parseFloat(amountStr)
                if (!isNaN(parsedAmount)) {
                  amount = parsedAmount
                  break
                }
              }
            }

            // Only add transaction if we have at least one meaningful field
            if (date || description || (amount !== null && amount !== 0)) {
              const normalizedDescription = description ? normalizeMerchant(description) : ''
              transactions.push({
                date: date || '',
                description: normalizedDescription,
                amount: amount !== null ? amount : 0,
                category: categorizeTransaction(normalizedDescription),
                rawRow: row // Keep raw row for debugging
              })
            }
          } catch (error) {
            errors.push({ row: index + 1, error: error.message })
          }
        })

        if (errors.length > 0) {
          devWarn('CSV parsing errors:', errors)
        }

        devLog(`✓ Parsed ${transactions.length} transactions from CSV`)
        
        if (transactions.length === 0) {
          devWarn('No transactions extracted. Check CSV column names.')
          devWarn('CSV might have different column structure. Available columns:', 
            results.data && results.data.length > 0 ? Object.keys(results.data[0]) : 'none')
        } else {
          devLog('Sample transactions:', transactions.slice(0, 3))
        }

        resolve(transactions)
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          type: error.type
        })
        reject(new Error(`Failed to parse CSV file: ${error.message || 'Unknown error'}`))
      }
    })
    devLog('PapaParse configuration set, parsing started')
  })
}

