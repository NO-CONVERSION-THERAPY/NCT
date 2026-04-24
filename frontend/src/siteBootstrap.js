let siteBootstrapPayload = null;
let siteBootstrapRequest = null;

function getTrimmedEnvValue(value, fallback = '') {
  const normalizedValue = String(value || '').trim();
  return normalizedValue || fallback;
}

async function fetchJson(url) {
  const response = await window.fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload && payload.error ? payload.error : 'Failed to load bootstrap content');
  }

  return payload;
}

async function loadSiteBootstrapPayload() {
  // Cache the generated bootstrap snapshot in memory so route changes do not refetch the same static file.
  if (siteBootstrapPayload) {
    return siteBootstrapPayload;
  }

  if (siteBootstrapRequest) {
    return siteBootstrapRequest;
  }

  siteBootstrapRequest = fetchJson('/content/site-bootstrap.json')
    .then((payload) => {
      siteBootstrapPayload = payload;
      return payload;
    })
    .finally(() => {
      siteBootstrapRequest = null;
    });

  return siteBootstrapRequest;
}

function resolveSupportedLanguages(payload) {
  return Array.isArray(payload && payload.supportedLanguages) && payload.supportedLanguages.length > 0
    ? payload.supportedLanguages
    : ['zh-CN', 'zh-TW', 'en'];
}

function readStoredLanguage() {
  try {
    return window.localStorage.getItem('nct-lang') || '';
  } catch (_error) {
    return '';
  }
}

function writeStoredLanguage(language) {
  try {
    window.localStorage.setItem('nct-lang', language);
  } catch (_error) {
    // Ignore storage failures and keep runtime navigation working.
  }
}

function resolveLanguage(payload) {
  const supportedLanguages = resolveSupportedLanguages(payload);
  const searchParams = new URLSearchParams(window.location.search);
  const requestedLanguage = getTrimmedEnvValue(searchParams.get('lang'));
  const storedLanguage = getTrimmedEnvValue(readStoredLanguage());
  const defaultLanguage = getTrimmedEnvValue(payload && payload.defaultLanguage, 'zh-CN');
  const resolvedLanguage = [requestedLanguage, storedLanguage, defaultLanguage]
    .find((candidate) => supportedLanguages.includes(candidate))
    || defaultLanguage;

  writeStoredLanguage(resolvedLanguage);
  return resolvedLanguage;
}

function resolvePublicDataUrl() {
  return getTrimmedEnvValue(
    import.meta.env.VITE_NCT_API_SQL_PUBLIC_DATA_URL,
    '/content/map-data.json'
  );
}

function resolveHonoFormUrl() {
  return getTrimmedEnvValue(import.meta.env.VITE_NCT_SUB_FORM_URL);
}

export async function buildStaticBootstrap() {
  // Merge build-time env switches with the generated bootstrap snapshot into one client boot payload.
  const payload = await loadSiteBootstrapPayload();
  const lang = resolveLanguage(payload);
  const messagesByLanguage = payload && typeof payload.messagesByLanguage === 'object'
    ? payload.messagesByLanguage
    : {};
  const languageOptionsByLanguage = payload && typeof payload.languageOptionsByLanguage === 'object'
    ? payload.languageOptionsByLanguage
    : {};
  const i18n = messagesByLanguage[lang] || messagesByLanguage['zh-CN'] || {};
  const formPageUrl = resolveHonoFormUrl();

  return {
    apiUrl: resolvePublicDataUrl(),
    currentPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    deploymentMode: formPageUrl ? 'hono' : 'api-only',
    formPageUrl,
    i18n,
    lang,
    languageOptions: Array.isArray(languageOptionsByLanguage[lang])
      ? languageOptionsByLanguage[lang]
      : [],
    pageProps: {},
    pageType: 'frontend-router',
    siteName: String(i18n && i18n.common && i18n.common.siteName || 'NO CONVERSION THERAPY')
  };
}
