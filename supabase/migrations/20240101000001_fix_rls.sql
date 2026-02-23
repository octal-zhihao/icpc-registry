-- 修复 RLS 策略：允许匿名用户插入报名记录
DROP POLICY IF EXISTS "Enable insert for all users" ON registrations;
CREATE POLICY "Enable insert for all users" ON registrations FOR INSERT WITH CHECK (true);

-- 修复 RLS 策略：允许匿名用户插入附件记录
DROP POLICY IF EXISTS "Enable insert for all users" ON attachments;
CREATE POLICY "Enable insert for all users" ON attachments FOR INSERT WITH CHECK (true);

-- 确保 anon 角色拥有表的 INSERT 权限
GRANT INSERT ON registrations TO anon;
GRANT INSERT ON attachments TO anon;
