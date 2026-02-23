-- 1. 修复附件上传问题：创建存储桶并设置权限
INSERT INTO storage.buckets (id, name, public) 
VALUES ('registration-attachments', 'registration-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 删除旧策略以避免冲突
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Give anon access to registration-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated access to registration-attachments" ON storage.objects;

-- 允许认证用户上传文件到 registration-attachments 桶
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'registration-attachments');

-- 允许任何人（包括未登录用户，如果需要公开查看）查看文件
CREATE POLICY "Allow public view" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'registration-attachments');


-- 2. 修复审核权限问题：确保管理员在 admin_users 表中
-- 尝试将 admin@example.com 添加为管理员
INSERT INTO public.admin_users (id, email)
SELECT id, email
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (id) DO NOTHING;

-- 也可以添加一个策略，允许第一个注册的用户自动成为管理员（可选，但为了安全起见这里只添加特定邮箱）
-- 或者更宽泛一点，如果 admin_users 表为空，允许任何认证用户更新（仅用于初始化，但这有风险，暂不采用）

-- 3. 增强管理员对附件的管理权限
DROP POLICY IF EXISTS "Admins can manage all attachments" ON attachments;
CREATE POLICY "Admins can manage all attachments" ON attachments
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
