const { translateTextsWithProvider } = require('./translationProviderService');

// 轻量级进程内缓存：避免同一批详情文案反复请求翻译接口。
const translationCache = new Map();
const translationCacheMaxEntries = 250;
const translationCacheTtlMs = 6 * 60 * 60 * 1000;
const translationFailureCooldownMs = 90 * 1000;
let translationServiceUnavailableUntil = 0;

// 当前只开放给英文和繁中，其他语言直接走“原文回显”。
function normalizeTargetLanguage(targetLanguage) {
  if (targetLanguage === 'en' || targetLanguage === 'zh-TW') {
    return targetLanguage;
  }

  return null;
}

function getCacheKey(targetLanguage, text) {
  return `${targetLanguage}::${text}`;
}

// 在读取统计或写入前顺手清理过期项，避免常驻进程缓存无上限膨胀。
function pruneExpiredTranslations(now = Date.now()) {
  for (const [cacheKey, entry] of translationCache.entries()) {
    if (!entry || entry.expiresAt <= now) {
      translationCache.delete(cacheKey);
    }
  }
}

function readCachedTranslation(cacheKey) {
  const cacheEntry = translationCache.get(cacheKey);

  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    translationCache.delete(cacheKey);
    return null;
  }

  // 命中时刷新 LRU 顺序，避免热点翻译被过早淘汰。
  translationCache.delete(cacheKey);
  translationCache.set(cacheKey, cacheEntry);
  return cacheEntry.value;
}

function writeCachedTranslation(cacheKey, translatedText) {
  if (translationCache.has(cacheKey)) {
    translationCache.delete(cacheKey);
  }

  translationCache.set(cacheKey, {
    value: translatedText,
    expiresAt: Date.now() + translationCacheTtlMs
  });

  while (translationCache.size > translationCacheMaxEntries) {
    const oldestCacheKey = translationCache.keys().next().value;
    if (!oldestCacheKey) {
      break;
    }
    translationCache.delete(oldestCacheKey);
  }

  return translatedText;
}

function normalizeTranslatedText(text, targetLanguage) {
  const normalizedText = String(text || '').trim();

  if (targetLanguage !== 'en') {
    return normalizedText;
  }

  return normalizedText.replace(/(\p{L})\s*[’']\s*(\p{L})/gu, "$1'$2");
}

function getErrorDiagnostics(error) {
  const details = [];

  function collectDiagnostics(currentError) {
    if (!currentError || typeof currentError !== 'object') {
      return;
    }

    if (currentError.name) {
      details.push(`name=${currentError.name}`);
    }

    if (currentError.code) {
      details.push(`code=${currentError.code}`);
    }

    if (currentError.message) {
      details.push(`message=${currentError.message}`);
    }

    if (Array.isArray(currentError.errors)) {
      currentError.errors.forEach(collectDiagnostics);
    }

    if (currentError.cause && currentError.cause !== currentError) {
      collectDiagnostics(currentError.cause);
    }
  }

  collectDiagnostics(error);

  return [...new Set(details)].join(', ');
}

function isTranslationServiceCoolingDown(now = Date.now()) {
  return translationServiceUnavailableUntil > now;
}

function openTranslationFailureCooldown(now = Date.now()) {
  translationServiceUnavailableUntil = now + translationFailureCooldownMs;
}

function resetTranslationFailureCooldown() {
  translationServiceUnavailableUntil = 0;
}

async function requestTranslationBatch(texts, targetLanguage) {
  if (isTranslationServiceCoolingDown()) {
    throw new Error('翻譯服務連線冷卻中');
  }

  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const translatedTexts = await translateTextsWithProvider(texts, targetLanguage);

      if (!Array.isArray(translatedTexts) || translatedTexts.length !== texts.length) {
        throw new Error('翻譯結果格式異常');
      }

      resetTranslationFailureCooldown();
      return translatedTexts;
    } catch (error) {
      lastError = error;
    }
  }

  openTranslationFailureCooldown();
  throw lastError || new Error('翻譯服務暫時不可用');
}

function logTranslationFailure(error, texts, targetLanguage) {
  console.warn(
    '翻譯服務暫時不可用，未返回翻譯結果：',
    getErrorDiagnostics(error) || (error && error.message ? error.message : error),
    '| targetLanguage =',
    targetLanguage,
    '| textCount =',
    Array.isArray(texts) ? texts.length : 0,
    '| sample =',
    (Array.isArray(texts) ? texts : [texts])
      .filter(Boolean)
      .slice(0, 2)
      .map((text) => String(text).slice(0, 40))
      .join(' | ')
  );
}

// 批量接口先按原文去重，既减少请求次数，也避免相同文本返回不一致翻译。
async function translateDetailItems({ items, targetLanguage }) {
  const normalizedTargetLanguage = normalizeTargetLanguage(targetLanguage);

  if (!normalizedTargetLanguage) {
    return items.map((item) => ({
      ...item,
      translatedText: item.text
    }));
  }

  const translatedTextBySource = Object.create(null);
  const pendingTexts = [];
  const uniqueTexts = [...new Set(items.map((item) => item.text).filter(Boolean))];

  uniqueTexts.forEach((text) => {
    const cacheKey = getCacheKey(normalizedTargetLanguage, text);
    const cachedTranslation = readCachedTranslation(cacheKey);

    if (cachedTranslation) {
      translatedTextBySource[text] = cachedTranslation;
      return;
    }

    pendingTexts.push(text);
  });

  if (pendingTexts.length > 0) {
    let translatedPendingTexts = [];

    try {
      translatedPendingTexts = await requestTranslationBatch(pendingTexts, normalizedTargetLanguage);
    } catch (error) {
      logTranslationFailure(error, pendingTexts, normalizedTargetLanguage);
      throw error;
    }

    pendingTexts.forEach((text, index) => {
      const translatedText = normalizeTranslatedText(translatedPendingTexts[index], normalizedTargetLanguage);

      if (!translatedText) {
        throw new Error('翻譯結果為空');
      }

      translatedTextBySource[text] = writeCachedTranslation(
        getCacheKey(normalizedTargetLanguage, text),
        translatedText
      );
    });
  }

  return items.map((item) => ({
    ...item,
    translatedText: translatedTextBySource[item.text] || ''
  }));
}

module.exports = {
  getTranslationCacheSize() {
    pruneExpiredTranslations();
    return translationCache.size;
  },
  getTranslationFailureCooldownMs() {
    return Math.max(0, translationServiceUnavailableUntil - Date.now());
  },
  resetTranslationCache() {
    translationCache.clear();
    resetTranslationFailureCooldown();
  },
  translateDetailItems,
  translationCacheMaxEntries
};
