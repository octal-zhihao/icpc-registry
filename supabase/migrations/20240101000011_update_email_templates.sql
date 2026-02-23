-- Update email templates with more professional content and placeholders
UPDATE email_templates
SET subject = '【云南大学ICPC集训队】2026赛季校赛报名审核通过通知',
    content = '<p>亲爱的 {{name}} 同学：</p>
<p>您好！</p>
<p>恭喜您！您提交的云南大学 ICPC 校赛报名申请已通过审核。</p>
<p>接下来，请您关注以下事项：</p>
<ol>
<li><strong>加入官方比赛群</strong>：请务必尽快加入本次校赛的官方 QQ 群（群号：123456789），后续的比赛通知、账号分发及重要公告将在群内发布。入群请备注“姓名-专业”。</li>
<li><strong>比赛时间与地点</strong>：
<ul>
<li>热身赛：2026年X月X日 XX:XX - XX:XX，地点：XXXX实验室</li>
<li>正式赛：2026年X月X日 XX:XX - XX:XX，地点：XXXX实验室</li>
</ul>
</li>
<li><strong>赛前准备</strong>：请提前熟悉比赛使用的 OJ 平台，并准备好学生证以便现场核验身份。</li>
</ol>
<p>期待您在赛场上的精彩表现！如有疑问，请在群内联系管理员。</p>
<br>
<p style="color: #666; font-size: 14px;">云南大学 ICPC 集训队<br>2026年</p>'
WHERE template_type = 'approved';

UPDATE email_templates
SET subject = '【云南大学ICPC集训队】2026赛季校赛报名审核结果通知',
    content = '<p>亲爱的 {{name}} 同学：</p>
<p>您好！</p>
<p>感谢您报名参加云南大学 ICPC 校赛。</p>
<p>经过组委会的仔细审核，我们很遗憾地通知您，您的本次报名未能通过。</p>
<p>这主要是由于本次比赛的名额实在有些紧张，虽然您的热情我们已经收到，但受限于机位和场地资源，我们无法满足所有的参赛意愿。</p>
<p>希望您不要气馁，继续保持对算法竞赛的热爱，不断提升自己。欢迎您关注我们后续举办的其他活动或讲座，也期待在未来的比赛中再次见到您的身影。</p>
<br>
<p style="color: #666; font-size: 14px;">云南大学 ICPC 集训队<br>2026年</p>'
WHERE template_type = 'rejected';
