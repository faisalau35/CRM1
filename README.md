# Internal CRM System

A modern CRM system built with Next.js, Prisma, PostgreSQL, and Shadcn UI components.

## Features

- User authentication with NextAuth.js
- Customer management
- Project tracking
- Task management
- Modern and responsive UI
- Role-based access control
- Real-time updates

## Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS, Shadcn UI Components
- **State Management**: React Query
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18.17 or later
- PostgreSQL 12 or later
- npm or yarn

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd crm-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database and authentication credentials.

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

## Database Schema

The system uses the following main models:
- User
- Customer
- Project
- Task

Refer to `prisma/schema.prisma` for the complete database schema.

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/customers/*` - Customer management
- `/api/projects/*` - Project management
- `/api/tasks/*` - Task management

## Deployment

### Vercel Deployment

1. Push your code to a Git repository
2. Import the project in Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
