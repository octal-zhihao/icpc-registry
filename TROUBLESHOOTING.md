# 解决部署后的两个关键问题

## 1. 解决 CORS 报错 (Supabase 访问被拒)
您的前端域名 `https://icpc-registry.vercel.app` 被 Supabase 拦截了。请按以下步骤操作：

1.  登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2.  进入您的项目 (`icpc-registry` / `aheyubonvkfyihproovn`)。
3.  点击左侧菜单底部的 **Authentication** -> **URL Configuration**。
4.  在 **Site URL** 中，输入您的 Vercel 域名：
    `https://icpc-registry.vercel.app`
5.  在 **Redirect URLs** 中，点击 "Add URL"，添加：
    `https://icpc-registry.vercel.app/**`
    *(注意末尾的 `/**`，这允许所有子路径的回调)*
6.  点击 **Save** 保存。

**等待 1-2 分钟生效后，CORS 报错应该就会消失。**

---

## 2. 解决邮件发送 500 错误

您看到的 `HTTP 500` 意味着后端代码执行出错了。为了找出原因，我们需要查看 **Vercel 的服务器日志**。

### 第一步：确保代码已更新
我之前帮您修改了 `api/send-email.ts`（移除了 Edge Runtime，改用更稳定的 Node.js 模式）。
请确保您已经将这些更改推送到 GitHub：
```bash
git add .
git commit -m "Fix email API runtime and logging"
git push origin main
```
*(推送到 GitHub 后，Vercel 会自动重新部署)*

### 第二步：查看报错详情 (这是解决问题的关键)
1.  登录 [Vercel Dashboard](https://vercel.com/dashboard)。
2.  进入您的项目 `icpc-registry`。
3.  点击顶部的 **Logs** 标签页。
4.  在日志搜索框或过滤器中，选择 **Functions**（或者只看带有 `ERROR` 标记的日志）。
5.  再次在您的网站上尝试发送邮件。
6.  回到 Vercel Logs，您应该能看到一条红色的报错信息。

**常见的错误原因及对策：**

*   **Error: RESEND_API_KEY is missing**
    *   **原因**：环境变量没配好。
    *   **解决**：去 Vercel Settings -> Environment Variables，检查 `RESEND_API_KEY` 是否存在，且没有多余的空格。修改后必须 **Redeploy** (Deployments -> 选最新的 -> Redeploy)。

*   **Error: 403 Forbidden / invalid_api_key**
    *   **原因**：Key 填错了，或者被 Resend 禁用了。
    *   **解决**：去 Resend 生成一个新的 Key 并更新到 Vercel。

*   **Error: 400 Bad Request / validation_error**
    *   **原因**：**Resend 免费版限制**。
    *   **现象**：您尝试发给 `octal_zhihao@qq.com`，但这个邮箱**不是**您注册 Resend 时的邮箱。
    *   **解决**：在 Resend 测试模式下，您**只能**发给自己（注册 Resend 的那个邮箱）。或者，您需要在 Resend 中添加并验证一个域名（Domain），才能发给任意人。

请您先完成 Supabase 的 CORS 配置，然后去 Vercel 查看具体的报错日志。如果看不懂日志，请截图或复制日志内容发给我。
