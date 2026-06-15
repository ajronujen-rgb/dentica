/**
 * Vercel Serverless — Telegram Relay
 * Принимает POST от любого сервера (в т.ч. из РФ за блокировками)
 * и отправляет в Telegram API.
 * 
 * Может использоваться любым клиентом через HTTP POST.
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { chat_id, text, bot_token, parse_mode = 'HTML' } = req.body || {};

  if (!chat_id || !text) {
    return res.status(400).json({ error: 'chat_id and text required' });
  }

  const token = bot_token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'No bot token' });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: Number(chat_id),
          text: text,
          parse_mode: parse_mode,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(502).json({ error: 'Telegram API error', detail: data.description });
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Telegram API timeout' });
    }
    return res.status(500).json({ error: err.message });
  }
}