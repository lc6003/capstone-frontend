# Debugging White Page Issue

## Common Causes:

1. **JavaScript Error** - Check browser console (F12)
2. **i18n Not Initialized** - Translation system blocking render
3. **Missing Component** - Import error
4. **CSS Issue** - Content hidden (unlikely for white page)

## Quick Fixes:

### Step 1: Check Browser Console
Open DevTools (F12) and check:
- **Console tab**: Look for red errors
- **Network tab**: Check if files are loading (200 status)
- **Elements tab**: Check if `<div id="root">` has content

### Step 2: Common Errors to Look For:

**If you see:**
- `Cannot read property 't' of undefined` → i18n issue
- `Module not found` → Import error
- `Unexpected token` → Syntax error
- `Failed to fetch` → Network/CORS issue

### Step 3: Temporary Fix - Disable i18n (for testing)

If i18n is blocking, we can temporarily disable it to see if that's the issue.



