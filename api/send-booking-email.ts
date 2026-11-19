import { getEmailAttempt, rememberEmailAttempt, validateBrevoRequest, validateEmailContent } from './_brevoSecurity';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const requestCheck = validateBrevoRequest(req, 'lead');
  if (!requestCheck.ok) {
    res.status(requestCheck.status).json({ error: requestCheck.error });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const emailContent = req.body?.emailContent;
  const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId : '';

  if (!apiKey || !validateEmailContent(emailContent) || !/^.*ABANDONED LEAD:\s/.test(emailContent.subject)) {
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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      rememberEmailAttempt(attemptKey, { accepted: false });
      console.error('Brevo rejected booking email', {
        status: response.status,
        code: responseBody?.code,
        message: responseBody?.message,
      });
      res.status(response.status).json({ error: 'Booking email could not be sent' });
      return;
    }

    rememberEmailAttempt(attemptKey, { accepted: true, messageId: responseBody?.messageId });
    console.info('Brevo accepted booking email', {
      messageId: responseBody?.messageId,
    });
    res.status(200).json({ ok: true, messageId: responseBody?.messageId });
  } catch (error) {
    rememberEmailAttempt(attemptKey, { accepted: false });
    console.error('Brevo booking email request failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    res.status(502).json({ error: 'Booking email service unavailable' });
  }
}
