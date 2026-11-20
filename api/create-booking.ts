const REQUEST_TIMEOUT_MS = 8000;
const BREVO_TIMEOUT_MS = 3000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_PAYLOAD_BYTES = 150_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const emailAttempts = new Map<string, { accepted: boolean; messageId?: string; expiresAt: number }>();
const validateBrevoRequest = (req: any) => {
  const origin = req.headers?.origin;
  const allowedOrigin = !origin || /^(https?:\/\/)(www\.)?fastpointcab\.in$/.test(origin) || /^https?:\/\/localhost(?::\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin);
  if (!allowedOrigin) return { ok: false, status: 403, error: 'Request origin not allowed' };
  if (JSON.stringify(req.body || {}).length > MAX_PAYLOAD_BYTES) return { ok: false, status: 413, error: 'Request payload is too large' };
  const forwarded = req.headers?.['x-forwarded-for'];
  const client = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.headers?.['x-real-ip'] || 'unknown-client';
  const key = `booking:${client}`;
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

const withTimeout = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const requestCheck = validateBrevoRequest(req);
  if (!requestCheck.ok) {
    res.status(requestCheck.status).json({ error: requestCheck.error, uncertain: false });
    return;
  }

  const bookingDetails = req.body?.bookingDetails;
  const emailContent = req.body?.emailContent;
  const bookingId = bookingDetails?.leadId;
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL;
  const apiKey = process.env.BREVO_API_KEY;

  if (
    !bookingDetails || typeof bookingDetails !== 'object' ||
    typeof bookingId !== 'string' || bookingId.length > 100 ||
    typeof bookingDetails.phone !== 'string' || !/^[6-9]\d{9}$/.test(bookingDetails.phone) ||
    typeof bookingDetails.pickup !== 'string' || bookingDetails.pickup.length < 1 || bookingDetails.pickup.length > 500 ||
    typeof bookingDetails.drop !== 'string' || bookingDetails.drop.length > 500 ||
    typeof bookingDetails.vehicleType !== 'string' || typeof bookingDetails.tripType !== 'string' ||
    !validateEmailContent(emailContent)
  ) {
    res.status(400).json({ error: 'Booking details and booking ID are required' });
    return;
  }

  const previousAttempt = getEmailAttempt(bookingId);
  if (previousAttempt) {
    res.status(201).json({ ok: true, bookingId, persisted: true, emailAccepted: previousAttempt.accepted, emailMessageId: previousAttempt.messageId, duplicate: true });
    return;
  }

  if (!scriptUrl) {
    console.error('Booking persistence is not configured');
    res.status(503).json({ error: 'Booking persistence is not configured', uncertain: false });
    return;
  }

  try {
    // The booking ID is sent to the Apps Script so its handler can treat retries
    // as idempotent. Do not move the email call ahead of this durable write.
    const sheetResponse = await withTimeout(scriptUrl, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({
        ...bookingDetails,
        bookingId,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      }),
    });

    const sheetResponseText = await sheetResponse.text();
    let sheetResponseBody: any = null;
    try {
      sheetResponseBody = sheetResponseText ? JSON.parse(sheetResponseText) : null;
    } catch {
      // Existing Apps Script deployments may return an empty or non-JSON success body.
    }

    if (!sheetResponse.ok || sheetResponseBody?.success === false || sheetResponseBody?.ok === false || sheetResponseBody?.error) {
      console.error(`Booking persistence failed with status ${sheetResponse.status}`);
      res.status(502).json({ error: 'Booking could not be recorded', uncertain: false });
      return;
    }
  } catch (error) {
    const uncertain = error instanceof Error && error.name === 'AbortError';
    console.error('Booking persistence request failed', { bookingId, uncertain });
    res.status(uncertain ? 504 : 502).json({
      error: uncertain ? 'Booking status is uncertain' : 'Booking could not be recorded',
      bookingId,
      uncertain,
    });
    return;
  }

  let emailAccepted = false;
  let emailMessageId: string | undefined;
  if (apiKey && emailContent && typeof emailContent === 'object') {
    try {
      const emailResponse = await (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);
        try {
          return await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'api-key': apiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify(emailContent),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
      })();
      const emailResponseBody = await emailResponse.json().catch(() => ({}));
      emailAccepted = emailResponse.ok;
      emailMessageId = emailResponseBody?.messageId;
      if (!emailAccepted) {
        rememberEmailAttempt(bookingId, false);
        console.error('Brevo rejected booking email', {
          bookingId,
          status: emailResponse.status,
          code: emailResponseBody?.code,
          message: emailResponseBody?.message,
        });
      } else {
        console.info('Brevo accepted booking email', { bookingId, messageId: emailMessageId });
      }
    } catch (error) {
      rememberEmailAttempt(bookingId, false);
      console.error('Brevo booking email request failed', {
        bookingId,
        error: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  } else {
    console.error('Brevo is not configured for booking email', { bookingId });
  }

  // A booking is successful once it is recorded. Brevo acceptance is reported
  // separately; a 2xx response from Brevo is not claimed to mean delivery.
  res.status(201).json({ ok: true, bookingId, persisted: true, emailAccepted, emailMessageId });
}
