import { useState, useEffect } from "react"
import { FiTrash2, FiCreditCard, FiTrendingUp } from "react-icons/fi"
// Note: This component uses storage functions that may need to be adapted
// to work with the frontend-main storage system
// import { getUserCreditCards, addUserCreditCard, removeUserCreditCard } from "../../lib/storage.js"

// This component is extracted but NOT YET INTEGRATED
// It will be integrated in a future push

function CreditCardTracker({ expenses, onFilterByCard, scrollToTable }) {
  // Note: These storage functions need to be imported from the appropriate storage module
  // For now, this is a placeholder that will be connected in a future push
  const getUserCreditCards = () => []
  const addUserCreditCard = (card) => []
  const removeUserCreditCard = (id) => []

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

export default CreditCardTracker

