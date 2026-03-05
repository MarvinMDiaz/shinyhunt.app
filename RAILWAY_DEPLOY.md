# Deploying to Railway

This guide will help you deploy your Shiny Tracker app to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Login to Railway**
   - Go to https://railway.app
   - Sign in with your GitHub/GitLab account

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or your Git provider)
   - Choose your repository

3. **Configure the Service**
   - Railway will auto-detect it's a Node.js project
   - It will use the `nixpacks.toml` configuration
   - The build command: `npm run build`
   - The start command: `npm run preview`

4. **Set Environment Variables (if needed)**
   - Railway will automatically set `PORT` environment variable
   - No additional environment variables needed for this app

5. **Deploy**
   - Railway will automatically build and deploy
   - Once deployed, Railway will provide a public URL

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Railway**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Configuration Files

- `railway.json` - Railway-specific configuration
- `nixpacks.toml` - Build configuration for Railway
- `package.json` - Updated with `start` script

## Build Process

1. Railway installs dependencies (`npm ci`)
2. Builds the app (`npm run build`)
3. Starts the preview server (`npm run preview`)

## Custom Domain

After deployment:
1. Go to your project settings in Railway
2. Click "Settings" → "Generate Domain"
3. Or add a custom domain in "Domains" section

## Troubleshooting

- **Build fails**: Check the build logs in Railway dashboard
- **App doesn't start**: Ensure `PORT` environment variable is set (Railway does this automatically)
- **404 errors**: Make sure the build output is in `dist/` folder (Vite default)

## Notes

- Railway automatically provides HTTPS
- The app uses `localStorage` for data persistence (client-side only)
- No database setup needed for this app
