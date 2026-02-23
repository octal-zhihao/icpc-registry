# Supabase 邮件服务配置完整指南

## 问题描述
当用户点击发送登录链接时遇到错误："Signups not allowed for this instance"，这是因为 Supabase Auth 的邮件服务未正确配置。

## 1. 启用邮箱注册功能

### 步骤 1: 访问 Supabase Dashboard
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 点击左侧菜单的 **Authentication**
4. 点击 **Providers** 标签页

### 步骤 2: 启用 Email 提供商
1. 找到 **Email** 提供商
2. 点击开关启用 Email 认证
3. 确保以下设置正确：
   - **Enable Email Signups**: 开启
   - **Enable Email Confirmations**: 开启（推荐）
   - **Enable Magic Links**: 开启（可选）

## 2. 配置邮件服务

### 选项 A: 使用 Supabase 内置测试邮件服务（推荐用于开发）

1. 在 **Authentication > Providers > Email** 页面
2. 找到 **SMTP Settings** 部分
3. 选择 **Use Supabase's built-in email service**
4. 点击 **Save**

**注意**: 测试邮件服务有每日发送限制，适合开发环境。

### 选项 B: 配置自定义 SMTP（推荐用于生产）

#### 使用 Resend SMTP

1. 注册 [Resend](https://resend.com) 账户
2. 获取 API Key 和 SMTP 配置：
   - SMTP Host: `smtp.resend.com`
   - SMTP Port: `587` (STARTTLS) 或 `465` (SSL)
   - Username: `resend`
   - Password: 您的 Resend API Key

2. 在 Supabase 中配置：
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Pass: [您的 Resend API Key]
   SMTP Sender Name: 您的应用名称
   SMTP Sender Email: noreply@您的域名.com
   ```

#### 使用 SendGrid SMTP

1. 注册 [SendGrid](https://sendgrid.com) 账户
2. 创建 API Key 并启用 SMTP Relay
3. 获取 SMTP 配置：
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - Username: `apikey`
   - Password: 您的 SendGrid API Key

4. 在 Supabase 中配置：
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Pass: [您的 SendGrid API Key]
   SMTP Sender Name: 您的应用名称
   SMTP Sender Email: noreply@您的域名.com
   ```

#### 使用 Gmail SMTP

**注意**: Gmail 需要应用专用密码，不建议用于生产环境。

1. 启用 Gmail 两步验证
2. 生成应用专用密码
3. 在 Supabase 中配置：
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: 您的Gmail地址@gmail.com
   SMTP Pass: [应用专用密码]
   SMTP Sender Name: 您的应用名称
   SMTP Sender Email: 您的Gmail地址@gmail.com
   ```

## 3. 配置重定向 URL

### 设置 Magic Link 重定向

1. 在 **Authentication > URL Configuration** 页面
2. 配置以下 URL：

**站点 URL** (Site URL):
```
https://您的域名.com
```

**重定向 URL** (Redirect URLs):
```
https://您的域名.com/auth/callback
https://您的域名.com/login
http://localhost:3000/auth/callback  # 开发环境
http://localhost:5173/auth/callback    # Vite 开发环境
```

### 前端回调处理

在您的应用中创建回调处理逻辑：

```javascript
// 使用 Supabase 客户端处理回调
const handleAuthCallback = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('认证错误:', error)
    // 处理错误
  } else {
    // 认证成功，重定向到主页
    window.location.href = '/'
  }
}
```

## 4. 自定义邮件模板

### 配置邮件模板

1. 在 **Authentication > Templates** 页面
2. 自定义以下模板：

#### 确认邮件模板
```html
<h2>确认您的邮箱</h2>
<p>请点击下方链接确认您的邮箱地址：</p>
<p><a href="{{ .ConfirmationURL }}">确认邮箱</a></p>
<p>如果链接无法点击，请复制以下地址到浏览器：</p>
<p>{{ .ConfirmationURL }}</p>
```

#### 魔法链接模板
```html
<h2>登录链接</h2>
<p>请点击下方链接登录您的账户：</p>
<p><a href="{{ .ConfirmationURL }}">点击登录</a></p>
<p>此链接将在 1 小时后过期。</p>
<p>如果链接无法点击，请复制以下地址到浏览器：</p>
<p>{{ .ConfirmationURL }}</p>
```

#### 密码重置模板
```html
<h2>重置密码</h2>
<p>请点击下方链接重置您的密码：</p>
<p><a href="{{ .ConfirmationURL }}">重置密码</a></p>
<p>此链接将在 1 小时后过期。</p>
```

### 模板变量说明

| 变量 | 说明 |
|------|------|
| {{ .ConfirmationURL }} | 确认链接 |
| {{ .Token }} | 验证码 |
| {{ .TokenHash }} | 验证码哈希 |
| {{ .SiteURL }} | 站点 URL |
| {{ .Email }} | 用户邮箱 |

## 5. 安全配置

### 配置安全策略

1. 在 **Authentication > Policies** 页面
2. 配置以下策略：

**密码策略**:
- 最小长度: 8 位
- 需要大写字母: 开启
- 需要小写字母: 开启
- 需要数字: 开启
- 需要特殊字符: 开启

**速率限制**:
- 登录尝试次数: 5 次/小时
- 验证码发送次数: 3 次/小时

## 6. 测试配置

### 测试邮件发送

1. 在 **Authentication > Templates** 页面
2. 点击 **Send test email**
3. 输入测试邮箱地址
4. 选择邮件类型（确认、魔法链接等）
5. 点击发送

### 常见问题排查

| 问题 | 解决方案 |
|------|----------|
| "Signups not allowed" | 检查 Email 提供商是否启用 |
| 邮件未收到 | 检查 SMTP 配置、垃圾邮件文件夹 |
| 链接无效 | 检查重定向 URL 配置 |
| SMTP 连接失败 | 检查防火墙、端口、认证信息 |

## 7. 监控和维护

### 监控邮件发送状态

1. 在 **Authentication > Logs** 页面查看认证日志
2. 如果使用第三方 SMTP，在其控制台查看发送统计

### 定期维护

- 监控邮件发送成功率
- 定期更新 SMTP 密码
- 检查域名信誉
- 清理邮件列表

## 8. 生产环境建议

1. **使用专业邮件服务**: 推荐使用 Resend 或 SendGrid
2. **配置自定义域名**: 设置 SPF、DKIM、DMARC 记录
3. **监控邮件声誉**: 定期检查退信率和投诉率
4. **备份配置**: 保存所有配置信息
5. **设置告警**: 配置邮件发送失败告警

通过以上配置，您的 Supabase 邮件服务应该可以正常工作，用户能够正常接收登录链接和确认邮件。