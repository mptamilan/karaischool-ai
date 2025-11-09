# GHSS KARAI AI

A complete educational AI tutor website built with React + TypeScript + Vite, TailwindCSS, and Express serverless backend powered by Google Gemini 2.0 Flash Exp.

## 🚀 Quick Deploy to Netlify

**All deployment issues have been fixed! Gemini AI is now integrated directly - no separate backend needed!**

See `NETLIFY_SETUP.md` and `FIXES_APPLIED.md` for details.

Required Netlify environment variables:
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `SESSION_SECRET` - Secret for JWT signing (generate random 32+ char string)
- `GOOGLE_GEMINI_API_KEY` - Your Gemini API key
- `NODE_ENV=production`

## Tech Stack

- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Express.js serverless functions (Netlify)
- AI: Google Gemini 2.0 Flash Exp API (integrated directly)
- Icons: lucide-react
- Deployment: Netlify (single deployment for everything)

## Quick Start (Local)

1. Install dependencies
   ```bash
   pnpm install
   ```

2. Create a `.env` file (see `.env.example`)
   ```bash
   cp .env.example .env
   # Edit .env and add your keys
   ```

3. Run dev server
   ```bash
   pnpm dev
   ```

4. Open http://localhost:5000

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

### Required:

- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (Web application)
- `SESSION_SECRET` - Secure random secret for JWT signing (32+ chars)
- `GOOGLE_GEMINI_API_KEY` - Gemini API key for AI tutoring
- `NODE_ENV` - Set to `production` for Netlify

### Optional:

- `GEMINI_MODEL` - Gemini model to use (defaults to `gemini-2.0-flash-exp`)
- `MAX_DAILY_REQUESTS` - Daily limit per user (defaults to `20`)
- `ALLOWED_ORIGIN` - Frontend origin for CORS (defaults to `*`)

## Features

- Modern gradient hero with school branding
- **AI Tutor powered by Google Gemini**: real-time chat, Markdown rendering, educational system prompt, request limit (20/day)
- **Secure Google OAuth** login with JWT cookies and server-side validation
- Session persistence across page reloads
- Sidebar: New Chat, usage progress, account section
- Progress bar showing remaining daily requests
- Example prompts for quick start
- Timestamps on all messages
- Loading animations and error handling
- Fully responsive, mobile-first design
- Accessible UI with glass morphism effects

## API Endpoints

- `GET /` — Health check
- `POST /api/auth/login` — Google OAuth login (validates ID token with audience & issuer checks)
- `POST /api/auth/logout` — Clear session
- `GET /api/auth/me` — Get current user from JWT
- `POST /api/generate` — AI tutoring endpoint (requires authentication)
  - Body: `{ prompt: string }`
  - Response: `{ text, usage: {remaining, limit}, timestamp }`
  - Rate limit: 20 requests/day per user (in-memory, resets on cold start)

## Deployment (Netlify)

**Complete guides**: See `NETLIFY_SETUP.md` and `DEPLOYMENT_CHECKLIST.md`

### Quick Setup:

1. Push code to GitHub

2. Connect repository to Netlify

3. Set environment variables in Netlify dashboard:
   - `VITE_GOOGLE_CLIENT_ID`
   - `SESSION_SECRET`
   - `GOOGLE_GEMINI_API_KEY`
   - `NODE_ENV=production`

4. Deploy!

Everything runs as serverless functions on Netlify - no separate backend server needed.

## Security

- Google ID token validation (audience & issuer checks)
- JWT-based sessions with httpOnly cookies
- Secure cookies in production (sameSite=none)
- No hardcoded secrets (all required via env vars)
- Server-side rate limiting
- Cookie and header-based authentication

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (port 5000)
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Type checking
pnpm typecheck

# Run tests
pnpm test
```

## Documentation

- `README.md` - This file
- `NETLIFY_SETUP.md` - Complete Netlify deployment guide
- `FIXES_APPLIED.md` - All fixes applied (8 major issues resolved)
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment checklist
- `AGENTS.md` - Architecture notes
- `replit.md` - Project documentation

## Notes

- Rate limiting is in-memory and resets when Netlify functions cold-start
- For persistent rate limiting, consider using a database or Netlify KV
- Daily request reset uses UTC day
- Session expires after 7 days

## License

See LICENSE file
