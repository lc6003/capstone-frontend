# Performance Optimization Tips

## Why It Might Be Slow

### 1. **First Load After npm install**
- **276MB** of dependencies need to be processed
- Vite needs to pre-bundle dependencies on first run
- This is **normal** and only happens once

### 2. **Heavy Dependencies**
- `tesseract.js` (~10MB) - OCR library
- `pdfjs-dist` (~5MB) - PDF parsing
- `recharts` - Chart library
- These are loaded when needed, not all at once

### 3. **Development Mode**
- Vite dev server compiles on-demand
- First page load is slower than production build
- Subsequent navigations are faster (HMR)

## Quick Fixes

### Option 1: Wait for Initial Build
The first load after `npm install` takes longer. Subsequent loads are faster.

### Option 2: Optimize Vite Config (Optional)
Add optimization settings to `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['tesseract.js'] // Load on-demand
  },
})
```

### Option 3: Check Browser Console
Open browser DevTools (F12) and check:
- Network tab: See what's loading slowly
- Console: Check for errors
- Performance tab: See what's blocking

## Expected Load Times

- **First load after npm install**: 10-30 seconds (normal)
- **Subsequent loads**: 2-5 seconds
- **Page navigation**: < 1 second (with HMR)

## If Still Slow

1. **Check your internet connection** (for CDN resources)
2. **Close other heavy applications**
3. **Check browser extensions** (ad blockers can slow dev server)
4. **Try a different browser** (Chrome/Edge usually fastest)

## Production Build

For production, build optimized version:
```bash
npm run build
npm run preview
```

This creates optimized bundles that load much faster.



