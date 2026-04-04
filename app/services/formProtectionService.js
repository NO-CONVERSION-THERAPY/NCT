const crypto = require('crypto');

// 对外配置可能来自环境变量，先统一规整成安全可用的正整数。
function normalizePositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

// token 的主体固定为 "签发时间.随机 nonce"，便于前后端共享同一格式。
function buildTokenPayload(issuedAt, nonce) {
  return `${issuedAt}.${nonce}`;
}

// 只对 payload 做 HMAC，不把 secret 本身写进 token。
function signTokenPayload(payload, secret) {
  return crypto.createHmac('sha256', String(secret || '')).update(payload).digest('hex');
}

// 使用 timingSafeEqual 避免通过比较耗时推测签名内容。
function secureEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

// 生成给表单页面下发的防护 token，既能校验来源，也能估算填写耗时。
function issueFormProtectionToken({ secret, issuedAt = Date.now() } = {}) {
  const normalizedIssuedAt = normalizePositiveInteger(issuedAt, Date.now());
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = buildTokenPayload(normalizedIssuedAt, nonce);
  const signature = signTokenPayload(payload, secret);

  return `${payload}.${signature}`;
}

// 校验顺序刻意从“低成本”到“高成本”：蜜罐 -> 格式 -> 签名 -> 时间窗口。
function validateFormProtection({
  token,
  honeypotValue,
  secret,
  minFillMs = 3000,
  maxAgeMs = 24 * 60 * 60 * 1000,
  now = Date.now()
} = {}) {
  const normalizedHoneypot = String(honeypotValue || '').trim();
  if (normalizedHoneypot) {
    return {
      ok: false,
      reason: 'honeypot_filled'
    };
  }

  const tokenMatch = /^(\d{10,16})\.([a-f0-9]{32})\.([a-f0-9]{64})$/i.exec(String(token || '').trim());
  if (!tokenMatch) {
    return {
      ok: false,
      reason: 'invalid_token'
    };
  }

  const issuedAt = Number.parseInt(tokenMatch[1], 10);
  const nonce = tokenMatch[2];
  const signature = tokenMatch[3];
  const payload = buildTokenPayload(issuedAt, nonce);
  const expectedSignature = signTokenPayload(payload, secret);

  if (!secureEquals(signature, expectedSignature)) {
    return {
      ok: false,
      reason: 'invalid_token'
    };
  }

  const ageMs = now - issuedAt;
  const normalizedMinFillMs = normalizePositiveInteger(minFillMs, 3000);
  const normalizedMaxAgeMs = normalizePositiveInteger(maxAgeMs, 24 * 60 * 60 * 1000);

  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return {
      ok: false,
      reason: 'invalid_token',
      ageMs
    };
  }

  if (ageMs < normalizedMinFillMs) {
    return {
      ok: false,
      reason: 'submitted_too_quickly',
      ageMs
    };
  }

  if (ageMs > normalizedMaxAgeMs) {
    return {
      ok: false,
      reason: 'expired_token',
      ageMs
    };
  }

  return {
    ok: true,
    ageMs,
    issuedAt
  };
}

module.exports = {
  issueFormProtectionToken,
  validateFormProtection
};
