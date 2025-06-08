# Fitness Studio Management

A complete management platform for Fitness studios, built with Next.js and Supabase.

## Features

- Studio profile management
- Class and session scheduling with recurring options
- Client booking system with capacity management
- User authentication and authorization
- Subscription and licensing management
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **State Management**: React Query
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS with custom olive theme

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works for development)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/pilates-studio-management.git
   cd pilates-studio-management
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   - Create a `.env.local` file in the project root
   - Add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Set up the database:

   - See the database setup instructions in the `database/README.md` file
   - Run the database setup script:

   ```bash
   node scripts/setup-database.js
   ```

5. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The database schema is defined in SQL migration files located in the `database/migrations` directory. These files contain all tables, indexes, and stored procedures needed for the application.

For detailed information about the database structure and setup, see `database/README.md`.

## Project Structure

```
pilates-studio-management/
├── database/              # Database migrations and setup
├── scripts/               # Utility scripts
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── (auth)/        # Authentication routes
│   │   ├── (protected)/   # Protected routes
│   │   ├── api/           # API routes
│   ├── components/        # React components
│   ├── lib/               # Utility functions and hooks
│   │   ├── hooks/         # Custom React hooks
│   │   ├── supabase/      # Supabase client and utilities
│   │   ├── utils/         # Helper functions
│   ├── types/             # TypeScript type definitions
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query)
- [Lucide Icons](https://lucide.dev/)
