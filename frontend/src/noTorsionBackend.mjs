function getTrimmedValue(value, fallback = '') {
  const normalizedValue = String(value || '').trim();
  return normalizedValue || fallback;
}

export function hasConfiguredNoTorsionBackend(input) {
  return Boolean(getTrimmedValue(input && input.formPageUrl));
}

export function buildNoTorsionBackendConfig({
  currentOrigin = 'https://example.com',
  formPageUrl = '',
  lang = 'zh-CN',
} = {}) {
  const normalizedFormPageUrl = getTrimmedValue(formPageUrl);
  const normalizedLanguage = getTrimmedValue(lang, 'zh-CN');

  if (!normalizedFormPageUrl) {
    return {
      articleTranslationEnabled: false,
      formEnabled: false,
      formHref: '',
      recordTranslationEnabled: false,
      translateApiUrl: '',
    };
  }

  const resolvedFormUrl = new URL(normalizedFormPageUrl, currentOrigin);
  resolvedFormUrl.searchParams.set('lang', normalizedLanguage);

  return {
    articleTranslationEnabled: normalizedLanguage === 'en',
    formEnabled: true,
    formHref: resolvedFormUrl.toString(),
    recordTranslationEnabled: normalizedLanguage !== 'zh-CN',
    // Translation requests follow the standalone form backend origin so one env var wires both capabilities together.
    translateApiUrl: new URL('/api/no-torsion/translate-text', resolvedFormUrl.origin).toString(),
  };
}
