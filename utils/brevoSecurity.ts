type BrevoRequestKind = 'booking' | 'lead';

type RateEntry = { count: number; resetAt: number };
type EmailAttempt = { accepted: boolean; messageId?: string; expiresAt: number };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_PAYLOAD_BYTES = 150_000;
const rateLimits = new Map<string, RateEntry>();
const emailAttempts = new Map<string, EmailAttempt>();

const getClientKey = (req: any) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  return (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '')
    || req.headers?.['x-real-ip']
    || 'unknown-client';
};

const isAllowedOrigin = (req: any) => {
  const origin = req.headers?.origin;
  if (!origin) return true;
  return /^(https?:\/\/)(www\.)?fastpointcab\.in$/.test(origin)
    || /^https?:\/\/localhost(?::\d+)?$/.test(origin)
    || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin);
};

export const validateBrevoRequest = (req: any, kind: BrevoRequestKind) => {
  if (!isAllowedOrigin(req)) return { ok: false, status: 403, error: 'Request origin not allowed' };

  const bodySize = JSON.stringify(req.body || {}).length;
  if (bodySize > MAX_PAYLOAD_BYTES) return { ok: false, status: 413, error: 'Request payload is too large' };

  const key = `${kind}:${getClientKey(req)}`;
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, status: 429, error: 'Too many email requests' };
  } else {
    current.count += 1;
  }

  return { ok: true as const };
};

export const validateEmailContent = (emailContent: any) => {
  const senderEmail = emailContent?.sender?.email;
  const recipientEmail = emailContent?.to?.[0]?.email;
  return Boolean(
    emailContent && typeof emailContent === 'object' &&
    senderEmail === 'fastpointcab@gmail.com' &&
    Array.isArray(emailContent.to) && emailContent.to.length === 1 &&
    recipientEmail === 'fastpointcab@gmail.com' &&
    typeof emailContent.subject === 'string' && emailContent.subject.length > 0 && emailContent.subject.length <= 240 &&
    typeof emailContent.htmlContent === 'string' && emailContent.htmlContent.length > 0 && emailContent.htmlContent.length <= 120_000
  );
};

export const getEmailAttempt = (key: string) => {
  const attempt = emailAttempts.get(key);
  if (!attempt || attempt.expiresAt <= Date.now()) {
    emailAttempts.delete(key);
    return undefined;
  }
  return attempt;
};

export const rememberEmailAttempt = (key: string, attempt: Omit<EmailAttempt, 'expiresAt'>) => {
  emailAttempts.set(key, { ...attempt, expiresAt: Date.now() + WINDOW_MS });
};
