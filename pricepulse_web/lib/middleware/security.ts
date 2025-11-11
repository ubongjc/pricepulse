import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware
 * Implements OWASP security best practices
 */
export function securityHeaders(response: NextResponse): NextResponse {
  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.accounts.dev https://clerk.com https://api.stripe.com https://sentry.io",
      "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com",
      "form-action 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy but still good)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(self), interest-cohort=()'
  );

  // Remove powered-by header
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * CSRF protection
 * Validates Origin and Referer headers for state-changing requests
 */
export function csrfProtection(request: NextRequest): boolean {
  const { method, headers } = request;

  // Only check state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  const origin = headers.get('origin');
  const referer = headers.get('referer');
  const host = headers.get('host');

  // Check if request is from same origin
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      console.warn(`CSRF: Origin mismatch - ${originHost} !== ${host}`);
      return false;
    }
  } else if (referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      console.warn(`CSRF: Referer mismatch - ${refererHost} !== ${host}`);
      return false;
    }
  } else {
    // No origin or referer header (suspicious)
    console.warn('CSRF: No origin or referer header');
    return false;
  }

  return true;
}

/**
 * Input sanitization helper
 * Prevents XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * SQL injection prevention
 * Note: Prisma uses parameterized queries by default, but this is an extra check
 */
export function validateSqlInput(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /('|"|`)/gi,
  ];

  return !sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate file upload
 * Prevents malicious file uploads
 */
export function validateFileUpload(
  filename: string,
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  // Allowed image types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Max file size: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (size > maxSize) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }

  // Validate filename (no path traversal)
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
}

/**
 * Detect suspicious patterns in user input
 */
export function detectSuspiciousActivity(input: string): boolean {
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /%3Cscript/gi,
    /eval\(/gi,
    /expression\(/gi,
    /@import/gi,
    /vbscript:/gi,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
