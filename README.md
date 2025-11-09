# GHSS KARAI AI

A complete educational AI tutor website built with React + TypeScript + Vite, TailwindCSS, and an Express backend powered by Google Gemini 2.0 Flash Exp.

## 🚀 Quick Deploy to Netlify

**All deployment issues have been fixed!** See `NETLIFY_SETUP.md` and `FIXES_APPLIED.md` for details.

Required Netlify environment variables:
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `SESSION_SECRET` - Secret for JWT signing (generate random 32+ char string)
- `NODE_ENV=production`

Optional:
- `SCHOOLAI_API_URL` - Your AI backend URL (defaults to https://schoolai-server.onrender.com)

## Tech Stack

- Frontend: React + TypeScript + Vite + TailwindCSS
- Icons: lucide-react
- Backend: External Express.js API hosted on Render (or your choice)
- AI: Google Gemini 2.0 Flash Exp API (use your Render backend)
- Deployment: Netlify (frontend) + Render (backend) — or use only Render for both

Note: This repository previously included an embedded Express server for development. You indicated you have an external API at https://schoolai-server.onrender.com; the app is now configured to use that external API by default in the Tutor page. The local Express middleware has been removed from the Vite dev server to avoid conflicts.

## Quick Start (Local)

1. Install dependencies
   - pnpm install
2. Create a `.env` file (see `.env.example`)
3. Run dev server (Vite + Express)
   - pnpm dev
4. Open http://localhost:8080

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

Frontend:

- VITE_GOOGLE_CLIENT_ID: Google OAuth client ID (Web application)
- VITE_API_BASE_URL: Base URL for backend API (e.g. your Render URL), leave empty for local dev

Backend:

- GOOGLE_GEMINI_API_KEY: Gemini API key
- ALLOWED_ORIGIN or NETLIFY_SITE_URL: Frontend origin for CORS (e.g. https://your-site.netlify.app)
- GEMINI_MODEL (optional): defaults to `gemini-2.0-flash-exp`

## Features

- Modern gradient hero with school branding
- AI Tutor page: real-time chat, Markdown rendering, request limit (20/day), progress bar, example prompts, timestamps, loading animations, error handling, mobile responsive
- Google OAuth login via Google Identity Services (client-side), persistent via localStorage
- Sidebar: New Chat, usage progress, account section, settings placeholder
- Accessible, responsive, glass morphism UI

## API

- GET `/` — Health check
- POST `/api/generate` — Body: `{ prompt: string }` → `{ text, usage {remaining,limit}, timestamp }`
  - Server-side in-memory IP rate limit: 20 requests/day (demonstration)

## Deployment

### Frontend (Netlify)

- Build command: `npm run build:client`
- Publish directory: `dist/spa`
- SPA routing: handled by `netlify.toml`
- Set environment variables in Netlify UI: `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE_URL` (Render backend URL)

### Backend (Render)

- Create a new Web Service pointing to this repo’s `server` build with `pnpm build:server` or use the provided Node build file
- Runtime: Node 22
- Set env vars: `GOOGLE_GEMINI_API_KEY`, `ALLOWED_ORIGIN` (your Netlify domain)
- Health check path: `/`

## Notes

- Daily request reset uses UTC day and persists per user in localStorage.
- For production, prefer server-side rate limits and persistence.

## Scripts

- pnpm dev — Vite + Express (single-port dev)
- pnpm build — Build client + server
- pnpm start — Run built server (Express)
- pnpm typecheck — TypeScript
- pnpm test — Vitest
