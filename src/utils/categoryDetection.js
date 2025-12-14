// Auto-categorize transactions based on description
export const categorizeTransaction = (description) => {
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

