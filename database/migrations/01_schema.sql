-- Base schema creation
-- This file defines the initial tables structure with appropriate indexes

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Studios table
CREATE TABLE studios (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  description TEXT,
  opening_hours TEXT,
  logo_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on studios email for faster lookups
CREATE INDEX idx_studios_email ON studios(email);

-- Enable Row Level Security
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Studios can view their own profile" ON studios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Studios can update their own profile" ON studios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Studios can insert their own profile" ON studios
  FOR INSERT USING (auth.uid() = id);

-- Trigger for updated_at
CREATE TRIGGER set_studios_updated_at
  BEFORE UPDATE ON studios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Licenses table
CREATE TABLE licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('monthly', 'yearly')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster license lookups
CREATE INDEX idx_licenses_studio_id ON licenses(studio_id);
CREATE INDEX idx_licenses_active_end_date ON licenses(studio_id, is_active, end_date) 
  WHERE is_active = TRUE;

-- Enable Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Studios can view their own licenses" ON licenses
  FOR SELECT USING (auth.uid() = studio_id);

-- Trigger for updated_at
CREATE TRIGGER set_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Classes table
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  capacity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  instructor TEXT NOT NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for classes
CREATE INDEX idx_classes_studio_id ON classes(studio_id);
CREATE INDEX idx_classes_active ON classes(studio_id, is_cancelled) 
  WHERE is_cancelled = FALSE;

-- Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Studios can manage their own classes" ON classes
  FOR ALL USING (auth.uid() = studio_id);

-- Trigger for updated_at
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Class Sessions table
CREATE TABLE class_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) NOT NULL,
  studio_id UUID REFERENCES studios(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_pattern TEXT, -- 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
  custom_recurrence JSONB, -- Store days of week, end date, etc.
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster session queries
CREATE INDEX idx_sessions_studio_id ON class_sessions(studio_id);
CREATE INDEX idx_sessions_class_id ON class_sessions(class_id);
CREATE INDEX idx_sessions_start_time ON class_sessions(start_time);
CREATE INDEX idx_sessions_active ON class_sessions(studio_id, is_cancelled, start_time) 
  WHERE is_cancelled = FALSE;
CREATE INDEX idx_sessions_recurring ON class_sessions(is_recurring);

-- Enable Row Level Security
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Studios can manage their own class sessions" ON class_sessions
  FOR ALL USING (auth.uid() = studio_id);

CREATE POLICY "Public can view non-cancelled class sessions" ON class_sessions
  FOR SELECT USING (is_cancelled = FALSE);

-- Trigger for updated_at
CREATE TRIGGER set_class_sessions_updated_at
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Session Exceptions table
CREATE TABLE session_exceptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recurring_session_id UUID REFERENCES class_sessions(id) NOT NULL,
  studio_id UUID REFERENCES studios(id) NOT NULL,
  original_date TIMESTAMPTZ NOT NULL, -- The original date this would have occurred
  exception_type TEXT NOT NULL, -- 'cancelled', 'modified'
  modified_start_time TIMESTAMPTZ, -- Only populated for 'modified' type
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for session exceptions
CREATE INDEX idx_exceptions_recurring_session ON session_exceptions(recurring_session_id);
CREATE INDEX idx_exceptions_date ON session_exceptions(original_date);
CREATE INDEX idx_exceptions_studio_session_date ON session_exceptions(studio_id, recurring_session_id, original_date);

-- Enable Row Level Security
ALTER TABLE session_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Studios can manage their own class exceptions" ON session_exceptions
  FOR ALL USING (auth.uid() = studio_id);

-- Trigger for updated_at
CREATE TRIGGER set_session_exceptions_updated_at
  BEFORE UPDATE ON session_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_session_id UUID REFERENCES class_sessions(id) NOT NULL,
  studio_id UUID REFERENCES studios(id) NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'unpaid', 'refunded')),
  amount NUMERIC(10, 2) NOT NULL,
  session_date DATE NOT NULL, -- Store the specific date for recurring sessions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Add a unique constraint to prevent double bookings (for the same occurrence)
  CONSTRAINT unique_client_session_date UNIQUE (class_session_id, client_email, session_date)
);

-- Indexes for faster booking lookups
CREATE INDEX idx_bookings_studio_id ON bookings(studio_id);
CREATE INDEX idx_bookings_session_id ON bookings(class_session_id);
CREATE INDEX idx_bookings_client_email ON bookings(client_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_session_date ON bookings(session_date);
CREATE INDEX idx_bookings_studio_status ON bookings(studio_id, status);
CREATE INDEX idx_bookings_session_status ON bookings(class_session_id, status) 
  WHERE status != 'cancelled';

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Studios can manage bookings for their classes" ON bookings
  FOR ALL USING (auth.uid() = studio_id);

-- Trigger for updated_at
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();