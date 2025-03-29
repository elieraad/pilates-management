# Database Setup Guide

This directory contains all the SQL scripts needed to set up the Pilates Studio Management database in Supabase.

## Structure

The migrations are organized in sequential order:

1. `01_schema.sql`: Creates all tables with appropriate indexes and security policies
2. `02_stored_procedures.sql`: Defines stored procedures and functions
3. `03_seed_data.sql`: Optional seed data for development environments

## How to Run

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each SQL file in order (01 → 02 → 03)
4. Execute each script

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
# Navigate to your project root
cd pilates-studio-management

# Run migrations (Requires supabase CLI to be installed and configured)
supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

⚠️ **Important Notes:**

- Be sure to replace `YOUR_TEST_AUTH_USER_ID` in the seed data script with your actual test user ID if you plan to use seed data
- The seed data script (03) should ONLY be run in development environments
- Indexes are crucial for performance and have been carefully added to optimize the most common queries

## Database Schema

### Studios
- Represents the Pilates studio businesses
- Has direct relationship with auth.users

### Licenses
- Tracks subscription status for studios
- Used to enforce subscription requirements for certain features

### Classes
- Represents the types of classes offered by studios
- E.g., "Reformer Flow", "Mat Pilates", etc.

### Class Sessions
- Specific instances of classes scheduled at particular times
- Can be one-time or recurring

### Session Exceptions
- Handles modifications to recurring sessions
- E.g., cancellations, time changes for specific dates

### Bookings
- Client bookings for class sessions
- Has capacity enforcement and conflict prevention

## Performance Considerations

All tables include appropriate indexes to optimize query performance. Key indexes include:

- Studio ID indexes on all tables for row-level security filtering
- Status indexes for filtering active/inactive records
- Date indexes for time-based queries
- Composite indexes for complex filtering scenarios

Row-level security policies ensure that studios can only access their own data.