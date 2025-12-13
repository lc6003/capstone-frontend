# Cashvelo - Merged Frontend

This is the fully merged frontend project combining features from both `capstone-frontend` and `capstone-frontend-Brand`.

## Features

### From capstone-frontend:
- Mobile bottom navigation
- Questionnaire page
- Upload history tracking
- User credit cards functionality
- Advanced expense management
- Income event dispatching

### From capstone-frontend-Brand:
- Cash Stuffing feature with visual envelopes
- Wallet and Binder components
- Envelope page with animations
- Cash allocation management
- Framer Motion animations

### Merged Features:
- Internationalization (i18n) support (English/Spanish)
- Language switcher component
- Settings page for user profile management
- API integration layer
- Combined storage utilities

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

- `/src/pages` - All page components from both projects
- `/src/components` - Shared components (ThemeToggle, MobileBottomNav, LanguageSwitcher)
- `/src/CashStuffingFeature` - Cash stuffing feature components
- `/src/lib` - Utility libraries (storage.js, cashSync.js, api.js)
- `/src/styles` - All stylesheets from both projects
- `/src/locales` - i18n translation files
- `/public` - Static assets from both projects




