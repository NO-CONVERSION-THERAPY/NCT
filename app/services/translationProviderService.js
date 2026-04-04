const {
  googleCloudTranslationApiKey,
  translationProviderConfigured,
  translationProviderTimeoutMs
} = require('../../config/appConfig');

const GOOGLE_CLOUD_TRANSLATION_API_BASE_URL = 'https://translation.googleapis.com';

function decodeBasicHtmlEntities(text) {
  return String(text || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function ensureUrl(baseUrl, pathname) {
  const normalizedBaseUrl = String(baseUrl || '').endsWith('/')
    ? String(baseUrl)
    : `${String(baseUrl || '')}/`;

  return new URL(pathname.replace(/^\/+/, ''), normalizedBaseUrl);
}

function extractProviderErrorMessage(responseBody) {
  if (!responseBody || typeof responseBody !== 'object') {
    return '';
  }

  if (typeof responseBody.message === 'string' && responseBody.message.trim()) {
    return responseBody.message.trim();
  }

  if (responseBody.error && typeof responseBody.error.message === 'string' && responseBody.error.message.trim()) {
    return responseBody.error.message.trim();
  }

  return '';
}

async function parseProviderJsonResponse(response, providerLabel) {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${providerLabel} 返回了無法解析的 JSON`);
  }
}

async function translateWithGoogleCloud(texts, targetLanguage) {
  if (!googleCloudTranslationApiKey) {
    throw new Error('Google Cloud Translation 未配置 API Key');
  }

  const requestUrl = ensureUrl(GOOGLE_CLOUD_TRANSLATION_API_BASE_URL, '/language/translate/v2');

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': googleCloudTranslationApiKey
    },
    body: JSON.stringify({
      q: texts,
      target: targetLanguage,
      format: 'text'
    }),
    signal: AbortSignal.timeout(translationProviderTimeoutMs)
  });
  const responseBody = await parseProviderJsonResponse(response, 'Google Cloud Translation');

  if (!response.ok) {
    const providerMessage = extractProviderErrorMessage(responseBody);
    throw new Error(
      providerMessage
        ? `Google Cloud Translation 返回 ${response.status}: ${providerMessage}`
        : `Google Cloud Translation 返回 ${response.status}`
    );
  }

  const translations = responseBody && responseBody.data && Array.isArray(responseBody.data.translations)
    ? responseBody.data.translations
    : null;

  if (!translations || translations.length !== texts.length) {
    throw new Error('Google Cloud Translation 結果格式異常');
  }

  return translations.map((entry) => decodeBasicHtmlEntities(entry && entry.translatedText ? entry.translatedText : ''));
}

async function translateTextsWithProvider(texts, targetLanguage) {
  if (!translationProviderConfigured) {
    throw new Error('未配置正式翻譯服務');
  }

  return translateWithGoogleCloud(texts, targetLanguage);
}

module.exports = {
  getTranslationProviderName() {
    return 'google-cloud';
  },
  isTranslationProviderConfigured() {
    return translationProviderConfigured;
  },
  translateTextsWithProvider
};
