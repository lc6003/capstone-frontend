import { devLog, devWarn } from "./devLog.js"

// File type detection - only CSV and PDF
export const detectFileType = (fileName, fileType) => {
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

