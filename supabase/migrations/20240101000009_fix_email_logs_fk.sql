-- Fix foreign key constraint for email_logs to allow cascading delete
ALTER TABLE email_logs
DROP CONSTRAINT email_logs_registration_id_fkey,
ADD CONSTRAINT email_logs_registration_id_fkey
    FOREIGN KEY (registration_id)
    REFERENCES registrations(id)
    ON DELETE CASCADE;
