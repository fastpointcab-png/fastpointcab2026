const REQUEST_TIMEOUT_MS = 5000;

const asPositive = (value: unknown) => value === true || value === 'true';

const isRecordedResponse = (data: any, bookingId: string): boolean => {
  const candidates = [data, data?.data, data?.result, data?.record].filter(Boolean);
  return candidates.some((candidate) => {
    if (typeof candidate !== 'object') return false;
    const status = typeof candidate.status === 'string' ? candidate.status.toLowerCase() : '';
    return asPositive(candidate.found) || asPositive(candidate.exists) || asPositive(candidate.success) ||
      asPositive(candidate.ok) || ['recorded', 'saved', 'success', 'ok', 'confirmed'].includes(status) ||
      candidate.bookingId === bookingId;
  });
};

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
      res.status(502).json({ found: false, uncertain: true });
      return;
    }
    const text = (await response.text()).trim();
    if (!text) {
      res.status(502).json({ found: false, uncertain: true });
      return;
    }
    try {
      const data = JSON.parse(text);
      if (data?.success === false || data?.ok === false || data?.error) {
        res.status(502).json({ found: false, uncertain: true });
        return;
      }
      res.status(200).json({ found: isRecordedResponse(data, bookingId), uncertain: false });
    } catch {
      const normalized = text.toLowerCase();
      if (/^(found|recorded|saved|success|ok|true)$/.test(normalized)) {
        res.status(200).json({ found: true, uncertain: false });
      } else {
        res.status(502).json({ found: false, uncertain: true });
      }
    }
  } catch {
    res.status(504).json({ found: false, uncertain: true });
  } finally {
    clearTimeout(timeout);
  }
}
