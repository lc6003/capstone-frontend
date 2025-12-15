import { useMemo, useState, useEffect, useRef } from "react"
import { FiTrash2, FiX, FiFile, FiUpload, FiFileText, FiCheckCircle, FiBarChart2, FiDollarSign, FiTag, FiCalendar, FiEdit3, FiFilter, FiCreditCard, FiTrendingUp } from "react-icons/fi"
import Papa from "papaparse"
import * as pdfjsLib from "pdfjs-dist"
import { addExpense, getExpenses, removeExpense, updateExpense, getUserCreditCards, addUserCreditCard, removeUserCreditCard, saveUserCreditCards, monthInsights, getBudgets, saveExpenses, addUploadHistoryEntry, getUploadHistory } from "../lib/storage.js"
import { fetchExpenses, createExpense, deleteExpense } from "../lib/api.js"

// Development-only logging helpers
const isDev = import.meta.env.DEV
const devLog = (...args) => {
  if (isDev) console.log(...args)
}
const devWarn = (...args) => {
  if (isDev) console.warn(...args)
}

// Configure PDF.js worker - use CDN URLs that work reliably
// PDF.js v5.x uses .mjs files
const configurePDFWorker = () => {
  try {
    if (!pdfjsLib || !pdfjsLib.GlobalWorkerOptions) {
      devWarn('PDF.js library not available yet')
      return
    }
    
    if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Already configured
      devLog('PDF.js worker already configured:', pdfjsLib.GlobalWorkerOptions.workerSrc)
      return
    }
    
    const version = pdfjsLib.version || '5.4.394'
    
    // Use unpkg which is most reliable for pdfjs-dist v5.x
    // The worker file is at: build/pdf.worker.min.mjs
    const workerUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
    devLog('PDF.js worker configured:', workerUrl, 'Version:', version)
  } catch (error) {
    devWarn('Failed to configure PDF.js worker at module load:', error)
    // Don't throw - allow app to continue, worker will be configured when needed
  }
}

// Configure immediately at module load (safely)
configurePDFWorker()

function CreditCardTracker({ expenses, onFilterByCard, scrollToTable }) {
  const [cards, setCards] = useState(getUserCreditCards())
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    cardName: "",
    creditLimit: "",
    currentBalance: "",
    dueDate: ""
  })
  const [logo, setLogo] = useState("")
  
  // Calculate monthly spending for each card
  const getMonthlyCharges = (cardName) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date)
        const isCurrentMonth = expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
        // Match card name in note field (case-insensitive)
        const noteMatches = exp.note && exp.note.toLowerCase().includes(cardName.toLowerCase())
        return isCurrentMonth && noteMatches
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  }
  
  const handleViewTransactions = (cardName) => {
    if (onFilterByCard) {
      onFilterByCard(cardName)
    }
    if (scrollToTable) {
      scrollToTable()
    }
  }

  const bankLogos = {
    chase: "/Chase-Logo-2.svg",
    citi: "/Citi-Logo-6.svg",
    "capital one": "/Capital-One-Logo-1.svg",
    discover: "/Discover-Logo-3.svg",
    "bank of america": "/Bank-of-America-Logo-5.svg"
  }

  useEffect(() => {
    const cardNameLower = formData.cardName.toLowerCase()
    const matchedBank = Object.keys(bankLogos).find(bank => 
      cardNameLower.includes(bank.toLowerCase())
    )
    
    if (matchedBank) {
      setLogo(bankLogos[matchedBank])
    } else {
      setLogo("")
    }
  }, [formData.cardName])

  function getLogoFromCardName(cardName) {
    const cardNameLower = cardName.toLowerCase()
    const matchedBank = Object.keys(bankLogos).find(bank => 
      cardNameLower.includes(bank.toLowerCase())
    )
    return matchedBank ? bankLogos[matchedBank] : ""
  }

  function handleAddCard(e) {
    e.preventDefault()
    if (!formData.cardName || !formData.creditLimit || !formData.currentBalance || !formData.dueDate) {
      return
    }
    const cardLogo = getLogoFromCardName(formData.cardName)
    const newCard = {
      cardName: formData.cardName,
      creditLimit: Number(formData.creditLimit),
      currentBalance: Number(formData.currentBalance),
      dueDate: formData.dueDate,
      logo: cardLogo
    }
    const updated = addUserCreditCard(newCard)
    setCards(updated)
    setFormData({ cardName: "", creditLimit: "", currentBalance: "", dueDate: "" })
    setLogo("")
    setShowAddForm(false)
  }

  function handleDelete(id) {
    const updated = removeUserCreditCard(id)
    setCards(updated)
  }

  function getUtilizationPercentage(card) {
    if (!card.creditLimit || card.creditLimit === 0) return 0
    return Math.round((card.currentBalance / card.creditLimit) * 100)
  }

  function getProgressBarColor(utilization) {
    if (utilization < 30) return "#10b981" // green
    if (utilization <= 80) return "#F4A261" // orange (matches dashboard theme)
    return "#ef4444" // red
  }

  function formatDate(dateString) {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const money = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00")

  return (
    <section className="card col-12 credit-card-tracker-card" style={{ marginTop: "40px" }}>
      <div className="credit-card-tracker-header">
        <div className="credit-card-tracker-title-section">
          <FiCreditCard className="credit-card-tracker-icon" />
          <h3 className="chart-title">Credit Card Tracker</h3>
        </div>
        {!showAddForm && (
          <button 
            className="btn secondary" 
            onClick={() => setShowAddForm(true)}
            style={{ 
              padding: "8px 16px", 
              fontSize: "14px",
              margin: 0
            }}
          >
            Add Credit Card
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{ 
          marginBottom: "1.5rem", 
          padding: "1rem", 
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "8px"
        }}>
          <form onSubmit={handleAddCard} className="row" style={{ gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              flex: "1", 
              minWidth: "120px",
              gap: "10px"
            }}>
              <input 
                className="input" 
                type="text" 
                placeholder="Card Name" 
                value={formData.cardName}
                onChange={e => setFormData({ ...formData, cardName: e.target.value })}
                style={{ flex: "1", minWidth: "0" }}
                required
              />
              {logo && (
                <img 
                  src={logo} 
                  alt="Bank logo" 
                  style={{ 
                    width: "45px", 
                    height: "auto",
                    objectFit: "contain",
                    verticalAlign: "middle"
                  }} 
                />
              )}
            </div>
            <input 
              className="input" 
              type="number" 
              step="0.01"
              placeholder="Credit Limit" 
              value={formData.creditLimit}
              onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
              style={{ flex: "1", minWidth: "120px" }}
              required
            />
            <input 
              className="input" 
              type="number" 
              step="0.01"
              placeholder="Current Balance" 
              value={formData.currentBalance}
              onChange={e => setFormData({ ...formData, currentBalance: e.target.value })}
              style={{ flex: "1", minWidth: "120px" }}
              required
            />
            <input 
              className="input" 
              type="date" 
              placeholder="Due Date" 
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              style={{ flex: "1", minWidth: "140px" }}
              required
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                className="btn" 
                type="submit"
                style={{ margin: 0 }}
              >
                Add
              </button>
              <button 
                className="btn secondary" 
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ cardName: "", creditLimit: "", currentBalance: "", dueDate: "" })
                  setLogo("")
                }}
                style={{ margin: 0 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {cards.length === 0 && !showAddForm && (
        <div className="center" style={{ margin: "1rem 0" }}>
          <p className="muted">No credit card data yet.</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="credit-cards-grid">
          {cards.map(card => {
            const utilization = getUtilizationPercentage(card)
            const progressColor = getProgressBarColor(utilization)
            const monthlyCharges = getMonthlyCharges(card.cardName)
            return (
              <div 
                key={card.id} 
                className="credit-card-item"
              >
                <div className="credit-card-header">
                  <div className="credit-card-title-section">
                    {(card.logo || getLogoFromCardName(card.cardName)) ? (
                      <img 
                        src={card.logo || getLogoFromCardName(card.cardName)} 
                        alt={`${card.cardName} logo`}
                        className="credit-card-logo"
                      />
                    ) : (
                      <h4 className="credit-card-name">{card.cardName}</h4>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(card.id)}
                    type="button"
                    className="credit-card-delete-btn"
                    title="Delete card"
                    aria-label="Delete card"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
                
                <div className="credit-card-balance-section">
                  <div className="credit-card-balance-row">
                    <span className="credit-card-balance-label">Balance</span>
                    <span className="credit-card-balance-value">{money(card.currentBalance)}</span>
                  </div>
                  <div className="credit-card-balance-row">
                    <span className="credit-card-balance-label">Limit</span>
                    <span className="credit-card-balance-value">{money(card.creditLimit)}</span>
                  </div>
                  <div className="credit-card-balance-row">
                    <span className="credit-card-balance-label">Utilization</span>
                    <span className="credit-card-balance-value">{utilization}%</span>
                  </div>
                </div>
                
                <div className="credit-card-divider credit-card-monthly-divider"></div>
                
                <div className="credit-card-monthly-section">
                  <span className="credit-card-monthly-label">This month's charges:</span>
                  <span className="credit-card-monthly-value">${monthlyCharges.toFixed(2)}</span>
                </div>
                
                <div className="credit-card-progress-container">
                  <div 
                    className="credit-card-progress-bar"
                    style={{ 
                      width: `${Math.min(100, utilization)}%`,
                      backgroundColor: progressColor
                    }}
                  />
                </div>
                
                <div className="credit-card-footer">
                  <span className="credit-card-due-date">Due: {formatDate(card.dueDate)}</span>
                  <button
                    onClick={() => handleViewTransactions(card.cardName)}
                    type="button"
                    className="btn secondary credit-card-view-btn credit-card-view-btn-pill"
                  >
                    <FiTrendingUp size={14} />
                    <span>View transactions</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function Expenses(){
  const [_, force] = useState(0)
  // Fixed category options for dropdown
  const availableCategories = ["Uncategorized", "Food", "Bills", "Travel", "Shopping", "Entertainment", "Health", "Income", "Miscellaneous", "Other"]
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0,10),
    note: ""
  })
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState("")
  const [filterDateRange, setFilterDateRange] = useState("all")
  const [filterCardName, setFilterCardName] = useState("")
  const [selectedExpense, setSelectedExpense] = useState(null)
  
  // Bank statement upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileType, setFileType] = useState(null)
  const [fileLoaded, setFileLoaded] = useState(false)
  const [fileContent, setFileContent] = useState(null)
  const [parsedTransactions, setParsedTransactions] = useState([])
  const [importSuccess, setImportSuccess] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [importedTransactionsSummary, setImportedTransactionsSummary] = useState([])
  const [showImportSummary, setShowImportSummary] = useState(false)
  const [pdfParsedTransactions, setPdfParsedTransactions] = useState([])
  const [pdfImportSuccess, setPdfImportSuccess] = useState(false)
  const [pdfImportedCount, setPdfImportedCount] = useState(0)
  const [pdfTransactionsApproved, setPdfTransactionsApproved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfFileContent, setPdfFileContent] = useState(null) // Store PDF ArrayBuffer before processing
  const [pdfProcessingInitiated, setPdfProcessingInitiated] = useState(false) // Track if user clicked "Process PDF"
  const [pdfError, setPdfError] = useState(null) // Store PDF processing errors
  const [pdfRawText, setPdfRawText] = useState('')
  
  // Recurring payments state
  const [recurringPayments, setRecurringPayments] = useState([])
  
  // Upload history state
  const [uploadHistory, setUploadHistory] = useState([])
  
  // Reference for scrolling to table
  const recentTableRef = useRef(null)
  
  const scrollToTable = () => {
    if (recentTableRef.current) {
      recentTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  
  // Merchant normalization map for cleaning up messy merchant names
  const merchantNormalizationMap = {
    "STARBUCKS": "Starbucks",
    "UBER": "Uber",
    "UBER *TRIP": "Uber",
    "AMZN": "Amazon",
    "AMAZON MKTPLACE": "Amazon",
    "MCDONALDS": "McDonald's"
  }
  
  // Function to normalize merchant names using the map
  const normalizeMerchant = (name) => {
    if (!name) return name
    
    // Convert to uppercase
    const nameUpper = name.toUpperCase().trim()
    
    // Check if it includes any key from merchantNormalizationMap
    for (const [key, cleanVersion] of Object.entries(merchantNormalizationMap)) {
      if (nameUpper.includes(key)) {
        return cleanVersion
      }
    }
    
    // If no match, return the original name cleaned (trim spaces, remove numbers like #4321)
    let cleaned = name.trim()
    
    // Remove numbers like #4321, #1234, etc.
    cleaned = cleaned.replace(/#\d+/g, '')
    
    // Remove standalone numbers at the end (e.g., "STORE 123" -> "STORE")
    cleaned = cleaned.replace(/\s+\d+$/, '')
    
    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    return cleaned
  }

  // Auto-categorize transactions based on description
  const categorizeTransaction = (description) => {
    if (!description || typeof description !== 'string') {
      return 'Other'
    }

    const desc = description.toLowerCase().trim()

    // Food & Dining
    const foodKeywords = ['grocery', 'grocery store', 'supermarket', 'restaurant', 'burger', 'coffee', 'cafe', 'pizza', 'food', 'dining', 'fast food', 'starbucks', 'mcdonald', 'subway', 'chipotle', 'taco', 'dunkin', 'panera', 'deli', 'bakery', 'pizza hut', 'domino']
    if (foodKeywords.some(keyword => desc.includes(keyword))) {
      return 'Food'
    }

    // Bills & Utilities
    const billsKeywords = ['electric', 'electricity', 'gas bill', 'utility', 'utilities', 'water', 'wifi', 'internet', 'phone', 'cell phone', 'mobile', 'cable', 'tv', 'television', 'internet service', 'power', 'energy', 'heating', 'cooling', 'trash', 'sewer']
    if (billsKeywords.some(keyword => desc.includes(keyword))) {
      return 'Bills'
    }

    // Transportation
    const transportationKeywords = ['uber', 'lyft', 'taxi', 'cab', 'gas station', 'gas', 'fuel', 'exxon', 'shell', 'chevron', 'bp', 'mobil', 'parking', 'metro', 'subway', 'bus', 'train', 'transit', 'toll', 'ezpass']
    if (transportationKeywords.some(keyword => desc.includes(keyword))) {
      return 'Travel'
    }

    // Shopping
    const shoppingKeywords = ['amazon', 'target', 'walmart', 'clothing', 'store', 'mall', 'online shopping', 'retail', 'shop', 'purchase', 'buy', 'merchandise', 'department store', 'costco', 'best buy', 'home depot', 'lowes', 'nike', 'adidas']
    if (shoppingKeywords.some(keyword => desc.includes(keyword))) {
      return 'Shopping'
    }

    // Entertainment
    const entertainmentKeywords = ['movie', 'cinema', 'theater', 'netflix', 'spotify', 'hulu', 'disney', 'streaming', 'game', 'gaming', 'concert', 'show', 'ticket', 'event', 'entertainment', 'amc', 'regal']
    if (entertainmentKeywords.some(keyword => desc.includes(keyword))) {
      return 'Entertainment'
    }

    // Income
    const incomeKeywords = ['payroll', 'deposit', 'salary', 'paycheck', 'income', 'direct deposit', 'wage', 'payment received', 'refund', 'reimbursement']
    if (incomeKeywords.some(keyword => desc.includes(keyword))) {
      return 'Income'
    }

    // Health
    const healthKeywords = ['pharmacy', 'cvs', 'walgreens', 'rite aid', 'doctor', 'hospital', 'medical', 'health', 'dental', 'vision', 'prescription', 'clinic', 'urgent care']
    if (healthKeywords.some(keyword => desc.includes(keyword))) {
      return 'Health'
    }

    // Default fallback
    return 'Other'
  }

  const handleFilterByCard = (cardName) => {
    setFilterCardName(cardName)
    setFilterCategory("")
    setFilterDateRange("all")
  }

  // File type detection - only CSV and PDF
  const detectFileType = (fileName, fileType) => {
    if (!fileName) {
      devWarn('detectFileType: No fileName provided')
      return null
    }
    
    devLog('detectFileType - fileName:', fileName, 'fileType (MIME):', fileType)
    
    // Check MIME type first (more reliable)
    if (fileType) {
      // Check for PDF MIME type
      if (fileType === 'application/pdf' || fileType === 'application/x-pdf') {
        devLog('Detected PDF from MIME type')
        return 'PDF'
      }
      // Check for CSV MIME type
      if (fileType === 'text/csv' || fileType === 'application/csv' || fileType === 'text/plain') {
        const extension = fileName.split('.').pop()?.toLowerCase()
        if (extension === 'csv') {
          devLog('Detected CSV from MIME type and extension')
          return 'CSV'
        }
      }
    }
    
    // Fall back to extension-based detection
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension) {
      devWarn('detectFileType: No extension found in fileName:', fileName)
      return 'UNKNOWN'
    }
    
    devLog('Detecting file type from extension:', extension)
    
    switch (extension) {
      case 'csv':
        return 'CSV'
      case 'pdf':
        return 'PDF'
      default:
        devWarn('detectFileType: Unsupported file type. Only CSV and PDF are supported.')
        return 'UNKNOWN'
    }
  }

  // Parse CSV and convert to transaction objects
  const parseCSV = (csvText) => {
    devLog('parseCSV called with text length:', csvText?.length || 0)
    
    if (!csvText || typeof csvText !== 'string') {
      console.error('parseCSV: Invalid CSV text provided', typeof csvText)
      setParsedTransactions([])
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

        devLog(`Setting parsedTransactions with ${transactions.length} transactions`)
        setParsedTransactions(transactions)
        devLog(`✓ Parsed ${transactions.length} transactions from CSV`)
        
        if (transactions.length === 0) {
          devWarn('No transactions extracted. Check CSV column names.')
          devWarn('CSV might have different column structure. Available columns:', 
            results.data && results.data.length > 0 ? Object.keys(results.data[0]) : 'none')
        } else {
          devLog('Sample transactions:', transactions.slice(0, 3))
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          type: error.type
        })
        setParsedTransactions([])
        setPdfError(`Failed to parse CSV file: ${error.message || 'Unknown error'}`)
      }
    })
    devLog('PapaParse configuration set, parsing started')
  }

  // Timeout utility function
  const withTimeout = (promise, timeoutMs, errorMessage) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ])
  }

  // Extract text from PDF using PDF.js with timeout protection
  const extractTextFromPDF = async (arrayBuffer) => {
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

  // Handle "Process PDF" button click - processes the PDF file
  const handleProcessPDF = async () => {
    if (!pdfFileContent) {
      setPdfError('No PDF file content available. Please upload a PDF file first.')
      return
    }
    
    if (!(pdfFileContent instanceof ArrayBuffer)) {
      setPdfError('Invalid PDF file format. Please try uploading the file again.')
      return
    }
    
    if (pdfFileContent.byteLength === 0) {
      setPdfError('PDF file is empty. Please try a different file.')
      return
    }
    
    try {
      // Reset error state
      setPdfError(null)
      // Set processing state
      setPdfLoading(true)
      setPdfProcessingInitiated(true)
      
      // Extract text from PDF with timeout protection
      let extractedText
      try {
        extractedText = await extractTextFromPDF(pdfFileContent)
      } catch (extractError) {
        throw new Error(extractError.message || 'Failed to extract text from PDF')
      }
      
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
        throw new Error('No text found in PDF. The PDF may be image-based.')
      }
      
      // Store raw extracted text for diagnostics
      setPdfRawText(extractedText)
      
      // Parse transactions safely
      let transactions = []
      try {
        transactions = parsePDFTransactions(extractedText)
        if (!Array.isArray(transactions)) {
          transactions = []
        }
      } catch (parseError) {
        console.error('Error parsing PDF transactions:', parseError)
        // Don't throw - just show empty transactions, but log the error
        transactions = []
      }
      
      // Set loading to false after parsing completes
      setPdfLoading(false)
      
      // Update state with parsed transactions
      setPdfParsedTransactions(transactions)
      setPdfTransactionsApproved(false)
      
      // If no transactions were found, set an error message
      if (transactions.length === 0) {
        setPdfError('No transactions found in PDF. The PDF may not contain transaction data in a recognizable format.')
      }
      
    } catch (error) {
      console.error('PDF processing error:', error)
      const errorMessage = error?.message || error?.toString() || 'Failed to process PDF'
      setPdfError(errorMessage)
      setPdfLoading(false)
      setPdfProcessingInitiated(false)
      setPdfParsedTransactions([])
      setPdfRawText('')
    }
  }

  // Handle "Retry PDF" button click - reprocesses the PDF (same as handleProcessPDF)
  const handleRetryPDF = async () => {
    await handleProcessPDF()
  }

  // Normalize PDF text before parsing - removes headers, footers, and non-transaction lines
  const normalizePDFText = (text) => {
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
  const parsePDFTransactions = (pdfText) => {
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

  // Unified file processing function - handles all file types consistently
  const processFile = async (file, detectedType, content) => {
    devLog('=== Processing File ===')
    devLog('File:', file.name)
    devLog('Type:', detectedType)
    devLog('Size:', file.size, 'bytes')
    
    // Reset all states (fileLoaded is set in reader.onload)
    setFileContent(null)
    setParsedTransactions([])
    setPdfParsedTransactions([])
    setPdfTransactionsApproved(false)
    setPdfLoading(false)
    setPdfError(null)
    
    try {
      if (detectedType === 'CSV') {
        // CSV: Parse immediately
        devLog('→ Processing CSV file...')
        devLog('CSV content type:', typeof content)
        devLog('CSV content length:', content?.length || 0)
        
        // Ensure content is a string
        if (typeof content !== 'string') {
          console.error('CSV content is not a string, converting...')
          if (content instanceof ArrayBuffer) {
            const decoder = new TextDecoder()
            content = decoder.decode(content)
          } else {
            content = String(content)
          }
        }
        
        // Set file content first
        setFileContent(content)
        
        // Parse CSV - this will update parsedTransactions via PapaParse callback
        devLog('Calling parseCSV with content length:', content.length)
        parseCSV(content)
        devLog('✓ CSV processing initiated - PapaParse started')
        
      } else if (detectedType === 'PDF') {
        // PDF processing is handled directly in reader.onload for simplicity
        // This section is skipped for PDFs
        
      } else {
        // Unknown file type
        devWarn('Unknown file type:', detectedType)
        setFileContent(content)
      }
    } catch (error) {
      console.error('Error processing file:', error)
      if (detectedType === 'PDF') {
        setPdfError(error.message || 'Failed to process PDF')
        setPdfLoading(false)
      }
    }
  }

  // Read file using FileReader API
  const readFile = (file) => {
    if (!file) {
      console.error('No file provided')
      return
    }

    // Detect file type immediately
    const detectedType = detectFileType(file.name, file.type)
    
    if (!detectedType || detectedType === 'UNKNOWN') {
      console.error('Unknown file type for file:', file.name, 'MIME type:', file.type)
      setFileType(null)
      setFileLoaded(false)
      setPdfError('Unsupported file type. Please upload a CSV or PDF file.')
      return
    }

    // Set file type immediately - this triggers UI state transition
    setFileType(detectedType)
    setSelectedFile(file)
    
    // Set fileLoaded to true IMMEDIATELY to transition UI to preview mode
    // The file content will be loaded asynchronously, but UI should show immediately
    setFileLoaded(true)

    // Reset all states
    setFileContent(null)
    setParsedTransactions([])
    setPdfParsedTransactions([])
    setPdfTransactionsApproved(false)
    setPdfLoading(false)
    setPdfFileContent(null)
    setPdfProcessingInitiated(false)
    setPdfError(null)
    setPdfRawText('')

    const reader = new FileReader()
    
    // Store detectedType in a variable that will be captured in closure
    const fileTypeToProcess = detectedType

    reader.onload = async (e) => {
      try {
        const content = e.target.result
        
        // Validate that we got content
        if (!content) {
          throw new Error('FileReader returned empty content')
        }
        
        // Process file based on type - simplified flow
        if (fileTypeToProcess === 'PDF') {
          // For PDF: Just store the file content, don't process automatically
          // User will click "Process PDF" button to start processing
          try {
            // Validate ArrayBuffer
            if (!(content instanceof ArrayBuffer)) {
              throw new Error('Invalid PDF file format')
            }
            
            if (content.byteLength === 0) {
              throw new Error('PDF file is empty')
            }
            
            // Store PDF content without processing
            setPdfFileContent(content)
            setPdfError(null)
            setPdfProcessingInitiated(false)
            setPdfLoading(false)
            
          } catch (error) {
            setPdfError(`Invalid PDF file: ${error.message || error}`)
            setPdfFileContent(null)
            setPdfProcessingInitiated(false)
            setPdfLoading(false)
          }
        } else {
          // For CSV and other types, use processFile
          try {
            await processFile(file, fileTypeToProcess, content)
          } catch (error) {
            // Don't reset fileLoaded to false here - keep it true so UI shows file is loaded
            setPdfError(`Failed to process ${fileTypeToProcess} file: ${error.message || error}`)
          }
        }
      } catch (error) {
        // Catch-all for any unexpected errors
        // Keep fileLoaded true so UI shows something, but set error state
        setPdfError(`An unexpected error occurred: ${error.message || error}. Please try again.`)
        if (fileTypeToProcess === 'PDF') {
          setPdfLoading(false)
          setPdfProcessingInitiated(false)
        }
      }
    }

    reader.onerror = (error) => {
      // Keep fileType and fileLoaded true so UI stays in preview mode
      // But show error message to user
      setPdfError(`Failed to read file: ${error.target?.error?.message || 'Unknown error'}. Please try a different file.`)
    }
    
    reader.onloadstart = () => {
      // Ensure fileLoaded is true when reading starts
      setFileLoaded(true)
    }

    // Read file based on type
    try {
      if (fileTypeToProcess === 'PDF') {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsText(file)
      }
    } catch (readError) {
      setFileLoaded(false)
      setFileType(null)
      setFileContent(null)
      setPdfError(`Failed to start reading file: ${readError.message || readError}. Please try again.`)
    }
  }

  // Generate duplicate ID from date + description + amount
  const generateDuplicateId = (transaction) => {
    const date = (transaction.date || '').toString().trim().toLowerCase()
    const description = (transaction.description || '').toString().trim().toLowerCase()
    const amount = transaction.amount !== null ? transaction.amount.toString() : '0'
    return `${date}|${description}|${amount}`
  }

  // Import parsed transactions into app storage
  const handleImportTransactions = async () => {
    if (!parsedTransactions || parsedTransactions.length === 0) {
      devWarn('No transactions to import')
      return
    }

    // Get existing expenses
    const existingExpenses = getExpenses()
    
    // Create a set of existing duplicate IDs
    const existingIds = new Set(
      existingExpenses.map(exp => {
        const date = (exp.date || '').toString().trim().toLowerCase()
        const note = (exp.note || '').toString().trim().toLowerCase()
        const amount = (exp.amount || 0).toString()
        return `${date}|${note}|${amount}`
      })
    )

    // Filter out duplicates and convert to expense format
    const newExpenses = []
    let skippedCount = 0

    parsedTransactions.forEach((transaction) => {
      const duplicateId = generateDuplicateId(transaction)
      
      if (existingIds.has(duplicateId)) {
        skippedCount++
        return // Skip duplicate
      }

      // Convert transaction to expense format
      // Parse date - try to handle various date formats
      let expenseDate = transaction.date
      if (transaction.date && transaction.date.toString().trim()) {
        const dateStr = transaction.date.toString().trim()
        
        // Check if already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          expenseDate = dateStr
        } else {
          // Try to parse the date and format it as YYYY-MM-DD
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            // Get local date in YYYY-MM-DD format
            const year = parsedDate.getFullYear()
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getDate()).padStart(2, '0')
            expenseDate = `${year}-${month}-${day}`
          } else {
            // If parsing fails, use today's date
            expenseDate = new Date().toISOString().split('T')[0]
          }
        }
      } else {
        // Default to today's date if no date provided
        expenseDate = new Date().toISOString().split('T')[0]
      }

      // Auto-categorize the transaction based on description
      const category = categorizeTransaction(transaction.description)
      
      // Log categorization for debugging (can be removed later if not needed)
      if (transaction.description) {
        devLog(`Categorized "${transaction.description}" as "${category}"`)
      }

      const expense = {
        id: crypto.randomUUID(),
        date: expenseDate,
        amount: Number(transaction.amount) || 0,
        category: category,
        note: transaction.description || ''
      }

      newExpenses.push(expense)
      existingIds.add(duplicateId) // Add to set to prevent duplicates within same import batch
    })

    // Add all new expenses at once
    if (newExpenses.length > 0) {
      const updatedExpenses = [...existingExpenses, ...newExpenses]
      saveExpenses(updatedExpenses)
      
      // Track expenses via API
      try {
        for (const expense of newExpenses) {
          await createExpense(expense)
        }
      } catch (error) {
        devWarn('Failed to create some expenses via API:', error)
        // Continue even if API calls fail
      }
      
      setImportedCount(newExpenses.length)
      setImportSuccess(true)
      
      // Store imported transactions for summary display
      setImportedTransactionsSummary(newExpenses)
      setShowImportSummary(true)
      
      // Add upload history entry
      addUploadHistoryEntry('CSV', newExpenses.length)
      
      // Reload upload history
      reloadUploadHistory()
      
      // Clear parsed transactions and reset file input
      setParsedTransactions([])
      setSelectedFile(null)
      setFileType(null)
      setFileLoaded(false)
      setFileContent(null)
      
      // Reset file input element
      const fileInput = document.getElementById('bank-statement-file')
      if (fileInput) {
        fileInput.value = ''
      }
      
      // Force re-render to show new transactions
      force(x => x + 1)
      
      devLog(`Imported ${newExpenses.length} transactions`)
      if (skippedCount > 0) {
        devLog(`Skipped ${skippedCount} duplicate transactions`)
      }
    } else {
      devLog('All transactions were duplicates - nothing to import')
      setImportedCount(0)
      setImportSuccess(true)
      
      // Still add history entry even if no transactions imported (user attempted import)
      addUploadHistoryEntry('CSV', 0)
      
      // Reload upload history
      reloadUploadHistory()
      
      // Still clear the preview
      setParsedTransactions([])
      setSelectedFile(null)
      setFileType(null)
      setFileLoaded(false)
      setFileContent(null)
      
      const fileInput = document.getElementById('bank-statement-file')
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }

  // Handle editing PDF transactions
  const handleEditPDFTransaction = (index, field, value) => {
    const updated = [...pdfParsedTransactions]
    updated[index] = { ...updated[index], [field]: value }
    setPdfParsedTransactions(updated)
    setPdfTransactionsApproved(false) // Reset approval when transaction is edited
  }

  // Handle deleting PDF transactions
  const handleDeletePDFTransaction = (index) => {
    const updated = pdfParsedTransactions.filter((_, i) => i !== index)
    setPdfParsedTransactions(updated)
    setPdfTransactionsApproved(false) // Reset approval when transaction is deleted
  }

  // Import parsed PDF transactions into app storage
  const handleImportPDFTransactions = async () => {
    if (!pdfParsedTransactions || pdfParsedTransactions.length === 0) {
      devWarn('No PDF transactions to import')
      return
    }
    
    if (!pdfTransactionsApproved) {
      devWarn('Transactions must be approved before importing')
      return
    }

    // Get existing expenses
    const existingExpenses = getExpenses()
    
    // Create a set of existing duplicate IDs
    const existingIds = new Set(
      existingExpenses.map(exp => {
        const date = (exp.date || '').toString().trim().toLowerCase()
        const note = (exp.note || '').toString().trim().toLowerCase()
        const amount = (exp.amount || 0).toString()
        return `${date}|${note}|${amount}`
      })
    )

    // Filter out duplicates and convert to expense format
    const newExpenses = []
    let skippedCount = 0

    pdfParsedTransactions.forEach((transaction) => {
      const duplicateId = generateDuplicateId(transaction)
      
      if (existingIds.has(duplicateId)) {
        skippedCount++
        return // Skip duplicate
      }

      // Convert transaction to expense format
      // Parse date - try to handle various date formats
      let expenseDate = transaction.date
      if (transaction.date && transaction.date.toString().trim()) {
        const dateStr = transaction.date.toString().trim()
        
        // Check if already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          expenseDate = dateStr
        } else {
          // Try to parse the date and format it as YYYY-MM-DD
          // Handle formats like MM/DD/YYYY, MM-DD-YYYY, etc.
          let parsedDate
          if (dateStr.includes('/')) {
            // MM/DD/YYYY or MM/DD/YY format
            const parts = dateStr.split('/')
            if (parts.length === 3) {
              const month = parseInt(parts[0]) - 1
              const day = parseInt(parts[1])
              let year = parseInt(parts[2])
              // Handle 2-digit years
              if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year
              }
              parsedDate = new Date(year, month, day)
            } else {
              parsedDate = new Date(dateStr)
            }
          } else if (dateStr.includes('-')) {
            // MM-DD-YYYY or MM-DD-YY format
            const parts = dateStr.split('-')
            if (parts.length === 3) {
              const month = parseInt(parts[0]) - 1
              const day = parseInt(parts[1])
              let year = parseInt(parts[2])
              // Handle 2-digit years
              if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year
              }
              parsedDate = new Date(year, month, day)
            } else {
              parsedDate = new Date(dateStr)
            }
          } else {
            parsedDate = new Date(dateStr)
          }
          
          if (!isNaN(parsedDate.getTime())) {
            // Get local date in YYYY-MM-DD format
            const year = parsedDate.getFullYear()
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getDate()).padStart(2, '0')
            expenseDate = `${year}-${month}-${day}`
          } else {
            // If parsing fails, use today's date
            expenseDate = new Date().toISOString().split('T')[0]
          }
        }
      } else {
        // Default to today's date if no date provided
        expenseDate = new Date().toISOString().split('T')[0]
      }

      // Use the category that was already assigned during parsing
      const category = transaction.category || categorizeTransaction(transaction.description)

      const expense = {
        id: crypto.randomUUID(),
        date: expenseDate,
        amount: Number(transaction.amount) || 0,
        category: category,
        note: transaction.description || ''
      }

      newExpenses.push(expense)
      existingIds.add(duplicateId) // Add to set to prevent duplicates within same import batch
    })

    // Add all new expenses at once
    if (newExpenses.length > 0) {
      const updatedExpenses = [...existingExpenses, ...newExpenses]
      saveExpenses(updatedExpenses)
      
      // Track expenses via API
      try {
        for (const expense of newExpenses) {
          await createExpense(expense)
        }
      } catch (error) {
        devWarn('Failed to create some expenses via API:', error)
        // Continue even if API calls fail
      }
      
      setPdfImportedCount(newExpenses.length)
      setPdfImportSuccess(true)
      
      // Add upload history entry
      addUploadHistoryEntry('PDF', newExpenses.length)
      
      // Reload upload history
      reloadUploadHistory()
      
      // Clear PDF-related states and reset file input
      setPdfParsedTransactions([])
      setPdfTransactionsApproved(false)
      setPdfLoading(false)
      setPdfFileContent(null)
      setPdfProcessingInitiated(false)
      setPdfError(null)
      setSelectedFile(null)
      setFileType(null)
      setFileLoaded(false)
      setFileContent(null)
      
      // Reset file input element
      const fileInput = document.getElementById('bank-statement-file')
      if (fileInput) {
        fileInput.value = ''
      }
      
      // Force re-render to show new transactions
      force(x => x + 1)
      
      devLog(`Imported ${newExpenses.length} PDF transactions`)
      if (skippedCount > 0) {
        devLog(`Skipped ${skippedCount} duplicate PDF transactions`)
      }
    } else {
      devLog('All PDF transactions were duplicates - nothing to import')
      setPdfImportedCount(0)
      setPdfImportSuccess(true)
      
      // Still add history entry even if no transactions imported (user attempted import)
      addUploadHistoryEntry('PDF', 0)
      
      // Reload upload history
      reloadUploadHistory()
      
      // Still clear the preview
      setPdfParsedTransactions([])
      setPdfTransactionsApproved(false)
      setPdfLoading(false)
      setPdfFileContent(null)
      setPdfProcessingInitiated(false)
      setPdfError(null)
      setSelectedFile(null)
      setFileType(null)
      setFileLoaded(false)
      setFileContent(null)
      
      const fileInput = document.getElementById('bank-statement-file')
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }
  
  // Function to detect recurring payments
  const detectRecurringPayments = (transactions) => {
    if (!transactions || transactions.length === 0) return []
    
    // Group transactions by merchant (description) - normalize first
    const merchantGroups = {}
    
    transactions.forEach(transaction => {
      const rawMerchant = (transaction.description || '').trim()
      if (!rawMerchant) return
      
      // Normalize merchant name
      const merchant = normalizeMerchant(rawMerchant)
      
      const amount = Math.abs(Number(transaction.amount) || 0)
      const date = new Date(transaction.date)
      
      if (!isNaN(date.getTime()) && amount > 0) {
        if (!merchantGroups[merchant]) {
          merchantGroups[merchant] = []
        }
        merchantGroups[merchant].push({ date, amount })
      }
    })
    
    const recurring = []
    
    // Analyze each merchant group
    Object.entries(merchantGroups).forEach(([merchant, transactions]) => {
      if (transactions.length < 2) return // Need at least 2 transactions
      
      // Sort by date (oldest first)
      const sorted = [...transactions].sort((a, b) => a.date - b.date)
      
      // Group by similar amounts (within +/- 10%)
      const amountGroups = []
      sorted.forEach(trans => {
        let foundGroup = false
        for (let group of amountGroups) {
          const avgAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length
          const percentDiff = Math.abs((trans.amount - avgAmount) / avgAmount)
          
          if (percentDiff <= 0.1) { // Within 10%
            group.push(trans)
            foundGroup = true
            break
          }
        }
        if (!foundGroup) {
          amountGroups.push([trans])
        }
      })
      
      // Check each amount group for recurring pattern
      amountGroups.forEach(group => {
        if (group.length < 2) return
        
        // Calculate time differences between consecutive transactions
        const timeDiffs = []
        for (let i = 1; i < group.length; i++) {
          const diffMs = group[i].date - group[i - 1].date
          const diffDays = diffMs / (1000 * 60 * 60 * 24)
          timeDiffs.push(diffDays)
        }
        
        // Check if time differences match weekly (7 days) or monthly (30-32 days) pattern
        // Count how many intervals match each pattern
        let weeklyMatches = 0
        let monthlyMatches = 0
        
        for (let diff of timeDiffs) {
          // Weekly: 6-8 days (allow some flexibility for 7 days)
          if (diff >= 6 && diff <= 8) {
            weeklyMatches++
          }
          // Monthly: 30-32 days as specified
          if (diff >= 30 && diff <= 32) {
            monthlyMatches++
          }
        }
        
        // Determine frequency - need at least 50% of intervals to match
        const threshold = Math.ceil(timeDiffs.length / 2)
        let frequency = null
        
        if (weeklyMatches >= threshold && weeklyMatches > 0) {
          frequency = 'weekly'
        } else if (monthlyMatches >= threshold && monthlyMatches > 0) {
          frequency = 'monthly'
        }
        
        if (frequency) {
          const averageAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length
          const lastCharge = group[group.length - 1].date
          
          recurring.push({
            merchant,
            averageAmount: Math.round(averageAmount * 100) / 100, // Round to 2 decimals
            frequency,
            lastCharge
          })
        }
      })
    })
    
    // Sort by last charge date (most recent first)
    return recurring.sort((a, b) => b.lastCharge - a.lastCharge)
  }
  
  const expenses = useMemo(
    () => getExpenses().sort((a,b)=> new Date(b.date) - new Date(a.date)),
    [_]
  )
  const monthData = useMemo(() => monthInsights(), [_])
  const budgets = useMemo(() => getBudgets(), [_])
  
  // Detect recurring payments when expenses change
  useEffect(() => {
    const detected = detectRecurringPayments(expenses)
    setRecurringPayments(detected)
  }, [expenses])
  
  // Helper function to reload upload history
  const reloadUploadHistory = () => {
    const history = getUploadHistory()
    // Sort by newest first (timestamp descending)
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp)
    setUploadHistory(sortedHistory)
  }
  
  // Load upload history on mount
  useEffect(() => {
    reloadUploadHistory()
  }, [])

  // Fetch expenses from API on mount and sync with local storage
  useEffect(() => {
    const syncExpensesFromAPI = async () => {
      try {
        const apiExpenses = await fetchExpenses()
        if (apiExpenses && apiExpenses.length > 0) {
          const localExpenses = getExpenses()
          // Merge API expenses with local expenses, avoiding duplicates
          const mergedExpenses = [...localExpenses]
          apiExpenses.forEach(apiExp => {
            const exists = mergedExpenses.some(localExp => localExp.id === apiExp.id)
            if (!exists) {
              mergedExpenses.push(apiExp)
            }
          })
          saveExpenses(mergedExpenses)
          force(x => x + 1)
        }
      } catch (error) {
        devWarn('Failed to fetch expenses from API:', error)
        // Continue with local storage if API fails
      }
    }
    syncExpensesFromAPI()
  }, [])

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let filtered = expenses
    
    // Filter by card name (in note field)
    if (filterCardName) {
      filtered = filtered.filter(exp => {
        const note = (exp.note || "").toLowerCase()
        return note.includes(filterCardName.toLowerCase())
      })
    }
    
    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(exp => (exp.category || "Uncategorized") === filterCategory)
    }
    
    // Filter by date range
    if (filterDateRange !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date)
        const expDateOnly = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate())
        
        switch(filterDateRange) {
          case "today":
            return expDateOnly.getTime() === today.getTime()
          case "week":
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return expDateOnly >= weekAgo
          case "month":
            return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
          case "year":
            return expDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }
    
    return filtered
  }, [expenses, filterCategory, filterDateRange, filterCardName])

  // Calculate filtered total
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  }, [filteredExpenses])

  // Calculate total spending
  const totalSpending = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  const monthlyBudget = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0)
  const remainingBudget = monthlyBudget > 0 ? Math.max(0, monthlyBudget - monthData.sum) : 0
  const now = new Date()
  const currentDay = now.getUTCDate()
  const avgDailySpend = currentDay > 0 ? monthData.sum / currentDay : 0

  async function submit(e){
    e.preventDefault()
    if(!form.amount) return
    // Normalize merchant name from note field
    const normalizedDescription = form.note ? normalizeMerchant(form.note) : ''
    const expenseData = { 
      ...form, 
      amount: Number(form.amount), 
      category: form.category || "Uncategorized",
      note: normalizedDescription, // Normalize note field
      description: normalizedDescription // Also set description for consistency
    }
    // Add to local storage first
    const updatedExpenses = addExpense(expenseData)
    // Track via API
    try {
      const newExpense = updatedExpenses[updatedExpenses.length - 1]
      await createExpense(newExpense)
    } catch (error) {
      devWarn('Failed to create expense via API:', error)
      // Continue even if API call fails
    }
    setForm(f => ({ ...f, amount:"", note:"", category:"" }))
    force(x => x + 1)
  }
  async function del(id){
    // Remove from local storage first
    removeExpense(id)
    // Track deletion via API
    try {
      await deleteExpense(id)
    } catch (error) {
      devWarn('Failed to delete expense via API:', error)
      // Continue even if API call fails
    }
    force(x => x + 1)
  }

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12 spending-overview-card spending-hero-card">
          <div className="spending-hero-header">
            <div className="spending-hero-title-section">
              <FiBarChart2 className="spending-hero-icon" />
              <h2 className="spending-hero-title">Spending Overview</h2>
            </div>
            <span className="spending-hero-badge">Spending Summary</span>
          </div>
          <div className="spending-hero-content">
            <div className="spending-hero-main-metric">
              <div className="spending-hero-main-label">Total Spent</div>
              <div className="spending-hero-main-value">${monthData.sum.toFixed(2)}</div>
              </div>
            <div className="spending-hero-secondary-metrics">
              {monthData.sum > 0 && (
                <div className="spending-hero-metric">
                  <div className="spending-hero-metric-label">Avg Daily Spend</div>
                  <div className="spending-hero-metric-value">${avgDailySpend.toFixed(2)}</div>
                </div>
              )}
              {expenses.length > 0 && (
                <div className="spending-hero-metric">
                  <div className="spending-hero-metric-label">Transactions</div>
                  <div className="spending-hero-metric-value">{expenses.filter(e => {
                    const ed = new Date(e.date)
                    const now = new Date()
                    return ed.getMonth() === now.getMonth() && ed.getFullYear() === now.getFullYear()
                  }).length}</div>
                </div>
              )}
            </div>
            {monthlyBudget > 0 && (
              <div className="overview-budget-info">
                <p className="overview-budget-label">Remaining budget</p>
                <p className={`overview-budget-value ${remainingBudget <= (monthlyBudget * 0.2) ? "negative" : ""}`}>
                  ${remainingBudget.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="card col-12 spending-form-card" style={{ marginTop: "40px" }}>
          <h3 className="chart-title">Add Transaction</h3>
          <form className="spending-form" onSubmit={submit}>
            <div className="spending-input-wrapper">
              <FiDollarSign className="spending-input-icon" />
              <input className="input spending-input" type="number" step="0.01" placeholder="Amount"
                   value={form.amount} onChange={e=>setForm({ ...form, amount:e.target.value })} />
            </div>
            <div className="spending-input-wrapper">
              <FiTag className="spending-input-icon" />
              <select className="input spending-input spending-select" value={form.category} onChange={e=>setForm({ ...form, category:e.target.value })}>
              <option value="">Select Category</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            </div>
            <div className="spending-input-wrapper">
              <FiCalendar className="spending-input-icon" />
              <input className="input spending-input" type="date" value={form.date} onChange={e=>setForm({ ...form, date:e.target.value })} />
            </div>
            <div className="spending-input-wrapper">
              <FiEdit3 className="spending-input-icon" />
              <input className="input spending-input" type="text" placeholder="Note" value={form.note}
                   onChange={e=>setForm({ ...form, note:e.target.value })} />
            </div>
            <button className="btn spending-submit-btn" type="submit">Add</button>
          </form>
        </section>

        {/* SECTION A: File Selection Card */}
        <section className="card col-12 upload-file-selection-card" style={{ marginTop: "40px" }}>
          <div className="upload-dropzone-container">
            <div className="upload-dropzone-icon-wrapper">
              <FiUpload className="upload-dropzone-icon" />
            </div>
            <h3 className="upload-dropzone-title">Upload Bank Statement</h3>
            <p className="upload-dropzone-subtitle">Upload your CSV or PDF bank statement</p>
            
            <div className="upload-dropzone-divider"></div>
            
            {/* File Type Selectors */}
            <div className="file-type-selectors">
              <div className="file-type-pill file-type-pill-active">
                <FiFileText size={16} />
                <span>CSV</span>
              </div>
              <div className="file-type-pill file-type-pill-active">
                <FiFile size={16} />
                <span>PDF</span>
              </div>
            </div>

            {/* Custom File Input Button */}
            <label
              htmlFor="bank-statement-file"
              className="upload-file-button"
            >
              <FiUpload size={18} />
              <span>Choose File</span>
            </label>
          </div>
            
            <input
              id="bank-statement-file"
              type="file"
              accept=".csv,.pdf"
              onChange={(e) => {
                try {
                const file = e.target.files?.[0] || null
                devLog('File input onChange triggered, file:', file ? file.name : 'null')
                setSelectedFile(file)
                if (file) {
                  devLog('File selected, starting readFile process...')
                  setImportSuccess(false)
                  setImportedCount(0)
                  setShowImportSummary(false)
                  setImportedTransactionsSummary([])
                  setPdfParsedTransactions([])
                  setPdfTransactionsApproved(false)
                  setPdfImportSuccess(false)
                  setPdfImportedCount(0)
                    setPdfLoading(false)
                    setPdfFileContent(null)
                    setPdfProcessingInitiated(false)
                    setPdfError(null)
                  // Call readFile with error handling
                  try {
                    readFile(file)
                    devLog('readFile called successfully')
                  } catch (readError) {
                    console.error('Error calling readFile:', readError)
                    setPdfError(`Failed to read file: ${readError.message || readError}`)
                    setFileLoaded(false)
                    setFileType(null)
                  }
                } else {
                  setFileType(null)
                  setFileLoaded(false)
                  setFileContent(null)
                  setParsedTransactions([])
                  setImportSuccess(false)
                  setImportedCount(0)
                  setShowImportSummary(false)
                  setImportedTransactionsSummary([])
                  setPdfParsedTransactions([])
                  setPdfTransactionsApproved(false)
                  setPdfImportSuccess(false)
                  setPdfImportedCount(0)
                    setPdfLoading(false)
                    setPdfFileContent(null)
                    setPdfProcessingInitiated(false)
                    setPdfError(null)
                  }
                } catch (error) {
                  console.error('Error in file input onChange:', error)
                  console.error('Error stack:', error.stack)
                  setPdfError(`Failed to read file: ${error.message || error}. Please try again.`)
                  setFileLoaded(false)
                  setFileType(null)
                  setFileContent(null)
                  setPdfLoading(false)
                  setPdfProcessingInitiated(false)
                  setSelectedFile(null)
                }
              }}
              style={{
                position: "absolute",
                width: 0,
                height: 0,
                opacity: 0,
                pointerEvents: "none"
              }}
            />

            {/* File Status */}
            {selectedFile && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                backgroundColor: "rgba(244, 162, 97, 0.08)",
                border: "1px solid rgba(244, 162, 97, 0.2)",
                borderRadius: "8px",
                marginTop: "8px"
              }}>
                <FiFile size={18} color="var(--primary)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: "14px", 
                    fontWeight: 500,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {selectedFile.name}
                  </p>
                  {fileLoaded && fileType && (
                    <p style={{ 
                      margin: "4px 0 0 0", 
                      fontSize: "12px", 
                      color: "var(--muted)"
                    }}>
                      Type: {fileType}
                    </p>
                  )}
                </div>
                {fileLoaded && (
                  <FiCheckCircle size={20} color="#10b981" />
                )}
              </div>
            )}

            {/* Process PDF Button - Show when PDF is loaded but not yet processed */}
            {fileType === 'PDF' && fileLoaded && pdfFileContent && !pdfProcessingInitiated && !pdfLoading && !pdfError && (
              <div style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "rgba(244, 162, 97, 0.05)",
                border: "1px solid var(--border)",
                borderRadius: "8px"
              }}>
                <p style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  color: "var(--text)",
                  fontWeight: 500
                }}>
                  PDF file is ready. Click below to extract text and parse transactions.
                </p>
                <button
                  className="btn"
                  type="button"
                  onClick={handleProcessPDF}
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: 600
                  }}
                >
                  Process PDF
                </button>
              </div>
            )}

          {/* Process PDF Button - Show only if processing failed and user wants to retry */}
          {fileType === 'PDF' && fileLoaded && pdfError && !pdfLoading && pdfFileContent && (
              <div style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "rgba(244, 162, 97, 0.05)",
                border: "1px solid var(--border)",
                borderRadius: "8px"
              }}>
                <p style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  color: "var(--text)",
                  fontWeight: 500
                }}>
                  PDF processing failed. Would you like to try again?
                </p>
                <button
                  className="btn"
                  type="button"
                  onClick={handleProcessPDF}
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: 600
                  }}
                >
                  Retry Processing
                </button>
              </div>
            )}

          {/* PDF Processing Status - Show when processing is in progress */}
          {fileType === 'PDF' && pdfLoading && (
              <div style={{
                marginTop: "16px",
                padding: "20px",
                backgroundColor: "rgba(244, 162, 97, 0.05)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{
                  display: "inline-block",
                  width: "24px",
                  height: "24px",
                  border: "3px solid rgba(244, 162, 97, 0.3)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: "12px"
                }} />
                <p style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text)"
                }}>
                  Processing PDF...
                </p>
                <p style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: "var(--muted)"
                }}>
                  Extracting text and parsing transactions
                </p>
              </div>
            )}

          {/* PDF Error Display - Show when processing fails */}
          {fileType === 'PDF' && pdfProcessingInitiated && pdfError && !pdfLoading && (
              <div style={{
                marginTop: "16px",
                padding: "20px",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <FiX size={16} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#ef4444",
                      marginBottom: "4px"
                    }}>
                      Unable to process PDF
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--text)",
                      lineHeight: "1.5"
                    }}>
                      {pdfError}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap"
                }}>
                  <button
                    className="btn"
                    type="button"
                    onClick={handleRetryPDF}
                    style={{
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => {
                      setPdfError(null)
                      setPdfProcessingInitiated(false)
                      setPdfLoading(false)
                      setPdfParsedTransactions([])
                    }}
                    style={{
                      padding: "10px 20px",
                      fontSize: "14px",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      backgroundColor: "transparent"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
          )}
        </section>

        {/* SECTION B: File Preview Card - Only for CSV */}
        {fileLoaded && fileType === 'CSV' && (
          <section className="card col-12 upload-preview-card" style={{
            marginTop: "24px",
            opacity: fileLoaded ? 1 : 0,
            transition: "opacity 0.3s ease"
          }}>
            <h3 style={{ 
              margin: 0, 
              marginBottom: "8px",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text)"
            }}>
              Preview
            </h3>
            <div style={{
              marginTop: "16px",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
              paddingTop: "16px"
            }}>
              
              {/* CSV Preview */}
              {fileLoaded && (
                <div>
                  <h4 style={{
                    margin: 0,
                    marginBottom: "12px",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text)"
                  }}>
                    {parsedTransactions.length > 0 ? 'Detected Transactions' : 'Parsing CSV File...'}
                  </h4>
                  
                  {parsedTransactions.length > 0 ? (
                    <>
                      <p className="muted" style={{ 
                        marginTop: 0,
                        marginBottom: "16px", 
                        fontSize: "13px"
                      }}>
                        Showing first {Math.min(10, parsedTransactions.length)} of {parsedTransactions.length} transactions
                      </p>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ 
                          width: "100%", 
                          borderCollapse: "collapse",
                          fontSize: "14px"
                        }}>
                          <thead>
                            <tr style={{ 
                              borderBottom: "2px solid var(--border)",
                              textAlign: "left"
                            }}>
                              <th style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>Date</th>
                              <th style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>Description</th>
                              <th style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)", fontSize: "13px", textAlign: "right" }}>Amount</th>
                              <th style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedTransactions.slice(0, 10).map((transaction, index) => (
                              <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "12px", fontSize: "13px" }}>{transaction.date || '—'}</td>
                                <td style={{ padding: "12px", fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{transaction.description || '—'}</td>
                                <td style={{ padding: "12px", textAlign: "right", fontSize: "13px", fontWeight: 500 }}>
                                  {transaction.amount !== null && transaction.amount !== 0 
                                    ? `$${Math.abs(transaction.amount).toFixed(2)}` 
                                    : '—'}
                                </td>
                                <td style={{ padding: "12px", textAlign: "center" }}>
                                  <span style={{ 
                                    display: "inline-block",
                                    backgroundColor: "rgba(244, 162, 97, 0.15)",
                                    color: "var(--primary)",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 600
                                  }}>
                                    {transaction.category || 'Other'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "var(--muted)"
                    }}>
                      <div style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        border: "3px solid rgba(244, 162, 97, 0.3)",
                        borderTopColor: "var(--primary)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        marginBottom: "12px"
                      }} />
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        Parsing CSV file...
                      </p>
                      <p style={{ margin: "8px 0 0 0", fontSize: "12px", opacity: 0.7 }}>
                        Extracting transactions from your file
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </section>
        )}


        {/* SECTION C: Correction Mode Card - PDF */}
        {fileType === 'PDF' && pdfParsedTransactions.length > 0 && (
          <section className="card col-12 pdf-correction-card" style={{ marginTop: "24px" }}>
            <h3 style={{ 
              margin: 0, 
              marginBottom: "8px",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text)"
            }}>
              Correct Before Import
            </h3>
            <p className="muted" style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px" }}>
              Edit or delete transactions before importing. Click "Approve All" when ready.
            </p>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxHeight: "500px",
              overflowY: "auto",
              padding: "8px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              backgroundColor: "rgba(244, 162, 97, 0.02)"
            }}>
              {pdfParsedTransactions.map((transaction, index) => (
                <div
                  key={index}
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div className="correction-transaction-row" style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 1fr auto",
                    gap: "12px",
                    alignItems: "center"
                  }}>
                    {/* Date Input */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--muted)",
                        marginBottom: "4px"
                      }}>
                        Date
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={transaction.date || ''}
                        onChange={(e) => handleEditPDFTransaction(index, 'date', e.target.value)}
                        placeholder="MM/DD/YYYY"
                        style={{
                          width: "100%",
                          fontSize: "13px",
                          padding: "6px 10px"
                        }}
                      />
                    </div>

                    {/* Description Input */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--muted)",
                        marginBottom: "4px"
                      }}>
                        Description
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={transaction.description || ''}
                        onChange={(e) => handleEditPDFTransaction(index, 'description', e.target.value)}
                        placeholder="Transaction description"
                        style={{
                          width: "100%",
                          fontSize: "13px",
                          padding: "6px 10px"
                        }}
                      />
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--muted)",
                        marginBottom: "4px"
                      }}>
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={transaction.amount || ''}
                        onChange={(e) => handleEditPDFTransaction(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{
                          width: "100%",
                          fontSize: "13px",
                          padding: "6px 10px"
                        }}
                      />
                    </div>

                    {/* Delete Button */}
                    <div style={{ alignSelf: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => handleDeletePDFTransaction(index)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "8px",
                          color: "#ef4444",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                          borderRadius: "6px",
                          width: "36px",
                          height: "36px"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#dc2626"
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#ef4444"
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--muted)",
                      marginBottom: "4px"
                    }}>
                      Category
                    </label>
                    <select
                      className="input"
                      value={transaction.category || 'Other'}
                      onChange={(e) => handleEditPDFTransaction(index, 'category', e.target.value)}
                      style={{
                        width: "100%",
                        fontSize: "13px",
                        padding: "6px 10px"
                      }}
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Approve All Button */}
            <div style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  setPdfTransactionsApproved(true)
                }}
                disabled={pdfParsedTransactions.length === 0}
                style={{
                  minWidth: "140px",
                  opacity: pdfParsedTransactions.length === 0 ? 0.6 : 1,
                  cursor: pdfParsedTransactions.length === 0 ? "not-allowed" : "pointer"
                }}
              >
                Approve All
              </button>
              <p className="muted" style={{
                margin: 0,
                fontSize: "13px"
              }}>
                {pdfTransactionsApproved 
                  ? "✓ Transactions approved. Ready to import."
                  : "Review and approve transactions before importing."
                }
              </p>
            </div>

            {/* Import PDF Transactions Button */}
            <div style={{ 
              marginTop: "20px", 
              paddingTop: "20px", 
              borderTop: "1px solid var(--border)" 
            }}>
              <button
                className="btn"
                type="button"
                onClick={handleImportPDFTransactions}
                disabled={!pdfTransactionsApproved || pdfParsedTransactions.length === 0}
                style={{
                  marginTop: 0,
                  width: "auto",
                  minWidth: "180px",
                  opacity: (pdfTransactionsApproved && pdfParsedTransactions.length > 0) ? 1 : 0.6,
                  cursor: (pdfTransactionsApproved && pdfParsedTransactions.length > 0) ? "pointer" : "not-allowed"
                }}
              >
                Import PDF Transactions
              </button>
            </div>
          </section>
        )}

        {/* PDF Import Success Message */}
        {pdfImportSuccess && (
          <section className="card col-12 pdf-import-success-card">
            <div style={{ 
              padding: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <div style={{ 
                fontSize: "20px",
                color: "#10b981"
              }}>
                ✓
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: "14px", 
                  color: "#10b981",
                  fontWeight: 500,
                  marginBottom: "4px"
                }}>
                  PDF transactions imported successfully.
                </p>
                {pdfImportedCount > 0 && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: "12px", 
                    color: "var(--muted)"
                  }}>
                    {pdfImportedCount} {pdfImportedCount === 1 ? 'transaction' : 'transactions'} added to your spending records.
                  </p>
                )}
                {pdfImportedCount === 0 && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: "12px", 
                    color: "var(--muted)"
                  }}>
                    All transactions were duplicates and were skipped.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPdfImportSuccess(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "18px",
                  lineHeight: 1,
                  borderRadius: "4px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)"
                  e.currentTarget.style.color = "var(--text)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "var(--muted)"
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </section>
        )}

        {/* CSV Transaction Preview */}
        {fileType === 'CSV' && parsedTransactions.length > 0 && (
          <section className="card col-12 csv-preview-card">
            <h3>Transaction Preview</h3>
            <p className="muted" style={{ marginTop: "4px", marginBottom: "16px", fontSize: "13px" }}>
              Showing first {Math.min(5, parsedTransactions.length)} of {parsedTransactions.length} transactions
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: "2px solid var(--border)",
                    textAlign: "left"
                  }}>
                    <th style={{ 
                      padding: "10px 12px", 
                      fontWeight: 600, 
                      color: "var(--text)",
                      fontSize: "13px"
                    }}>
                      Date
                    </th>
                    <th style={{ 
                      padding: "10px 12px", 
                      fontWeight: 600, 
                      color: "var(--text)",
                      fontSize: "13px"
                    }}>
                      Description
                    </th>
                    <th style={{ 
                      padding: "10px 12px", 
                      fontWeight: 600, 
                      color: "var(--text)",
                      fontSize: "13px",
                      textAlign: "right"
                    }}>
                      Amount
                    </th>
                    <th style={{ 
                      padding: "10px 12px", 
                      fontWeight: 600, 
                      color: "var(--text)",
                      fontSize: "13px"
                    }}>
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.slice(0, 5).map((transaction, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: "1px solid var(--border)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(244, 162, 97, 0.05)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <td style={{ 
                        padding: "12px", 
                        color: "var(--text)",
                        fontSize: "13px"
                      }}>
                        {transaction.date || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                      </td>
                      <td style={{ 
                        padding: "12px", 
                        color: "var(--text)",
                        fontSize: "13px"
                      }}>
                        {transaction.description || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                      </td>
                      <td style={{ 
                        padding: "12px", 
                        textAlign: "right",
                        color: transaction.amount !== 0 ? "var(--text)" : "var(--muted)",
                        fontSize: "13px",
                        fontWeight: transaction.amount !== 0 ? 500 : 400
                      }}>
                        {transaction.amount !== null && transaction.amount !== 0 
                          ? `$${transaction.amount.toFixed(2)}` 
                          : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                      </td>
                      <td style={{ 
                        padding: "12px", 
                        color: "var(--text)",
                        fontSize: "13px"
                      }}>
                        {transaction.category || 'Other'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedTransactions.length > 5 && (
              <p style={{ 
                marginTop: "12px", 
                marginBottom: 0,
                fontSize: "12px", 
                color: "var(--muted)",
                fontStyle: "italic"
              }}>
                ... and {parsedTransactions.length - 5} more transactions
              </p>
            )}
            
            {/* Review and Import Section */}
            <div style={{ 
              marginTop: "24px", 
              paddingTop: "20px", 
              borderTop: "1px solid var(--border)" 
            }}>
              <p className="muted" style={{ 
                marginBottom: "16px", 
                fontSize: "13px",
                lineHeight: "1.5"
              }}>
                Review the data above and click Import to add these transactions to your spending records.
              </p>
              <button
                className="btn"
                type="button"
                onClick={handleImportTransactions}
                style={{
                  marginTop: 0,
                  width: "auto",
                  minWidth: "160px"
                }}
              >
                Import Transactions
              </button>
            </div>
          </section>
        )}

        {/* Import Success Message */}
        {importSuccess && (
          <section className="card col-12 import-success-card">
            <div style={{ 
              padding: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <div style={{ 
                fontSize: "20px",
                color: "#10b981"
              }}>
                ✓
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: "14px", 
                  color: "#10b981",
                  fontWeight: 500,
                  marginBottom: "4px"
                }}>
                  Transactions imported successfully.
                </p>
                {importedCount > 0 && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: "12px", 
                    color: "var(--muted)"
                  }}>
                    {importedCount} {importedCount === 1 ? 'transaction' : 'transactions'} added to your spending records.
                  </p>
                )}
                {importedCount === 0 && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: "12px", 
                    color: "var(--muted)"
                  }}>
                    All transactions were duplicates and were skipped.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setImportSuccess(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "18px",
                  lineHeight: 1,
                  borderRadius: "4px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)"
                  e.currentTarget.style.color = "var(--text)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "var(--muted)"
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </section>
        )}

        {/* Upload History Section */}
        {uploadHistory.length > 0 && (
          <section className="card col-12 upload-history-card" style={{ marginTop: "40px" }}>
            <h3 className="chart-title">Upload History</h3>
            <p className="muted upload-history-subtitle">Recent file uploads and imports</p>
            
            <div className="upload-history-list upload-history-timeline">
              {uploadHistory.map((entry, index) => {
                const date = new Date(entry.timestamp)
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
                const formattedTime = date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
                
                // File type icon
                const FileIcon = entry.fileType === 'CSV' ? FiFileText : FiFile
                
                return (
                  <div
                    key={entry.id}
                    className={`upload-history-item upload-history-timeline-item ${index < uploadHistory.length - 1 ? 'upload-history-item-border' : ''}`}
                  >
                    <div className="upload-history-timeline-line"></div>
                    <div className="upload-history-icon-small">
                      <FileIcon size={20} />
                    </div>
                    <span className="upload-history-type-inline">{entry.fileType}</span>
                    <span className="upload-history-divider">•</span>
                    <span className="upload-history-date-inline">{formattedDate} at {formattedTime}</span>
                    <span className="upload-history-divider">•</span>
                        {entry.importedCount === 0 ? (
                      <span className="upload-history-empty">No transactions imported</span>
                    ) : (
                      <span className="upload-history-count-inline">{entry.importedCount} {entry.importedCount === 1 ? 'transaction' : 'transactions'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Imported Transactions Summary */}
        {showImportSummary && importedTransactionsSummary.length > 0 && (
          <section className="card col-12 import-summary-card">
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start",
              marginBottom: "16px"
            }}>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  marginBottom: "4px",
                  fontSize: "20px",
                  fontWeight: 600
                }}>
                  Imported Transactions Summary
                </h3>
                <p className="muted" style={{ 
                  margin: 0,
                  fontSize: "13px"
                }}>
                  You have imported {importedTransactionsSummary.length} {importedTransactionsSummary.length === 1 ? 'new transaction' : 'new transactions'}.
                </p>
              </div>
            </div>

            <div style={{ 
              maxHeight: "400px",
              overflowY: "auto",
              marginBottom: "16px"
            }}>
              <div style={{ 
                display: "grid",
                gap: "12px"
              }}>
                {importedTransactionsSummary.slice(0, 10).map((transaction, index) => (
                  <div 
                    key={transaction.id || index}
                    className="import-summary-item"
                    style={{
                      padding: "12px",
                      backgroundColor: "rgba(244, 162, 97, 0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr auto auto",
                      gap: "12px",
                      alignItems: "center",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(244, 162, 97, 0.1)"
                      e.currentTarget.style.borderColor = "var(--primary)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(244, 162, 97, 0.05)"
                      e.currentTarget.style.borderColor = "var(--border)"
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "var(--text)" }}>
                      {transaction.date ? (
                        new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      ) : (
                        <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: "13px", 
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {transaction.note || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                    </div>
                    <div style={{ 
                      fontSize: "13px", 
                      fontWeight: 500,
                      color: transaction.amount !== 0 ? "var(--text)" : "var(--muted)",
                      textAlign: "right"
                    }}>
                      {transaction.amount !== null && transaction.amount !== 0 
                        ? `$${transaction.amount.toFixed(2)}` 
                        : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                    </div>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "var(--primary)",
                      backgroundColor: "rgba(244, 162, 97, 0.15)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      textAlign: "center",
                      fontWeight: 500,
                      whiteSpace: "nowrap"
                    }}>
                      {transaction.category || 'Other'}
                    </div>
                  </div>
                ))}
              </div>
              {importedTransactionsSummary.length > 10 && (
                <p style={{ 
                  marginTop: "12px", 
                  marginBottom: 0,
                  fontSize: "12px", 
                  color: "var(--muted)",
                  fontStyle: "italic",
                  textAlign: "center"
                }}>
                  ... and {importedTransactionsSummary.length - 10} more transactions (showing first 10)
                </p>
              )}
            </div>

            <div style={{ 
              display: "flex", 
              justifyContent: "center",
              paddingTop: "12px",
              borderTop: "1px solid var(--border)"
            }}>
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  setShowImportSummary(false)
                  setImportedTransactionsSummary([])
                }}
                style={{
                  marginTop: 0,
                  width: "auto",
                  minWidth: "120px",
                  padding: "8px 16px",
                  fontSize: "14px"
                }}
              >
                Hide Summary
              </button>
            </div>
          </section>
        )}

        <section className="card col-12 recent-table-card" ref={recentTableRef} style={{ marginTop: "40px" }}>
          <div className="recent-table-header">
            <h3 className="chart-title">Recent Transactions</h3>
            {filterCardName && (
              <button
                onClick={() => setFilterCardName("")}
                className="btn secondary clear-filter-btn"
              >
                Clear card filter
              </button>
            )}
          </div>
          
          {/* Filters */}
          {expenses.length > 0 && (
            <div className="expense-filters">
              <div className="filter-select-wrapper">
                <FiFilter className="filter-icon" />
              <select 
                className="input filter-select" 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              </div>
              
              <div className="filter-select-wrapper">
                <FiCalendar className="filter-icon" />
              <select 
                className="input filter-select" 
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              </div>
              
              <div className="filtered-total">
                <span className="filtered-total-label">Filtered total:</span>
                <span className="filtered-total-value">${filteredTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {expenses.length === 0 ? (
            <p className="muted" style={{ marginTop: "0.25rem" }}>No expenses yet.</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="muted" style={{ marginTop: "0.25rem" }}>No expenses match the selected filters.</p>
          ) : (
            <div className="table-container">
              <table className="expenses-table">
              <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                    <th>Note</th>
                    <th style={{ width: "50px" }}></th>
                  </tr>
              </thead>
              <tbody>
                  {filteredExpenses.map((e) => {
                    const categoryColors = {
                      'Travel': '#F4A261',
                      'Food': '#10b981',
                      'Bills': '#3B82F6',
                      'Shopping': '#8B5CF6',
                      'Income': '#14B8A6',
                      'Other': '#6b7280',
                      'Uncategorized': '#6b7280',
                      'Entertainment': '#EC4899',
                      'Health': '#EF4444',
                      'Miscellaneous': '#6b7280'
                    }
                    const categoryColor = categoryColors[e.category] || categoryColors['Other']
                    const amount = Number(e.amount)
                    const isIncome = e.category === 'Income'
                    const isExpense = !isIncome && amount > 0
                    
                    return (
                    <tr 
                      key={e.id}
                      className="expense-row"
                      onClick={() => setSelectedExpense(e)}
                    >
                      <td>
                        {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                          <div className="expense-category-cell">
                            <span className="expense-category-dot" style={{ backgroundColor: categoryColor }}></span>
                        {e.category || "Uncategorized"}
                          </div>
                      </td>
                        <td className={`text-right amount-cell ${isIncome ? 'amount-income' : isExpense ? 'amount-expense' : ''}`}>
                          ${amount.toFixed(2)}
                      </td>
                      <td className="note-cell">
                        {e.note || <span className="muted-text">—</span>}
                      </td>
                      <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={()=>del(e.id)}
                          type="button"
                            className="expense-delete-btn"
                          title="Delete expense"
                          aria-label="Delete expense"
                        >
                            <FiTrash2 size={14} />
                        </button>
                      </td>
                  </tr>
                    )
                  })}
              </tbody>
            </table>
            </div>
          )}
        </section>

        {/* Expense Detail Modal */}
        {selectedExpense && (
          <div className="expense-modal-overlay" onClick={() => setSelectedExpense(null)}>
            <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
              <div className="expense-modal-header">
                <h3 style={{ margin: 0 }}>Expense Details</h3>
                <button 
                  className="expense-modal-close"
                  onClick={() => setSelectedExpense(null)}
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="expense-modal-content">
                <div className="expense-detail-item">
                  <span className="expense-detail-label">Amount</span>
                  <span className="expense-detail-value">${Number(selectedExpense.amount).toFixed(2)}</span>
                </div>
                <div className="expense-detail-item">
                  <span className="expense-detail-label">Category</span>
                  <span className="expense-detail-value">{selectedExpense.category || "Uncategorized"}</span>
                </div>
                <div className="expense-detail-item">
                  <span className="expense-detail-label">Date</span>
                  <span className="expense-detail-value">
                    {new Date(selectedExpense.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="expense-detail-item">
                  <span className="expense-detail-label">Note</span>
                  <span className="expense-detail-value">
                    {selectedExpense.note || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>No note</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <CreditCardTracker 
          expenses={expenses}
          onFilterByCard={handleFilterByCard}
          scrollToTable={scrollToTable}
        />
      </div>
    </div>
  )
}

