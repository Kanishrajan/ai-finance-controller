import crypto from 'crypto';

export function requestIdMiddleware(req, res, next) {
  req.id = req.headers['x-request-id'] || `req-${crypto.randomUUID()}`;
  res.setHeader('X-Request-Id', req.id);
  next();
}

// In-memory token bucket rate limiter
const requestCounts = new Map();

export function rateLimiter({ maxRequests = 100, windowMs = 60000 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    requestCounts.set(key, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please throttle your reconciliation calls.'
        }
      });
    }

    next();
  };
}

export function errorHandler(err, req, res, next) {
  console.error(`[Error] Request ${req.id} failed:`, err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      request_id: req.id
    }
  });
}
