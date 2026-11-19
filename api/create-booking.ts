import { getEmailAttempt, rememberEmailAttempt, validateBrevoRequest, validateEmailContent } from '../utils/brevoSecurity';

const REQUEST_TIMEOUT_MS = 8000;

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

  const requestCheck = validateBrevoRequest(req, 'booking');
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

    if (!sheetResponse.ok) {
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
      const emailResponse = await withTimeout('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailContent),
      });
      const emailResponseBody = await emailResponse.json().catch(() => ({}));
      emailAccepted = emailResponse.ok;
      emailMessageId = emailResponseBody?.messageId;
      if (!emailAccepted) {
        rememberEmailAttempt(bookingId, { accepted: false });
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
      rememberEmailAttempt(bookingId, { accepted: false });
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
