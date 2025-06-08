-- Stored procedures and functions

-- Stored procedure for creating a booking with capacity check
CREATE OR REPLACE FUNCTION create_booking_with_capacity_check(
  p_class_session_id uuid,
  p_studio_id uuid,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_status text,
  p_payment_status text,
  p_amount numeric,
  p_capacity integer,
  p_session_date text -- Required parameter for all bookings
) RETURNS bookings AS $$
DECLARE
  current_bookings_count integer;
  existing_booking_id uuid;
  new_booking bookings;
  is_recurring boolean;
  session_date_value date;
BEGIN
  -- Convert the text date to a proper date type
  session_date_value := p_session_date::date;

  -- Get session data to check if it's recurring
  SELECT cs.is_recurring INTO is_recurring
  FROM class_sessions cs
  WHERE cs.id = p_class_session_id;

  -- Lock the rows in the bookings table for the class session
  -- to prevent concurrent inserts that could exceed capacity
  PERFORM pg_advisory_xact_lock(hashtext(p_class_session_id::text || p_session_date));

  -- Check if client already has a booking for this specific session occurrence
  SELECT id INTO existing_booking_id
  FROM bookings
  WHERE class_session_id = p_class_session_id
  AND session_date = session_date_value
  AND client_email = p_client_email
  AND status != 'cancelled';

  IF existing_booking_id IS NOT NULL THEN
    RAISE EXCEPTION 'Client already has a booking for this session';
  END IF;

  -- Check if class session is full for this specific date
  SELECT COUNT(*) INTO current_bookings_count
  FROM bookings
  WHERE class_session_id = p_class_session_id
  AND session_date = session_date_value
  AND status != 'cancelled';

  IF current_bookings_count >= p_capacity THEN
    RAISE EXCEPTION 'Class session is full';
  END IF;

  -- If there's capacity, create the booking
  INSERT INTO bookings (
    studio_id,
    class_session_id,
    client_name,
    client_email,
    client_phone,
    status,
    payment_status,
    amount,
    session_date, -- Store the session date
    created_at,
    updated_at
  ) VALUES (
    p_studio_id,
    p_class_session_id,
    p_client_name,
    p_client_email,
    p_client_phone,
    p_status,
    p_payment_status,
    p_amount,
    session_date_value,
    NOW(),
    NOW()
  ) RETURNING * INTO new_booking;

  RETURN new_booking;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a studio has an active license
CREATE OR REPLACE FUNCTION check_studio_license(
  p_studio_id uuid
) RETURNS boolean AS $$
DECLARE
  has_active_license boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM licenses 
    WHERE studio_id = p_studio_id 
    AND is_active = TRUE 
    AND end_date > NOW()
  ) INTO has_active_license;
  
  RETURN has_active_license;
END;
$$ LANGUAGE plpgsql;

-- Function to count bookings for a specific session
CREATE OR REPLACE FUNCTION count_session_bookings(
  p_session_id uuid,
  p_session_date date DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  booking_count integer;
BEGIN
  IF p_session_date IS NULL THEN
    -- For regular sessions
    SELECT COUNT(*)
    FROM bookings
    WHERE class_session_id = p_session_id
    AND status != 'cancelled'
    INTO booking_count;
  ELSE
    -- For recurring sessions on a specific date
    SELECT COUNT(*)
    FROM bookings
    WHERE class_session_id = p_session_id
    AND session_date = p_session_date
    AND status != 'cancelled'
    INTO booking_count;
  END IF;
  
  RETURN booking_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get stats for a specific studio
CREATE FUNCTION get_booking_counts(studio_id_param uuid, date_from_param timestamptz)
RETURNS TABLE (
  total_count bigint,
  confirmed_count bigint,
  cancelled_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_count,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
  FROM bookings
  WHERE studio_id = studio_id_param
    AND created_at >= date_from_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
