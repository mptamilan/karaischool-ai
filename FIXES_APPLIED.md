# Fixes Applied for Netlify Deployment

## Summary
This document outlines all the fixes applied to resolve Netlify deployment issues including API function errors, Google authentication, and AI generation problems.

## Issues Fixed

### 1. **Build Command Mismatch** ✅
**Problem**: `netlify.toml` was using `npm run build` but the project uses `pnpm` as the package manager.

**Fix**: Updated `netlify.toml`:
```toml
[build]
  command = "pnpm install && pnpm build"
```

### 2. **Netlify Functions Configuration** ✅
**Problem**: Missing timeout configuration for AI requests and function includes.

**Fix**: Added proper function configuration in `netlify.toml`:
```toml
[functions]
  node_bundler = "esbuild"
  included_files = ["dist/server/**"]
  
[functions.api]
  timeout = 26  # Maximum timeout for Netlify functions
```

### 3. **Authentication Hook Scoping Error** ✅
**Problem**: `fetchWithFallback` helper function was defined inside `handleCredential` but was being used in the `init` effect, causing a reference error.

**Fix**: Moved `fetchWithFallback` to module scope as a proper `useCallback` hook in `client/hooks/auth.tsx`:
```typescript
const fetchWithFallback = useCallback(async (input: string, init?: RequestInit) => {
  // ... implementation
}, []);
```

Updated dependencies in both `handleCredential` and the `init` effect to include `fetchWithFallback`.

### 4. **Duplicate Import Statement** ✅
**Problem**: `server/index.ts` had duplicate `import "dotenv/config";` statements.

**Fix**: Removed duplicate import.

### 5. **Critical Security Flaw: Missing Token Audience Validation** ✅
**Problem**: The Google ID token validation in `server/routes/auth.ts` didn't verify the `aud` (audience) claim, allowing attackers to use tokens from their own Google OAuth clients to impersonate users.

**Fix**: Added critical security validation to `handleLogin`:
```typescript
// Verify audience matches our client ID
const expectedClientId = process.env.VITE_GOOGLE_CLIENT_ID;
if (info.aud !== expectedClientId) {
  return res.status(401).json({ 
    error: "Invalid token audience",
    details: "Token was not issued for this application"
  });
}

// Verify issuer is Google
if (info.iss !== "https://accounts.google.com" && info.iss !== "accounts.google.com") {
  return res.status(401).json({ error: "Invalid token issuer" });
}
```

**CRITICAL**: `VITE_GOOGLE_CLIENT_ID` MUST be set in Netlify environment variables for authentication to work securely.

### 6. **Critical Security Flaw: Hardcoded SESSION_SECRET Fallback** ✅
**Problem**: All authentication routes fell back to a hardcoded "dev-secret" when `SESSION_SECRET` was not set, enabling trivial JWT forgery in misconfigured deployments.

**Fix**: Removed all fallbacks and now require `SESSION_SECRET` to be explicitly set:
```typescript
const secret = process.env.SESSION_SECRET;
if (!secret) {
  return res.status(500).json({ 
    error: "SESSION_SECRET not configured",
    details: "Set SESSION_SECRET in your environment variables"
  });
}
```

Applied to:
- `server/routes/auth.ts` (handleLogin, handleMe)
- `server/routes/generate.ts` (handleGenerate)
- `server/routes/devAuth.ts` (handleDevLogin)

**CRITICAL**: `SESSION_SECRET` MUST be set in Netlify environment variables AND in local .env for development.

### 7. **Missing Environment Variable Documentation** ✅
**Problem**: No clear documentation on required Netlify environment variables.

**Fix**: Created comprehensive `NETLIFY_SETUP.md` with:
- Required environment variables and how to obtain them
- Google OAuth setup instructions
- Deployment steps
- Common issues and solutions
- Local testing guide

## Files Modified

1. **netlify.toml**
   - Updated build command to use `pnpm`
   - Added function timeout configuration
   - Added included_files for server dist

2. **client/hooks/auth.tsx**
   - Fixed `fetchWithFallback` scoping issue
   - Updated useEffect dependencies

3. **server/index.ts**
   - Removed duplicate dotenv import

4. **vite.config.ts** (for local development)
   - Updated to use port 5000
   - Changed host to 0.0.0.0
   - Added HMR client port configuration

## New Documentation Files

1. **NETLIFY_SETUP.md** - Complete Netlify deployment guide
2. **FIXES_APPLIED.md** - This file, documenting all fixes

## Required Netlify Environment Variables

Set these in your Netlify dashboard before deploying:

### Critical (Required)
- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `SESSION_SECRET` - Random secret for JWT signing (32+ chars)
- `NODE_ENV` - Set to `production`

### Optional
- `SCHOOLAI_API_URL` or `VITE_AI_API_URL` - Your AI backend URL (defaults to https://schoolai-server.onrender.com)
- `MAX_DAILY_REQUESTS` - Daily limit per user (defaults to 20)
- `ALLOWED_ORIGIN` - For CORS (defaults to `*`)

## How the Authentication Works Now

1. **Client-side**:
   - Google Sign-In button triggers Google OAuth
   - Receives ID token from Google
   - Sends ID token to `/api/auth/login`

2. **Server-side** (`/api/auth/login`):
   - Verifies ID token with Google's tokeninfo endpoint
   - Creates a JWT with user info (sub, name, email, picture)
   - Sets httpOnly cookie (`ghss_token`) with 7-day expiration
   - Returns JWT and user info to client

3. **Session Persistence**:
   - Cookie: `ghss_token` (httpOnly, secure in prod, sameSite=none in prod)
   - LocalStorage: Fallback token for Authorization header
   - Works across page reloads via `/api/auth/me` endpoint

4. **Protected Routes**:
   - `/api/generate` requires valid JWT (from cookie or Authorization header)
   - Rate limiting based on user ID (20 requests/day default)

## How AI Generation Works

1. Client sends prompt to `/api/generate`
2. Server validates JWT authentication
3. Server checks rate limit (in-memory, resets on cold start)
4. Server proxies request to external AI service (configurable via env var)
5. Server returns normalized response with usage data

**Note**: Rate limiting is currently in-memory and will reset when Netlify functions cold-start. For persistent rate limiting, consider using a database or Netlify KV store.

## Testing Your Deployment

### 1. Local Testing
```bash
# Install dependencies
pnpm install

# Create .env file with your credentials
# See NETLIFY_SETUP.md for required variables

# Test locally
pnpm dev  # Visit http://localhost:5000

# Or test with Netlify Dev
npx netlify dev
```

### 2. Netlify Deploy
```bash
# Push to GitHub
git add .
git commit -m "Fix Netlify deployment issues"
git push origin main

# Deploy via Netlify dashboard
# 1. Connect repository
# 2. Set environment variables
# 3. Deploy
```

### 3. Verify Functionality
- ✅ Site loads
- ✅ Google Sign-In works
- ✅ Login persists across page reloads
- ✅ AI generation responds (check external AI service is running)
- ✅ Rate limiting works (try multiple requests)
- ✅ Logout works

## Common Issues & Solutions

### Google OAuth Not Working
1. Check `VITE_GOOGLE_CLIENT_ID` is set in Netlify
2. Verify Netlify domain is in Google OAuth authorized origins
3. Check browser console for errors

### AI Generation Fails
1. Verify `SCHOOLAI_API_URL` points to running service
2. Check Netlify function logs for 502 errors
3. Ensure external AI service accepts `{ prompt, userId }` format

### Rate Limit Not Persisting
- Expected behavior: In-memory rate limiting resets on cold start
- For persistence: Implement database-backed rate limiting

### Cookies Not Working
- Ensure `SESSION_SECRET` is set
- Verify `NODE_ENV=production` in Netlify
- Check browser security settings (allow third-party cookies for Netlify domain)

## Security Notes

✅ **Implemented**:
- httpOnly cookies prevent XSS attacks
- JWT tokens with 7-day expiration
- Secure cookies in production
- sameSite=none for cross-origin requests
- Token verification with Google tokeninfo endpoint
- Server-side rate limiting

⚠️ **Considerations**:
- In-memory rate limiting is not persistent (consider database for production)
- SQLite database won't work in serverless (currently not used)
- Keep `SESSION_SECRET` secure and rotate periodically

## Next Steps (Optional Enhancements)

1. **Persistent Rate Limiting**
   - Use PostgreSQL, MongoDB, or Netlify KV
   - Track usage across function instances

2. **Database Integration**
   - Replace SQLite with PostgreSQL/MongoDB for user records
   - Store conversation history

3. **Enhanced Security**
   - Add CSRF protection
   - Implement refresh tokens
   - Add request signing

4. **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Add analytics
   - Monitor API usage

## Support

For deployment issues:
- Check Netlify function logs
- Review browser console
- See `NETLIFY_SETUP.md` for detailed guides
- Check external AI service status
