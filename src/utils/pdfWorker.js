import * as pdfjsLib from "pdfjs-dist"
import { devLog, devWarn } from "./devLog.js"

// Configure PDF.js worker - use CDN URLs that work reliably
// PDF.js v5.x uses .mjs files
export const configurePDFWorker = () => {
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

