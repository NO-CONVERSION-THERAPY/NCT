const crypto = require('crypto');

function normalizePositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function buildTokenPayload(issuedAt, payloadHash) {
  return `${issuedAt}.${payloadHash}`;
}

function hashPayload(payload) {
  return crypto.createHash('sha256').update(String(payload || ''), 'utf8').digest('hex');
}

function signTokenPayload(payload, secret) {
  return crypto.createHmac('sha256', String(secret || '')).update(payload).digest('hex');
}

function secureEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function issueFormConfirmationToken({ payload, secret, issuedAt = Date.now() } = {}) {
  const normalizedIssuedAt = normalizePositiveInteger(issuedAt, Date.now());
  const payloadHash = hashPayload(payload);
  const tokenPayload = buildTokenPayload(normalizedIssuedAt, payloadHash);
  const signature = signTokenPayload(tokenPayload, secret);

  return `${tokenPayload}.${signature}`;
}

function validateFormConfirmation({
  token,
  payload,
  secret,
  maxAgeMs = 24 * 60 * 60 * 1000,
  now = Date.now()
} = {}) {
  const tokenMatch = /^(\d{10,16})\.([a-f0-9]{64})\.([a-f0-9]{64})$/i.exec(String(token || '').trim());
  if (!tokenMatch) {
    return {
      ok: false,
      reason: 'invalid_token'
    };
  }

  const issuedAt = Number.parseInt(tokenMatch[1], 10);
  const expectedPayloadHash = tokenMatch[2];
  const signature = tokenMatch[3];
  const actualPayloadHash = hashPayload(payload);

  if (!secureEquals(expectedPayloadHash, actualPayloadHash)) {
    return {
      ok: false,
      reason: 'invalid_token'
    };
  }

  const tokenPayload = buildTokenPayload(issuedAt, expectedPayloadHash);
  const expectedSignature = signTokenPayload(tokenPayload, secret);
  if (!secureEquals(signature, expectedSignature)) {
    return {
      ok: false,
      reason: 'invalid_token'
    };
  }

  const ageMs = now - issuedAt;
  const normalizedMaxAgeMs = normalizePositiveInteger(maxAgeMs, 24 * 60 * 60 * 1000);

  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return {
      ok: false,
      reason: 'invalid_token',
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
  issueFormConfirmationToken,
  validateFormConfirmation
};
