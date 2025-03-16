# Vercel Deployment Guide for CRM System

This guide provides step-by-step instructions for deploying the CRM system to Vercel.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account with your project repository
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- PostgreSQL database (you can use Vercel Postgres, Supabase, Railway, or any other provider)
- Handy API keys for BIN lookup functionality

## Step 1: Prepare Your Repository

Ensure your repository includes:
- The updated `.env.example` file
- `vercel.json` configuration
- `next.config.js` with `output: 'standalone'`

## Step 2: Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the repository containing your CRM system

## Step 3: Configure Project Settings

1. **Framework Preset**: Ensure "Next.js" is selected
2. **Build and Output Settings**: Leave as default (Vercel will detect the correct settings)
3. **Root Directory**: Leave as `.` unless your project is in a subdirectory

## Step 4: Configure Environment Variables

Add the following environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: The URL of your Vercel deployment (you can add this after the first deployment)
- `NEXTAUTH_SECRET`: A secure random string (min 32 characters)
- `HANDY_API_KEY`: Your Handy API backend key
- `NEXT_PUBLIC_HANDY_API_KEY`: Your Handy API frontend key

You can generate a secure NEXTAUTH_SECRET with:
```bash
openssl rand -base64 32
```

## Step 5: Deploy

1. Click "Deploy"
2. Wait for the build and deployment to complete
3. Once deployed, copy your production URL (e.g., `https://your-project.vercel.app`)
4. Update the `NEXTAUTH_URL` environment variable with this URL in your Vercel project settings

## Step 6: Set Up the Database

1. Run database migrations using Vercel CLI:

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Log in to Vercel
vercel login

# Link to your project
vercel link

# Run the database migration command
vercel run db:migrate
```

Alternatively, you can set up a GitHub Action to run migrations automatically on deployment.

## Step 7: Verify Deployment

1. Visit your deployed application
2. Test authentication functionality
3. Create a test customer and verify BIN lookup works
4. Check all other features

## Troubleshooting

### Build Failures

- Check build logs in the Vercel dashboard
- Ensure all dependencies are correctly specified in package.json
- Verify that the Prisma schema is compatible with your database

### Database Connection Issues

- Double-check your `DATABASE_URL` environment variable
- Ensure your database allows connections from Vercel's IP ranges
- For Vercel Postgres, use the integration for automatic connection string management

### BIN Lookup Not Working

- Verify API keys are correctly set in environment variables
- Check function logs in the Vercel dashboard

## Continuous Deployment

Vercel automatically deploys when you push changes to your repository. To customize this behavior:

1. Go to your project settings in Vercel
2. Navigate to the "Git" tab
3. Configure branch deployments as needed

## Custom Domains

1. Go to your project settings in Vercel
2. Navigate to the "Domains" tab
3. Add your custom domain
4. Follow the instructions to configure DNS settings

Remember to update `NEXTAUTH_URL` if you add a custom domain. 