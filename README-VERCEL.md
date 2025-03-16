# CRM System - Vercel Deployment Quick Start

This guide provides a quick overview of deploying this CRM system to Vercel.

## Deployment Checklist

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Sign up for Vercel** at [vercel.com](https://vercel.com) if you haven't already

3. **Import your repository** in the Vercel dashboard

4. **Configure environment variables** in the Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Will be your Vercel deployment URL (add after first deployment)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `HANDY_API_KEY`: Your Handy API backend key
   - `NEXT_PUBLIC_HANDY_API_KEY`: Your Handy API frontend key

5. **Deploy your project**

6. **Run database migrations** using one of these methods:
   - Use Vercel CLI: `vercel run db:migrate`
   - Set up the GitHub Action in `.github/workflows/vercel-deploy.yml`

7. **Update NEXTAUTH_URL** with your deployment URL

8. **Verify deployment** by testing all functionality

## Detailed Instructions

For detailed deployment instructions, see [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md).

## Troubleshooting

If you encounter issues during deployment, check:
- Vercel build logs
- Database connection settings
- Environment variables configuration
- API key validity

## Continuous Deployment

Vercel automatically deploys when you push changes to your repository. The GitHub Action in this repository will also run database migrations automatically after deployment. 