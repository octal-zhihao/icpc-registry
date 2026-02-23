-- Add email_sent_at and email_sent_status to registrations
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_status VARCHAR(20) DEFAULT 'pending' CHECK (email_sent_status IN ('pending', 'sent', 'failed'));

-- Create index for email status
CREATE INDEX IF NOT EXISTS idx_registrations_email_status ON registrations(email_sent_status);
