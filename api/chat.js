/**
 * API прокси для Triage Agent Dentica
 * Vercel Serverless Function — HTTPS → HTTP к серверу
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    const response = await fetch('http://72.56.241.48/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, message }),
      // Таймаут 30 секунд (LLM может отвечать долго)
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Agent error', detail: text });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Agent timeout' });
    }
    return res.status(500).json({ error: err.message });
  }
}