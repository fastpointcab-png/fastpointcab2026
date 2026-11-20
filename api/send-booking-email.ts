const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_PAYLOAD_BYTES = 150_000;
const REQUEST_TIMEOUT_MS = 8000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const emailAttempts = new Map<string, { accepted: boolean; messageId?: string; expiresAt: number }>();
const validateBrevoRequest = (req: any) => {
  const origin = req.headers?.origin;
  const allowedOrigin = !origin || /^(https?:\/\/)(www\.)?fastpointcab\.in$/.test(origin) || /^https?:\/\/localhost(?::\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin);
  if (!allowedOrigin) return { ok: false, status: 403, error: 'Request origin not allowed' };
  if (JSON.stringify(req.body || {}).length > MAX_PAYLOAD_BYTES) return { ok: false, status: 413, error: 'Request payload is too large' };
  const forwarded = req.headers?.['x-forwarded-for'];
  const client = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.headers?.['x-real-ip'] || 'unknown-client';
  const key = `lead:${client}`;
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || entry.resetAt <= now) rateLimits.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else if (entry.count >= MAX_REQUESTS_PER_WINDOW) return { ok: false, status: 429, error: 'Too many email requests' };
  else entry.count += 1;
  return { ok: true as const };
};
const validateEmailContent = (content: any) => Boolean(content && typeof content === 'object' && content.sender?.email === 'fastpointcab@gmail.com' && Array.isArray(content.to) && content.to.length === 1 && content.to[0]?.email === 'fastpointcab@gmail.com' && typeof content.subject === 'string' && content.subject.length > 0 && content.subject.length <= 240 && typeof content.htmlContent === 'string' && content.htmlContent.length > 0 && content.htmlContent.length <= 120_000);
const getEmailAttempt = (key: string) => {
  const attempt = emailAttempts.get(key);
  if (!attempt || attempt.expiresAt <= Date.now()) { emailAttempts.delete(key); return undefined; }
  return attempt;
};
const rememberEmailAttempt = (key: string, accepted: boolean, messageId?: string) => emailAttempts.set(key, { accepted, messageId, expiresAt: Date.now() + WINDOW_MS });
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const requestCheck = validateBrevoRequest(req);
  if (!requestCheck.ok) {
    res.status(requestCheck.status).json({ error: requestCheck.error });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const emailContent = req.body?.emailContent;
  const bookingDetails = req.body?.bookingDetails;
  const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId : '';
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL;

  if (!bookingId || bookingId.length > 100 || !scriptUrl || !validateEmailContent(emailContent) || !/^.*ABANDONED LEAD:\s/.test(emailContent.subject) || !bookingDetails || typeof bookingDetails.phone !== 'string' || !/^[6-9]\d{9}$/.test(bookingDetails.phone) || typeof bookingDetails.pickup !== 'string' || bookingDetails.pickup.length === 0 || bookingDetails.pickup.length > 500) {
    res.status(400).json({ error: 'Invalid booking email request' });
    return;
  }

  const attemptKey = bookingId || `lead:${emailContent.subject}`;
  const previousAttempt = getEmailAttempt(attemptKey);
  if (previousAttempt) {
    res.status(200).json({ ok: previousAttempt.accepted, messageId: previousAttempt.messageId, duplicate: true });
    return;
  }

  try {
    const sheetResponse = await withTimeout(fetch(scriptUrl, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ ...bookingDetails, bookingId, timestamp: new Date().toISOString() }),
    }), REQUEST_TIMEOUT_MS);
    const sheetText = await sheetResponse.text();
    let sheetBody: any = {};
    try { sheetBody = sheetText ? JSON.parse(sheetText) : {}; } catch { /* Existing Apps Script deployments may return plain text. */ }
    if (!sheetResponse.ok || sheetBody?.success === false || sheetBody?.ok === false || sheetBody?.error) {
      res.status(502).json({ error: 'Booking could not be recorded', bookingId, uncertain: !sheetResponse.ok });
      return;
    }

    if (!apiKey) {
      console.error('BREVO_API_KEY is not configured for abandoned booking notification', { bookingId });
      res.status(201).json({ ok: true, bookingId, persisted: true, emailAccepted: false });
      return;
    }

    const response = await withTimeout(fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    }), REQUEST_TIMEOUT_MS);

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      rememberEmailAttempt(attemptKey, false);
      console.error('Brevo rejected booking email', {
        status: response.status,
        code: responseBody?.code,
        message: responseBody?.message,
      });
      res.status(response.status).json({ error: 'Booking email could not be sent' });
      return;
    }

    rememberEmailAttempt(attemptKey, true, responseBody?.messageId);
    console.info('Brevo accepted booking email', {
      messageId: responseBody?.messageId,
    });
    res.status(201).json({ ok: true, bookingId, persisted: true, emailAccepted: true, emailMessageId: responseBody?.messageId });
  } catch (error) {
    rememberEmailAttempt(attemptKey, false);
    console.error('Abandoned booking persistence or email request failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    res.status(502).json({ error: 'Booking notification service unavailable', bookingId, uncertain: true });
  }
}
