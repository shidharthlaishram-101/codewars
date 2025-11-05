# Vercel Deployment Guide

This guide will help you deploy your Prajyuktam website on Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Firebase project with Service Account key
3. Git repository (optional, but recommended)

## Environment Variables Setup

You need to set the following environment variables in your Vercel project settings:

### 1. FIREBASE_SERVICE_ACCOUNT_KEY
- Go to your Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key"
- Copy the entire JSON content
- In Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `FIREBASE_SERVICE_ACCOUNT_KEY` with the JSON content as the value (paste the entire JSON as a single-line string)

### 2. SESSION_SECRET (Optional but Recommended)
- Generate a random secret string (e.g., using `openssl rand -base64 32`)
- Add `SESSION_SECRET` with your generated secret

### 3. NODE_ENV
- Already set to `production` automatically by Vercel

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub, GitLab, or Bitbucket)
3. Configure the project:
   - Framework Preset: Other
   - Root Directory: `./` (default)
   - Build Command: Leave empty (Vercel will auto-detect)
   - Output Directory: Leave empty
4. Add environment variables (see above)
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Post-Deployment

1. After deployment, Vercel will provide you with a URL (e.g., `your-project.vercel.app`)
2. Test all routes:
   - `/` - Home page
   - `/registration` - Registration form
   - `/auth` - Authentication page
   - `/admin` - Admin dashboard
   - `/contest` - Contest page

## Troubleshooting

### Common Issues:

1. **"Database not initialized" error**
   - Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly in Vercel environment variables
   - Ensure the JSON is properly formatted (single-line string)

2. **Session not working**
   - Set `SESSION_SECRET` environment variable
   - Ensure cookies are enabled in your browser

3. **Static files not loading**
   - Check that files are in the `public` folder
   - Clear browser cache

4. **Build errors**
   - Check Vercel build logs for specific errors
   - Ensure all dependencies are in `package.json`
   - Try deploying with `vercel --debug` for more details

## Files Modified for Vercel Compatibility

- `app.js` - Now exports Express app for serverless functions
- `vercel.json` - Vercel configuration file
- `firebaseServer.js` - Supports environment variables
- `.vercelignore` - Excludes unnecessary files from deployment

## Notes

- The `serviceAccountKey.json` file is excluded from deployment (use environment variables instead)
- Admin routes are now integrated into `app.js` (no separate server needed)
- Sessions use memory store (works for single-instance deployments)

