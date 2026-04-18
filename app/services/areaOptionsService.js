const {
  cityOptionsByProvinceCode,
  countiesByCityCode
} = require('../../config/areaSelector');
const { translateDetailItems } = require('./textTranslationService');

// 行政区名称翻译频率高、变化极少，适合直接做进程内缓存。
const localizedAreaNameCache = new Map();

function getCacheKey(language, text) {
  return `${language}::${text}`;
}

function shouldTranslateAreaNames(language) {
  return language === 'zh-TW';
}

function normalizeOptions(options) {
  return Array.isArray(options)
    ? options.map((option) => ({
      code: option.code,
      name: String(option.name || '')
    }))
    : [];
}

async function localizeOptions(options, language) {
  const normalizedOptions = normalizeOptions(options);

  if (!shouldTranslateAreaNames(language) || normalizedOptions.length === 0) {
    return normalizedOptions;
  }

  // 先去重再批量翻译，避免同一城市/区县名称重复调用上游翻译服务。
  const pendingTexts = [...new Set(
    normalizedOptions
      .map((option) => option.name.trim())
      .filter(Boolean)
      .filter((text) => !localizedAreaNameCache.has(getCacheKey(language, text)))
  )];

  if (pendingTexts.length > 0) {
    const translations = await translateDetailItems({
      items: pendingTexts.map((text, index) => ({
        fieldKey: String(index),
        text
      })),
      targetLanguage: language
    });

    translations.forEach((entry) => {
      localizedAreaNameCache.set(
        getCacheKey(language, entry.text),
        entry.translatedText || entry.text
      );
    });
  }

  return normalizedOptions.map((option) => ({
    ...option,
    name: localizedAreaNameCache.get(getCacheKey(language, option.name.trim())) || option.name
  }));
}

async function getLocalizedCityOptionsForProvince(provinceCode, language) {
  const cityOptions = cityOptionsByProvinceCode[provinceCode] || [];

  if (language === 'zh-CN' || language === 'en') {
    return normalizeOptions(cityOptions);
  }

  return localizeOptions(cityOptions, language);
}

async function getLocalizedCountyOptionsForCity(cityCode, language) {
  const countyOptions = countiesByCityCode[cityCode] || [];

  if (language === 'zh-CN' || language === 'en') {
    return normalizeOptions(countyOptions);
  }

  return localizeOptions(countyOptions, language);
}

module.exports = {
  getLocalizedCityOptionsForProvince,
  getLocalizedCountyOptionsForCity
};
