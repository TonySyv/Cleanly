import crypto from 'crypto';

/**
 * Request logging middleware. Covers all API routes with a consistent log line:
 * timestamp, request id, method, path, status, duration, userId (when present).
 * Health checks are logged in a shortened form to reduce noise.
 */
export function requestLogger(req, res, next) {
  const id = crypto.randomBytes(4).toString('hex');
  req.id = id;
  res.locals.requestId = id;

  const start = Date.now();
  const isHealth = req.method === 'GET' && req.originalUrl === '/api/v1/health';

  res.on('finish', () => {
    const ms = Date.now() - start;
    const userId = req.userId ?? '-';

    if (isHealth) {
      console.log(`[${new Date().toISOString()}] id=${id} health ok ${ms}ms`);
      return;
    }

    console.log(
      `[${new Date().toISOString()}] id=${id} method=${req.method} path=${req.originalUrl} status=${res.statusCode} duration=${ms}ms userId=${userId}`
    );
  });

  next();
}
