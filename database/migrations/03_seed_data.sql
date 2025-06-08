-- Optional seed data for development

-- Only run this in development environments!
-- DO NOT run in production

-- Insert a demo studio (replace the UUID with your test auth user ID)
INSERT INTO studios (
  id, 
  name, 
  address, 
  phone, 
  email, 
  description, 
  opening_hours
) VALUES (
  'YOUR_TEST_AUTH_USER_ID', -- Replace with actual UUID
  'Pure Fitness Studio',
  '123 Serenity Ave, Downtown',
  '(555) 123-4567',
  'demo@example.com',
  'A boutique Fitness studio offering reformer and mat classes for all levels.',
  'Mon-Fri: 6am-8pm, Sat-Sun: 8am-6pm'
);

-- Insert a demo license
INSERT INTO licenses (
  studio_id,
  license_type,
  start_date,
  end_date,
  is_active
) VALUES (
  'YOUR_TEST_AUTH_USER_ID', -- Replace with actual UUID
  'monthly',
  NOW(),
  NOW() + INTERVAL '30 days',
  TRUE
);

-- Insert demo classes
INSERT INTO classes (
  studio_id,
  name,
  description,
  duration,
  capacity,
  price,
  instructor
) VALUES 
(
  'YOUR_TEST_AUTH_USER_ID', -- Replace with actual UUID
  'Reformer Flow',
  'A dynamic full-body workout on the reformer machine. Suitable for all levels.',
  60,
  10,
  35.00,
  'Emma Wilson'
),
(
  'YOUR_TEST_AUTH_USER_ID', -- Replace with actual UUID
  'Mat Fitness',
  'Classic Fitness exercises performed on a mat. Focus on core strength and flexibility.',
  45,
  15,
  25.00,
  'Michael Chen'
),
(
  'YOUR_TEST_AUTH_USER_ID', -- Replace with actual UUID
  'Prenatal Fitness',
  'Gentle Fitness exercises designed specifically for expectant mothers.',
  45,
  8,
  30.00,
  'Sarah Johnson'
);

-- Function to create recurring sessions for demo purposes
DO $$
DECLARE
  reformer_id uuid;
  mat_id uuid;
  prenatal_id uuid;
  studio_id uuid := 'YOUR_TEST_AUTH_USER_ID'; -- Replace with actual UUID
  start_date date := CURRENT_DATE;
  session_id uuid;
BEGIN
  -- Get class IDs
  SELECT id INTO reformer_id FROM classes WHERE name = 'Reformer Flow' AND studio_id = studio_id;
  SELECT id INTO mat_id FROM classes WHERE name = 'Mat Fitness' AND studio_id = studio_id;
  SELECT id INTO prenatal_id FROM classes WHERE name = 'Prenatal Fitness' AND studio_id = studio_id;
  
  -- Create recurring Monday/Wednesday/Friday morning Reformer sessions
  INSERT INTO class_sessions (
    class_id,
    studio_id,
    start_time,
    is_recurring,
    recurring_pattern
  ) VALUES (
    reformer_id,
    studio_id,
    start_date + INTERVAL '9 hours', -- 9:00 AM
    TRUE,
    'weekly'
  ) RETURNING id INTO session_id;
  
  -- Create recurring Tuesday/Thursday evening Mat sessions
  INSERT INTO class_sessions (
    class_id,
    studio_id,
    start_time,
    is_recurring,
    recurring_pattern
  ) VALUES (
    mat_id,
    studio_id,
    start_date + INTERVAL '1 day' + INTERVAL '18 hours', -- 6:00 PM on Tuesday
    TRUE,
    'weekly'
  );
  
  -- Create recurring Saturday morning Prenatal sessions
  INSERT INTO class_sessions (
    class_id,
    studio_id,
    start_time,
    is_recurring,
    recurring_pattern
  ) VALUES (
    prenatal_id,
    studio_id,
    start_date + INTERVAL '5 days' + INTERVAL '10 hours', -- 10:00 AM on Saturday
    TRUE,
    'weekly'
  );
  
  -- Create a one-time special session
  INSERT INTO class_sessions (
    class_id,
    studio_id,
    start_time,
    is_recurring
  ) VALUES (
    reformer_id,
    studio_id,
    start_date + INTERVAL '3 days' + INTERVAL '17 hours', -- 5:00 PM special session
    FALSE
  );
  
  -- Create a sample booking for the recurring session
  INSERT INTO bookings (
    class_session_id,
    studio_id,
    client_name,
    client_email,
    client_phone,
    status,
    payment_status,
    amount,
    session_date
  ) VALUES (
    session_id,
    studio_id,
    'Jessica Miller',
    'jessica@example.com',
    '(555) 987-6543',
    'confirmed',
    'paid',
    35.00,
    start_date
  );
END $$;