# GHSS KARAI AI - Project Documentation

## Overview
Educational AI tutor website with Google OAuth authentication and AI-powered tutoring. Built with React + TypeScript + Vite frontend and Express serverless backend for Netlify deployment.

## Recent Changes (Nov 9, 2025)

### Major Update: Integrated Gemini AI Directly
- ✅ **No separate backend needed** - Gemini AI now runs in the same project
- ✅ Added `@google/generative-ai` package for direct API calls
- ✅ Educational system prompt built-in for better tutoring
- ✅ Simplified deployment - just add Gemini API key to Netlify

### Security Fixes
- ✅ Fixed critical Google OAuth token validation (audience & issuer checks)
- ✅ Removed hardcoded SESSION_SECRET fallbacks
- ✅ All authentication routes now require proper configuration

### Other Fixes
- ✅ Fixed authentication hook scoping bug
- ✅ Updated build configuration for pnpm
- ✅ Improved Netlify serverless functions configuration
- ✅ Comprehensive documentation added

See `FIXES_APPLIED.md` for complete list of 8 fixes applied.

## Project Architecture

### Frontend (React + Vite)
- **Framework**: React 18 + TypeScript + Vite 7
- **Styling**: TailwindCSS 3 + Radix UI components
- **Routing**: React Router 6 (SPA mode)
- **State**: React Query + Context API
- **Auth**: Google Identity Services (client-side OAuth)

### Backend (Express Serverless)
- **Runtime**: Express 5 on Netlify Functions
- **Auth**: JWT-based sessions with Google OAuth validation (7-day expiration)
- **AI**: Direct Gemini API integration (no external backend)
- **AI Model**: Google Gemini 2.0 Flash Exp (configurable)
- **Rate Limiting**: In-memory (20 requests/day per user)
- **Cookies**: httpOnly, secure in production
- **Security**: Audience validation, issuer validation, required secrets

### Key Routes
- `GET /` - Homepage
- `GET /tutor` - AI chat interface
- `POST /api/auth/login` - Google OAuth login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/generate` - AI generation (protected)

## Deployment

### Netlify (Production)
- **Build**: `pnpm install && pnpm build`
- **Publish**: `dist/spa`
- **Functions**: `netlify/functions`
- **Docs**: See `NETLIFY_SETUP.md` and `DEPLOYMENT_CHECKLIST.md`

### Required Environment Variables
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID (for both client AND server validation)
- `SESSION_SECRET` - JWT signing secret (32+ chars, NO fallback allowed)
- `GOOGLE_GEMINI_API_KEY` - Gemini API key for AI tutoring
- `NODE_ENV=production`

### Optional Environment Variables
- `GEMINI_MODEL` - Model to use (defaults to `gemini-2.0-flash-exp`)
- `MAX_DAILY_REQUESTS` - Rate limit (defaults to 20)
- `ALLOWED_ORIGIN` - CORS origin (defaults to `*`)

## User Preferences
- Package manager: pnpm
- Deployment target: Netlify
- Auth provider: Google OAuth
- AI service: External (Gemini via Render)

## Development Commands
```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev server (port 5000)
pnpm build        # Build for production
pnpm typecheck    # Run TypeScript checks
pnpm test         # Run tests
```

## Security Features
- httpOnly cookies prevent XSS
- JWT tokens with expiration
- Server-side authentication
- Rate limiting per user
- CORS configuration
- Token verification with Google

## Known Limitations
- Rate limiting is in-memory (resets on function cold-start)
- No conversation history persistence
- SQLite database code included but not currently used
- Gemini API key required (free tier available)

## Documentation Files
- `README.md` - Project overview
- `NETLIFY_SETUP.md` - Complete Netlify deployment guide
- `FIXES_APPLIED.md` - All fixes applied for deployment
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `AGENTS.md` - Architecture notes for agents

## Tech Stack Details
- **Frontend**: React 18, Vite 7, TypeScript 5, TailwindCSS 3
- **UI Components**: Radix UI, Lucide Icons, Framer Motion
- **Backend**: Express 5, serverless-http
- **Auth**: jsonwebtoken, Google Identity Services
- **Build**: pnpm, esbuild (via Netlify)
- **Deployment**: Netlify (frontend + functions)
