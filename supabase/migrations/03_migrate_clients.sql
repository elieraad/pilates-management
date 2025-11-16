-- Migration: Split bookings into clients and bookings tables
-- Run this migration in your Supabase SQL editor

-- Step 1: Create the clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  total_visits INTEGER DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique email per studio
  CONSTRAINT unique_client_email_per_studio UNIQUE (studio_id, email)
);

-- Step 2: Add client_id to existing bookings table
ALTER TABLE bookings ADD COLUMN client_id UUID REFERENCES clients(id);

-- Step 3: CREATE INDEX IF NOT EXISTSes for performance
CREATE INDEX IF NOT EXISTS idx_clients_studio_id ON clients(studio_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(studio_id, email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(studio_id, name);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);

-- Step 4: Enable RLS for clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for clients
CREATE POLICY "Studios can manage their clients" ON clients
  FOR ALL USING (auth.uid() = studio_id);

CREATE POLICY "Public can create clients" ON clients
  FOR INSERT WITH CHECK (true);

-- Step 6: Add trigger for updated_at
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 7: Data migration function to populate clients table from existing bookings
CREATE OR REPLACE FUNCTION migrate_bookings_to_clients()
RETURNS void AS $$
DECLARE
  booking_record RECORD;
  existing_client_id UUID;
  new_client_id UUID;
BEGIN
  -- Loop through all existing bookings
  FOR booking_record IN 
    SELECT DISTINCT studio_id, client_email, client_name, client_phone 
    FROM bookings 
    WHERE client_email IS NOT NULL AND client_name IS NOT NULL
  LOOP
    -- Check if client already exists
    SELECT id INTO existing_client_id
    FROM clients
    WHERE studio_id = booking_record.studio_id 
    AND email = booking_record.client_email;
    
    -- If client doesn't exist, create them
    IF existing_client_id IS NULL THEN
      INSERT INTO clients (studio_id, email, name, phone)
      VALUES (
        booking_record.studio_id,
        booking_record.client_email,
        booking_record.client_name,
        booking_record.client_phone
      )
      RETURNING id INTO new_client_id;
      
      -- Update all bookings for this client
      UPDATE bookings 
      SET client_id = new_client_id
      WHERE studio_id = booking_record.studio_id 
      AND client_email = booking_record.client_email;
      
      RAISE NOTICE 'Created client: % (%) with ID: %', 
        booking_record.client_name, booking_record.client_email, new_client_id;
    ELSE
      -- Update bookings to reference existing client
      UPDATE bookings 
      SET client_id = existing_client_id
      WHERE studio_id = booking_record.studio_id 
      AND client_email = booking_record.client_email;
      
      RAISE NOTICE 'Updated bookings for existing client: % (%)', 
        booking_record.client_name, booking_record.client_email;
    END IF;
  END LOOP;
  
  -- Update client statistics
  UPDATE clients SET
    total_visits = (
      SELECT COUNT(*) 
      FROM bookings 
      WHERE bookings.client_id = clients.id 
      AND bookings.status != 'cancelled'
    ),
    last_visit_date = (
      SELECT MAX(bookings.session_date) 
      FROM bookings 
      WHERE bookings.client_id = clients.id 
      AND bookings.status != 'cancelled'
    );
    
  RAISE NOTICE 'Migration completed successfully!';
END;
$$ LANGUAGE plpgsql;

-- Step 8: Enhanced booking creation function
CREATE OR REPLACE FUNCTION create_booking_with_capacity_check(
  p_class_session_id uuid,
  p_studio_id uuid,
  p_client_email text,
  p_client_name text,
  p_session_date text,
  p_client_phone text DEFAULT NULL,
  p_status text DEFAULT 'confirmed',
  p_payment_status text DEFAULT 'unpaid',
  p_amount numeric DEFAULT 0
)
RETURNS TABLE(
  booking_id uuid,
  client_id uuid,
  is_new_client boolean
) AS $$
DECLARE
  v_client_id uuid;
  v_booking_id uuid;
  v_class_capacity integer;
  v_current_bookings integer;
  v_session_date date;
  v_is_new_client boolean := false;
BEGIN
  -- Normalize & convert date
  IF p_session_date IS NULL OR p_session_date = '' THEN
    RAISE EXCEPTION 'Session date is required';
  END IF;

  v_session_date := p_session_date::date;

  -- Fetch class capacity
  SELECT c.capacity
  INTO v_class_capacity
  FROM class_sessions cs
  JOIN classes c ON c.id = cs.class_id
  WHERE cs.id = p_class_session_id
    AND cs.studio_id = p_studio_id;

  IF v_class_capacity IS NULL THEN
    RAISE EXCEPTION 'Class session not found or access denied';
  END IF;

  -- Advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(
    hashtext(p_class_session_id::text || p_session_date::text)
  );

  -- Count existing bookings
  SELECT COUNT(*)
  INTO v_current_bookings
  FROM bookings b
  WHERE b.class_session_id = p_class_session_id
    AND b.session_date = v_session_date
    AND b.status != 'cancelled';

  IF v_current_bookings >= v_class_capacity THEN
    RAISE EXCEPTION 'Class session is full';
  END IF;

  -- Find existing client
  SELECT c.id
  INTO v_client_id
  FROM clients c
  WHERE c.studio_id = p_studio_id
    AND c.email = p_client_email;

  -- Create or update client
  IF v_client_id IS NULL THEN
    INSERT INTO clients (studio_id, email, name, phone, total_visits)
    VALUES (
      p_studio_id,
      p_client_email,
      COALESCE(NULLIF(p_client_name, ''), 'Unknown'),
      NULLIF(p_client_phone, ''),
      0
    )
    RETURNING id INTO v_client_id;

    v_is_new_client := true;
  ELSE
    -- Update only if new info is better
    UPDATE clients
    SET 
      name = COALESCE(NULLIF(p_client_name, ''), name),
      phone = COALESCE(NULLIF(p_client_phone, ''), phone),
      updated_at = NOW()
    WHERE id = v_client_id;
  END IF;

  -- Prevent duplicate booking
  IF EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.class_session_id = p_class_session_id
      AND b.session_date = v_session_date
      AND b.client_id = v_client_id
      AND b.status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Client already has a booking for this session';
  END IF;

  -- Insert booking
  INSERT INTO bookings (
    studio_id,
    class_session_id,
    client_id,
    status,
    payment_status,
    amount,
    session_date,
    created_at,
    updated_at
  )
  VALUES (
    p_studio_id,
    p_class_session_id,
    v_client_id,
    p_status,
    p_payment_status,
    p_amount,
    v_session_date,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_booking_id;

  -- Update client stats
  UPDATE clients
  SET 
    total_visits = total_visits + 1,
    last_visit_date = GREATEST(last_visit_date, v_session_date::timestamptz),
    updated_at = NOW()
  WHERE id = v_client_id;

  RETURN QUERY
  SELECT v_booking_id, v_client_id, v_is_new_client;
END;
$$ LANGUAGE plpgsql;


-- Step 9: Function to get client with booking history
CREATE OR REPLACE FUNCTION get_client_with_bookings(
  p_studio_id uuid,
  p_client_id uuid
) RETURNS TABLE(
  client_info json,
  recent_bookings json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(c.*) as client_info,
    COALESCE(
      (SELECT json_agg(booking_data)
       FROM (
         SELECT 
           b.id,
           b.session_date,
           b.status,
           b.payment_status,
           b.amount,
           b.created_at,
           json_build_object(
             'id', cs.id,
             'start_time', cs.start_time,
             'class', json_build_object(
               'id', cl.id,
               'name', cl.name,
               'instructor', cl.instructor
             )
           ) as session
         FROM bookings b
         JOIN class_sessions cs ON cs.id = b.class_session_id
         JOIN classes cl ON cl.id = cs.class_id
         WHERE b.client_id = p_client_id
         AND b.studio_id = p_studio_id
         ORDER BY b.session_date DESC, b.created_at DESC
         LIMIT 10
       ) booking_data),
      '[]'::json
    ) as recent_bookings
  FROM clients c
  WHERE c.id = p_client_id AND c.studio_id = p_studio_id;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Run the migration (uncomment the line below when ready)
-- SELECT migrate_bookings_to_clients();

-- Step 11: After successful migration, you can optionally make client_id NOT NULL
-- (Run this only after confirming all bookings have been migrated successfully)
-- ALTER TABLE bookings ALTER COLUMN client_id SET NOT NULL;


ALTER TABLE bookings drop COLUMN client_name;
ALTER TABLE bookings drop COLUMN client_email;
ALTER TABLE bookings drop COLUMN client_phone;

