-- Add operator_id to email_logs to track who sent the email
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES auth.users(id);

-- Add comment
COMMENT ON COLUMN email_logs.operator_id IS 'ID of the admin who triggered the email sending';
