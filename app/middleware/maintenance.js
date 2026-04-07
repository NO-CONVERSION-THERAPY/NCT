const {
  applySensitivePageHeaders,
  sensitiveRobotsPolicy
} = require('../../config/security');
const { translateInterfaceText } = require('../services/textTranslationService');

function createMaintenanceMiddleware({
  maintenanceMode,
  maintenanceNotice,
  maintenanceRetryAfterSeconds,
  title
}) {
  const retryAfterSeconds = Number.isFinite(maintenanceRetryAfterSeconds) && maintenanceRetryAfterSeconds > 0
    ? maintenanceRetryAfterSeconds
    : 1800;

  return function maintenanceMiddleware(req, res, next) {
    if (!maintenanceMode) {
      return next();
    }

    applySensitivePageHeaders(res);
    res.set('Retry-After', String(retryAfterSeconds));

    const acceptedType = req.accepts(['html', 'json', 'text']);
    const wantsHtml = (req.method === 'GET' || req.method === 'HEAD')
      && (acceptedType === 'html' || acceptedType === false);

    if (wantsHtml) {
      return (async () => {
        let localizedMaintenanceNotice = maintenanceNotice || req.t('maintenance.defaultNotice');

        if (maintenanceNotice) {
          try {
            localizedMaintenanceNotice = await translateInterfaceText({
              text: maintenanceNotice,
              targetLanguage: req.lang
            });
          } catch (_error) {
            localizedMaintenanceNotice = maintenanceNotice;
          }
        }

        return res.status(503).render('maintenance', {
          title: req.t('pageTitles.maintenance', { title }),
          maintenanceNotice: localizedMaintenanceNotice,
          pageRobots: sensitiveRobotsPolicy,
          retryAfterSeconds,
          retryUrl: req.originalUrl || '/',
          siteTitle: title
        });
      })().catch(next);
    }

    const message = req.t('server.maintenanceActive');

    if (acceptedType === 'json') {
      return res.status(503).json({ error: message });
    }

    return res.status(503).type('text/plain; charset=utf-8').send(message);
  };
}

module.exports = {
  createMaintenanceMiddleware
};
