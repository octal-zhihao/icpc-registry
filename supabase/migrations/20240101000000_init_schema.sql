-- 报名表
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100) NOT NULL,
    college VARCHAR(100) NOT NULL,
    enrollment_year INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    qq VARCHAR(50) NOT NULL,
    resume TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 附件表
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 邮件模板表
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type VARCHAR(50) UNIQUE NOT NULL CHECK (template_type IN ('approved', 'rejected')),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 邮件发送记录表
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id),
    template_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    sent_success BOOLEAN NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_attachments_registration_id ON attachments(registration_id);
CREATE INDEX idx_email_logs_registration_id ON email_logs(registration_id);

-- 初始化邮件模板
INSERT INTO email_templates (template_type, subject, content) VALUES 
('approved', 'ICPC校赛报名审核通过', '恭喜您！您的ICPC校赛报名已经审核通过。'),
('rejected', 'ICPC校赛报名审核结果', '很抱歉，您的ICPC校赛报名未通过审核。');

-- 权限设置
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 允许任何人（anon）查看和创建报名（用于公开报名）
CREATE POLICY "Enable read access for all users" ON registrations FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON registrations FOR INSERT WITH CHECK (true);

-- 允许任何人（anon）查看和创建附件
CREATE POLICY "Enable read access for all users" ON attachments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON attachments FOR INSERT WITH CHECK (true);

-- 仅允许认证用户（管理员）完全控制
CREATE POLICY "Enable all access for authenticated users" ON registrations FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON attachments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON email_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON email_logs FOR ALL TO authenticated USING (true);

-- 显式授权给 anon 和 authenticated 角色
GRANT SELECT, INSERT ON registrations TO anon;
GRANT SELECT, INSERT ON attachments TO anon;

GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON attachments TO authenticated;
GRANT ALL PRIVILEGES ON email_templates TO authenticated;
GRANT ALL PRIVILEGES ON email_logs TO authenticated;
