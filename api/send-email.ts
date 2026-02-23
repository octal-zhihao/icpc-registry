import { Resend } from 'resend';

// 使用默认的 Node.js Runtime，而不是 Edge Runtime，以获得更好的兼容性
// export const config = {
//   runtime: 'edge',
// };

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // 处理 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Attempting to send email to ${to} with subject "${subject}"`);

    const { data, error } = await resend.emails.send({
      from: 'Zhihao Zhou <noreply@octalzhihao.top>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(400).json({ error: error.message || error });
    }

    console.log('Email sent successfully:', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
