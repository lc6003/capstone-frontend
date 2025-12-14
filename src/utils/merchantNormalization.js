// Merchant normalization map for cleaning up messy merchant names
export const merchantNormalizationMap = {
  "STARBUCKS": "Starbucks",
  "UBER": "Uber",
  "UBER *TRIP": "Uber",
  "AMZN": "Amazon",
  "AMAZON MKTPLACE": "Amazon",
  "MCDONALDS": "McDonald's"
}

// Function to normalize merchant names using the map
export const normalizeMerchant = (name) => {
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

