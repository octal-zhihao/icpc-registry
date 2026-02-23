# 修正登录链接跳转问题

邮件链接依然指向 `localhost:3000` 是因为 Supabase 后台的 **默认站点 URL (Site URL)** 还没有修改。

请按照以下步骤操作，这将彻底解决问题：

1.  登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2.  进入您的项目 (`icpc-registry`)。
3.  点击左侧菜单底部的 **Authentication** -> **URL Configuration**。
4.  **修改 Site URL (关键步骤)**：
    *   将 `Site URL` 从 `http://localhost:3000` 修改为：
        `https://icpc-registry.vercel.app`
5.  **检查 Redirect URLs**：
    *   确保列表中包含：
        `https://icpc-registry.vercel.app/**`
    *   如果没有，请点击 "Add URL" 添加。
6.  点击 **Save** 保存。

**保存后，请再次在您的网站上发送登录邮件。**
新的邮件链接应该就会以 `https://icpc-registry.vercel.app` 开头了。
