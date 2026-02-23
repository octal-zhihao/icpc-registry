# 如何设置管理员账号

本项目采用 **白名单机制** 来管理管理员权限。只有在 `admin_users` 表中存在的用户，才拥有后台管理权限。

## 设置步骤

### 第一步：注册/登录账号
首先，请在您的网站前台（例如 `http://localhost:5173/admin/login` 或 `http://localhost:5173/register`）使用您想要设置为管理员的邮箱进行登录。
*   如果是首次登录，系统会自动在 Supabase Auth 中创建该用户。
*   **注意**：此时您还**不是**管理员，登录后台会提示“无权访问”。

### 第二步：授权为管理员
您需要直接在数据库中将该用户添加到管理员白名单。

#### 方法 A：使用 Supabase 控制台（推荐）
1.  登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2.  进入您的项目。
3.  点击左侧菜单栏的 **SQL Editor**。
4.  点击 **New Query**。
5.  复制并粘贴以下 SQL 代码（**请将 `'your_email@example.com'` 替换为您实际的邮箱**）：

```sql
INSERT INTO public.admin_users (id, email)
SELECT id, email
FROM auth.users
WHERE email = 'your_email@example.com'  -- 替换为您的邮箱
ON CONFLICT (id) DO NOTHING;
```

6.  点击 **Run** 按钮。
7.  如果显示 `Success`，则设置成功。

#### 方法 B：告诉我您的邮箱
您可以直接在对话框中告诉我您的邮箱地址，例如：“请把 `xxx@xx.com` 设置为管理员”。
我会帮您生成并运行相应的迁移脚本。

## 验证
设置完成后，刷新网站后台页面，您应该就能看到管理界面了。
