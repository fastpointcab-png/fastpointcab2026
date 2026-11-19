const REQUEST_TIMEOUT_MS = 5000;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const bookingId = typeof req.query?.bookingId === 'string' ? req.query.bookingId : '';
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL;
  if (!bookingId || !scriptUrl) {
    res.status(400).json({ found: false });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}bookingId=${encodeURIComponent(bookingId)}`, { signal: controller.signal });
    if (!response.ok) {
      res.status(502).json({ found: false });
      return;
    }
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(200).json({ found: data?.found === true || data?.status === 'recorded' });
    } catch {
      res.status(200).json({ found: false });
    }
  } catch {
    res.status(504).json({ found: false });
  } finally {
    clearTimeout(timeout);
  }
}
