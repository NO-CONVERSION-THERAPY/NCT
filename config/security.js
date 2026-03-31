const rateLimit = require('express-rate-limit');

// Helmet 的 CSP 在这里统一配置，避免散落在入口文件里。
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", 'https://docs.google.com'],
      frameAncestors: ["'none'"]
    }
  }
};

const requestBodyLimits = {
  json: '50kb',
  urlencoded: '50kb'
};

// 表单提交限流单独封装，方便在 route 层直接创建并接审计回调。
function createSubmitRateLimiter({ max, onLimit }) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number.isFinite(max) && max > 0 ? max : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: '提交過於頻繁，請稍後再試。',
    handler(req, res, _next, options) {
      if (typeof onLimit === 'function') {
        onLimit(req, options.statusCode, options.message);
      }
      res.status(options.statusCode).send(options.message);
    }
  });
}

module.exports = {
  createSubmitRateLimiter,
  helmetConfig,
  requestBodyLimits
};
