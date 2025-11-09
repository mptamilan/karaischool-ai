# Netlify Deployment Checklist

Use this checklist before pushing to GitHub and deploying to Netlify.

## ✅ Pre-Deployment Checklist

### 1. Google OAuth Setup
- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 Client ID (Web application)
- [ ] Added Netlify domain to Authorized JavaScript origins: `https://your-site.netlify.app`
- [ ] Added Netlify domain to Authorized redirect URIs: `https://your-site.netlify.app`
- [ ] Saved Client ID for later

### 2. Environment Variables Ready
- [ ] Generated `SESSION_SECRET` (run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Have `VITE_GOOGLE_CLIENT_ID` from Google Cloud Console
- [ ] Have `GOOGLE_GEMINI_API_KEY` from Google AI Studio

### 3. Code Changes
- [ ] All fixes from `FIXES_APPLIED.md` are in place
- [ ] No `.env` file is committed to Git
- [ ] Tested locally with `pnpm dev`

### 4. GitHub
- [ ] Code pushed to GitHub repository
- [ ] Repository is accessible for Netlify to pull from

## 🚀 Netlify Deployment Steps

### Step 1: Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize
4. Select your repository
5. Netlify should auto-detect settings from `netlify.toml`

### Step 2: Configure Environment Variables
In Netlify dashboard → **Site settings** → **Environment variables** → **Add a variable**:

Add these variables one by one:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | `123456789-abcd.apps.googleusercontent.com` |
| `SESSION_SECRET` | Random 32+ char string | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0` |
| `GOOGLE_GEMINI_API_KEY` | Your Gemini API key | `AIza...your_api_key_here` |
| `NODE_ENV` | `production` | `production` |

### Step 3: Deploy
1. Click **"Deploy site"**
2. Wait for build to complete (check logs for errors)
3. Note your Netlify URL (e.g., `https://random-name-123.netlify.app`)

### Step 4: Update Google OAuth
1. Go back to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth Client ID
3. Add your actual Netlify URL to:
   - Authorized JavaScript origins: `https://your-actual-site.netlify.app`
   - Authorized redirect URIs: `https://your-actual-site.netlify.app`
4. Save changes

### Step 5: Test Everything
- [ ] Site loads without errors
- [ ] Click "Sign in with Google" button
- [ ] Complete Google login flow
- [ ] User info displays in header
- [ ] Can send AI prompt and get response
- [ ] Usage counter updates after request
- [ ] Can logout successfully
- [ ] After logout, can login again

## 🐛 Troubleshooting

### Build Fails
- Check Netlify build logs for specific error
- Verify `netlify.toml` is correct
- Ensure all dependencies are in `package.json`

### Google Login Doesn't Work
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly in Netlify
- Check that Netlify URL is in Google OAuth authorized origins
- Look at browser console for errors
- Check that Google OAuth consent screen is configured

### AI Generation Fails
- Verify `GOOGLE_GEMINI_API_KEY` environment variable is set in Netlify
- Check Gemini API quota in Google Cloud Console
- View Netlify function logs: **Functions** → **api** → **Function log**
- Check function timeout settings (should be 26s in netlify.toml)

### "Authentication required" Error
- Verify `SESSION_SECRET` is set in Netlify
- Check browser allows cookies
- Try clearing browser cache and cookies
- Check browser console for JWT errors

### Rate Limit Not Working
- This is expected - rate limiting is in-memory and resets on cold start
- For persistent limits, implement database-backed solution

## 📊 Monitoring After Deployment

### Check Netlify Logs
1. **Deploy logs**: Deploys → Click specific deploy → View logs
2. **Function logs**: Functions → api → Function log
3. **Real-time logs**: Install Netlify CLI and run `netlify logs:function api`

### Monitor Usage
- Check Netlify analytics for traffic
- Monitor function execution time and errors
- Track Gemini API usage in Google Cloud Console

### Performance
- Netlify functions have 10-26s timeout
- Cold starts may cause first request to be slow
- Consider adding loading states for better UX

## 🔒 Security Reminders

- ✅ Never commit `.env` to Git
- ✅ Rotate `SESSION_SECRET` periodically
- ✅ Keep Google OAuth credentials secure
- ✅ Keep Gemini API key secure
- ✅ Monitor for unusual API usage

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ Site loads on Netlify URL
2. ✅ Google login works
3. ✅ Session persists across page reloads
4. ✅ AI responses work
5. ✅ No errors in Netlify function logs
6. ✅ Logout works properly

## 📝 Next Steps After Successful Deployment

### Optional Enhancements
1. **Custom Domain**
   - Add custom domain in Netlify: **Domain management** → **Add custom domain**
   - Update Google OAuth with new domain

2. **Analytics**
   - Enable Netlify Analytics
   - Add Google Analytics or similar

3. **Error Tracking**
   - Set up Sentry for error monitoring
   - Configure log aggregation

4. **Performance**
   - Enable Netlify edge functions for better performance
   - Add CDN caching for static assets

5. **Database**
   - Replace in-memory rate limiting with database
   - Store user conversation history
   - Track analytics

### Support Resources
- **Netlify Docs**: https://docs.netlify.com/
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Project Docs**: See `NETLIFY_SETUP.md` for detailed setup

---

## Quick Reference Commands

```bash
# Local development
pnpm install
pnpm dev

# Local Netlify testing
npx netlify dev

# Build locally
pnpm build

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Deploy via Netlify CLI (alternative)
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## Environment Variables Template

Save this as `.env.local` for local testing (DO NOT COMMIT):

```env
# Frontend
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend
SESSION_SECRET=generate_a_random_32plus_character_string
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
MAX_DAILY_REQUESTS=20
```

---

**Need Help?** Check `NETLIFY_SETUP.md` for detailed guides and troubleshooting.
