# GHSS KARAI AI - Project Documentation

## Overview
Educational AI tutor website with Google OAuth authentication and AI-powered tutoring. Built with React + TypeScript + Vite frontend and Express serverless backend for Netlify deployment.

## Recent Changes (Nov 9, 2025)
Fixed all Netlify deployment issues:
- Authentication (Google OAuth login/logout)
- API serverless functions
- AI generation endpoint
- Build configuration
- Environment variable setup

See `FIXES_APPLIED.md` for complete list of fixes.

## Project Architecture

### Frontend (React + Vite)
- **Framework**: React 18 + TypeScript + Vite 7
- **Styling**: TailwindCSS 3 + Radix UI components
- **Routing**: React Router 6 (SPA mode)
- **State**: React Query + Context API
- **Auth**: Google Identity Services (client-side OAuth)

### Backend (Express Serverless)
- **Runtime**: Express 5 on Netlify Functions
- **Auth**: JWT-based sessions (7-day expiration)
- **AI**: Proxies to external Gemini API service
- **Rate Limiting**: In-memory (20 requests/day per user)
- **Cookies**: httpOnly, secure in production

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
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `SESSION_SECRET` - JWT signing secret (32+ chars)
- `NODE_ENV=production`
- `SCHOOLAI_API_URL` - AI backend URL (optional)

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
- SQLite database included but not currently used
- External AI service dependency

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
