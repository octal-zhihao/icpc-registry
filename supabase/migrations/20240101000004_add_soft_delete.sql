-- Add deleted_at column for soft delete
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update RLS to allow admins to update deleted_at
-- (Existing "Admins can update registrations" policy should cover this as long as it allows updating the column)
