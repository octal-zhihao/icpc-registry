-- 撤销之前允许 anon 插入的权限
DROP POLICY IF EXISTS "Enable insert for all users" ON registrations;
DROP POLICY IF EXISTS "Enable insert for all users" ON attachments;

REVOKE INSERT ON registrations FROM anon;
REVOKE INSERT ON attachments FROM anon;

-- 添加 user_id 字段（如果不存在）
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 更新 RLS 策略：仅允许用户插入自己的记录
DROP POLICY IF EXISTS "Users can insert their own registration" ON registrations;
CREATE POLICY "Users can insert their own registration" ON registrations 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own registration" ON registrations;
CREATE POLICY "Users can view their own registration" ON registrations 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- 更新附件表的 RLS
DROP POLICY IF EXISTS "Users can insert attachments for their own registration" ON attachments;
CREATE POLICY "Users can insert attachments for their own registration" ON attachments 
FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM registrations 
        WHERE id = registration_id 
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can view attachments for their own registration" ON attachments;
CREATE POLICY "Users can view attachments for their own registration" ON attachments 
FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM registrations 
        WHERE id = registration_id 
        AND user_id = auth.uid()
    )
);

-- 管理员权限
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON registrations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON attachments;

-- 创建 admin_users 表（如果不存在）
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON admin_users;
CREATE POLICY "Allow read access for all authenticated users" ON admin_users FOR SELECT TO authenticated USING (true);

-- 管理员策略
DROP POLICY IF EXISTS "Admins can view all registrations" ON registrations;
CREATE POLICY "Admins can view all registrations" ON registrations
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can update registrations" ON registrations;
CREATE POLICY "Admins can update registrations" ON registrations
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all attachments" ON attachments;
CREATE POLICY "Admins can view all attachments" ON attachments
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- 清理旧的 anon 读取策略
DROP POLICY IF EXISTS "Enable read access for all users" ON registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON attachments;
