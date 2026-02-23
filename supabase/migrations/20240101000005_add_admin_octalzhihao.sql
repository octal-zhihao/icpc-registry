-- Set admin@octalzhihao.top as admin
INSERT INTO public.admin_users (id, email)
SELECT id, email
FROM auth.users
WHERE email = 'admin@octalzhihao.top'
ON CONFLICT (id) DO NOTHING;
