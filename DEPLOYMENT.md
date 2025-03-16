# Deployment Guide for CRM System

This guide provides instructions for deploying the CRM system to production environments.

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL database
- Handy API keys for BIN lookup functionality

## Environment Setup

1. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

2. Update the following environment variables in your `.env` file:

- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: Your production domain (e.g., https://your-domain.com)
- `NEXTAUTH_SECRET`: A secure random string (min 32 characters)
- `HANDY_API_KEY`: Your Handy API backend key
- `NEXT_PUBLIC_HANDY_API_KEY`: Your Handy API frontend key

## Database Setup

1. Run database migrations:

```bash
npm run db:migrate
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project in the Vercel dashboard
3. Configure environment variables in the Vercel dashboard
4. Deploy

### Option 2: Self-Hosted

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Post-Deployment Verification

1. Verify authentication is working
2. Test customer creation and management
3. Verify BIN lookup functionality is working correctly

## Troubleshooting

### Database Connection Issues

- Ensure your database is accessible from your deployment environment
- Check that the `DATABASE_URL` is correctly formatted
- Verify database user permissions

### BIN Lookup Not Working

- Verify that both `HANDY_API_KEY` and `NEXT_PUBLIC_HANDY_API_KEY` are set correctly
- Check API logs for any error messages

### Authentication Issues

- Ensure `NEXTAUTH_URL` matches your actual deployment URL
- Verify `NEXTAUTH_SECRET` is set correctly

## Maintenance

- Regularly update dependencies with `npm update`
- Monitor database performance and scale as needed
- Keep your API keys secure and rotate them periodically 