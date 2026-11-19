export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const emailContent = req.body?.emailContent;

  if (!apiKey || !emailContent || typeof emailContent !== 'object') {
    res.status(400).json({ error: 'Email service is not configured' });
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
      console.error('Brevo rejected booking email', {
        status: response.status,
        code: responseBody?.code,
        message: responseBody?.message,
      });
      res.status(response.status).json({ error: 'Booking email could not be sent' });
      return;
    }

    console.info('Brevo accepted booking email', {
      messageId: responseBody?.messageId,
    });
    res.status(200).json({ ok: true, messageId: responseBody?.messageId });
  } catch (error) {
    console.error('Brevo booking email request failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    res.status(502).json({ error: 'Booking email service unavailable' });
  }
}
