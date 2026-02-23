-- Fix RLS policy to allow authenticated users (admins) to delete registrations
-- Previous policy "Enable all access for authenticated users" might have been overridden or insufficient

-- Drop existing restrictive policies if any (although "Enable all access" should cover it, being explicit helps)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON registrations;

-- Re-create the policy explicitly allowing DELETE
CREATE POLICY "Enable all access for authenticated users" 
ON registrations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ensure attachments cascade delete works (it's defined in schema, but policy needs to allow it)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON attachments;

CREATE POLICY "Enable all access for authenticated users" 
ON attachments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
