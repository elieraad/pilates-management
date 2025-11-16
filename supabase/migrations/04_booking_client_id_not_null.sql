ALTER TABLE bookings
ALTER COLUMN client_id
SET
    NOT NULL;

ALTER TABLE clients
DROP CONSTRAINT unique_client_email_per_studio;
