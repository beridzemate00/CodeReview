import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    message?: string;      // Custom error message
    keyGenerator?: (req: Request) => string;
}

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts) {
        if (now > data.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 60000); // Clean up every minute

export const createRateLimiter = (config: RateLimitConfig) => {
    const {
        windowMs = 60000,
        maxRequests = 100,
        message = 'Too many requests, please try again later.',
        keyGenerator = (req: Request) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown'
    } = config;

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyGenerator(req);
        const now = Date.now();
        let record = requestCounts.get(key);

        if (!record || now > record.resetTime) {
            record = { count: 1, resetTime: now + windowMs };
            requestCounts.set(key, record);
        } else {
            record.count++;
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

        if (record.count > maxRequests) {
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
            return;
        }

        next();
    };
};

// Preset rate limiters for different use cases
export const rateLimiters = {
    // General API: 100 requests per minute
    general: createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        message: 'Too many requests. Please wait a moment.'
    }),

    // Auth endpoints: 10 requests per minute (prevent brute force)
    auth: createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        message: 'Too many authentication attempts. Please try again in a minute.'
    }),

    // AI/Review: 20 requests per minute (expensive operations)
    review: createRateLimiter({
        windowMs: 60000,
        maxRequests: 20,
        message: 'Too many review requests. Please wait before submitting more code.'
    }),

    // Strict: 5 requests per minute (password reset, etc.)
    strict: createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        message: 'Rate limit exceeded. Please try again later.'
    }),

    // Upload: 10 requests per 5 minutes
    upload: createRateLimiter({
        windowMs: 300000,
        maxRequests: 10,
        message: 'Too many uploads. Please wait before uploading more files.'
    })
};

export default rateLimiters;
