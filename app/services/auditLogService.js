// 优先取反向代理透传的 IP，没有时再退回到 Express / socket 提供的地址。
function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// 审计日志只记录提交行为的关键元信息，不直接打印整份表单内容。
function logAuditEvent(req, event, details = {}) {
  const entry = {
    time: new Date().toISOString(),
    ip: getClientIp(req),
    method: req.method,
    path: req.originalUrl || req.path,
    event,
    ...details
  };

  console.info('[audit]', JSON.stringify(entry));
}

module.exports = {
  logAuditEvent
};
