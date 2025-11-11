import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * In-memory rate limiting store
 * In production, use Redis for distributed rate limiting
 */
class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Clean up expired entries
    if (entry && entry.resetTime < now) {
      this.store.delete(identifier);
    }

    const current = this.store.get(identifier);

    if (!current) {
      // First request in window
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    if (current.count >= limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    // Increment count
    current.count++;
    this.store.set(identifier, current);

    return {
      allowed: true,
      remaining: limit - current.count,
      resetTime: current.resetTime,
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Rate limit tiers based on user role
 */
export const RATE_LIMITS = {
  FREE: {
    perHour: 100,
    perMinute: 20,
  },
  PREMIUM: {
    perHour: 1000,
    perMinute: 100,
  },
  ADMIN: {
    perHour: 10000,
    perMinute: 500,
  },
} as const;

/**
 * Get identifier for rate limiting
 * Uses IP address and user ID if available
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip')
    || 'unknown';

  return userId ? `${userId}:${ip}` : ip;
}

/**
 * Apply rate limiting based on user tier
 */
export async function applyRateLimit(
  request: NextRequest,
  userId?: string,
  userRole: 'USER' | 'PREMIUM' | 'ADMIN' = 'USER'
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request, userId);
  const limits = userRole === 'ADMIN'
    ? RATE_LIMITS.ADMIN
    : userRole === 'PREMIUM'
    ? RATE_LIMITS.PREMIUM
    : RATE_LIMITS.FREE;

  // Check per-minute limit
  const minuteCheck = await rateLimiter.check(
    `${identifier}:minute`,
    limits.perMinute,
    60 * 1000
  );

  if (!minuteCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((minuteCheck.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((minuteCheck.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limits.perMinute),
          'X-RateLimit-Remaining': String(minuteCheck.remaining),
          'X-RateLimit-Reset': new Date(minuteCheck.resetTime).toISOString(),
        },
      }
    );
  }

  // Check per-hour limit
  const hourCheck = await rateLimiter.check(
    `${identifier}:hour`,
    limits.perHour,
    60 * 60 * 1000
  );

  if (!hourCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Hourly rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((hourCheck.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((hourCheck.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limits.perHour),
          'X-RateLimit-Remaining': String(hourCheck.remaining),
          'X-RateLimit-Reset': new Date(hourCheck.resetTime).toISOString(),
        },
      }
    );
  }

  // Rate limit passed
  return null;
}

/**
 * Special rate limit for authentication endpoints
 */
export async function authRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip')
    || 'unknown';

  // Strict rate limit: 5 attempts per 15 minutes
  const check = await rateLimiter.check(`auth:${ip}`, 5, 15 * 60 * 1000);

  if (!check.allowed) {
    return NextResponse.json(
      {
        error: 'Too many authentication attempts',
        message: 'Please try again later.',
        retryAfter: Math.ceil((check.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((check.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Sliding window counter for more accurate rate limiting
 * Use this for critical endpoints
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async check(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests
    const existingRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const recentRequests = existingRequests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  cleanup() {
    const now = Date.now();
    const maxWindow = 60 * 60 * 1000; // 1 hour

    for (const [key, times] of this.requests.entries()) {
      const recent = times.filter((time) => now - time < maxWindow);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}
