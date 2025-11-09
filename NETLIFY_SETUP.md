# Netlify Deployment Guide

## Required Environment Variables

Set these in your Netlify dashboard under **Site settings → Environment variables**:

### Required Variables

1. **VITE_GOOGLE_CLIENT_ID**
   - Your Google OAuth 2.0 Client ID (Web application)
   - Get from: https://console.cloud.google.com/apis/credentials
   - Make sure to add your Netlify domain to Authorized JavaScript origins
   - Add `https://your-site.netlify.app` to Authorized redirect URIs
   - **CRITICAL**: This MUST be set in Netlify environment variables for security - the backend validates tokens against this value

2. **SESSION_SECRET**
   - A secure random string for JWT signing (e.g., 32+ character random string)
   - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - **IMPORTANT**: Keep this secret and never commit to Git

3. **NODE_ENV**
   - Set to: `production`

### Optional Variables

4. **SCHOOLAI_API_URL** or **VITE_AI_API_URL**
   - URL of your external AI service (defaults to `https://schoolai-server.onrender.com`)
   - Example: `https://your-ai-backend.onrender.com`

5. **MAX_DAILY_REQUESTS**
   - Daily request limit per user (defaults to `20`)
   - Example: `50`

6. **ALLOWED_ORIGIN**
   - For CORS (defaults to wildcard `*` which works for most cases)
   - If needed, set to your Netlify URL: `https://your-site.netlify.app`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add Authorized JavaScript origins:
   - `https://your-site.netlify.app`
   - `http://localhost:5000` (for local dev)
7. Add Authorized redirect URIs:
   - `https://your-site.netlify.app`
8. Copy the Client ID and set as `VITE_GOOGLE_CLIENT_ID` in Netlify

## Build Configuration

The build is configured in `netlify.toml`:

```toml
[build]
  command = "pnpm install && pnpm build"
  functions = "netlify/functions"
  publish = "dist/spa"
```

### If You Don't Have pnpm Installed on Netlify

Add this to your Netlify build settings or update `netlify.toml`:

```toml
[build.environment]
  NPM_FLAGS = "--version"  # This forces Netlify to use npm instead
```

Then change the build command to:
```toml
command = "npm install && npm run build"
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Fix Netlify deployment issues"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click **Add new site** → **Import an existing project**
   - Choose your GitHub repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. **Set Environment Variables**
   - In Netlify dashboard: **Site settings → Environment variables**
   - Add all required variables listed above

4. **Deploy**
   - Click **Deploy site**
   - Wait for build to complete
   - Check deployment logs for any errors

## Common Issues & Solutions

### Authentication Not Working

**Issue**: Google login fails or cookies not persisting

**Solutions**:
1. Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
2. Ensure your Netlify domain is added to Google OAuth authorized origins
3. Check that `SESSION_SECRET` is set in environment variables
4. Verify `NODE_ENV=production` is set

### AI Generation Fails

**Issue**: `/api/generate` returns 502 or timeout errors

**Solutions**:
1. Verify `SCHOOLAI_API_URL` points to your working AI backend
2. Check that your external AI service is running
3. Verify the external service accepts requests with `{ prompt, userId }` format
4. Check Netlify function logs for detailed error messages

### API Routes Return 404

**Issue**: `/api/*` routes not found

**Solutions**:
1. Verify `netlify.toml` has the redirect configuration (already in place)
2. Check that the build created `netlify/functions/api.js`
3. Look at Netlify function logs for errors
4. Ensure all dependencies are bundled (node_bundler = "esbuild" is set)

### Rate Limiting Not Persisting

**Note**: The current implementation uses in-memory rate limiting, which resets when Netlify functions cold-start. For persistent rate limiting:

1. Use a database (MongoDB, PostgreSQL, Redis)
2. Or implement using Netlify Blobs/KV store
3. Or use a third-party rate limiting service

## Testing Locally

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   SESSION_SECRET=your_secret_here
   SCHOOLAI_API_URL=https://schoolai-server.onrender.com
   NODE_ENV=development
   ```

3. Test with Netlify Dev:
   ```bash
   pnpm install -g netlify-cli
   netlify dev
   ```

4. Or build and preview:
   ```bash
   pnpm build
   pnpm start
   ```

## Monitoring

- **Netlify Function Logs**: Site settings → Functions → Click on `api` function
- **Build Logs**: Deploys → Click on specific deploy → View logs
- **Real-time logs**: Use Netlify CLI: `netlify logs:function api`

## Security Notes

1. **Never commit** `.env` files to Git
2. Keep `SESSION_SECRET` secure and rotate periodically
3. The app uses `httpOnly` cookies with `secure` and `sameSite` flags in production
4. JWT tokens expire after 7 days
5. Rate limiting is enforced server-side (20 requests/day default)
