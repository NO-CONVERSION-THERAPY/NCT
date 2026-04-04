const path = require('path');

function normalizeRuntimeTarget(value) {
  return String(value || '').trim().toLowerCase();
}

function isLikelyWorkersRuntimeFromGlobals() {
  return typeof navigator !== 'undefined'
    && navigator
    && navigator.userAgent === 'Cloudflare-Workers';
}

function isWorkersRuntime() {
  const runtimeTarget = normalizeRuntimeTarget(process.env.RUNTIME_TARGET);

  return runtimeTarget === 'workers'
    || String(process.env.CF_PAGES || '').trim() === '1'
    || isLikelyWorkersRuntimeFromGlobals();
}

function normalizeBundleRelativePath(relativePath) {
  return String(relativePath || '')
    .replace(/^\.?\/*/, '')
    .replace(/\\/g, '/');
}

function resolveProjectPath(relativePath) {
  if (isWorkersRuntime()) {
    return path.posix.join('/bundle', normalizeBundleRelativePath(relativePath));
  }

  return path.join(__dirname, '..', relativePath);
}

module.exports = {
  isWorkersRuntime,
  resolveProjectPath
};
