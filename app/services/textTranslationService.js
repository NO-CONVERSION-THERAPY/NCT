const { execFile } = require('child_process');
const { promisify } = require('util');

// 轻量级进程内缓存：避免同一批详情文案反复请求翻译接口。
const translationCache = new Map();
const translationCacheMaxEntries = 250;
const translationCacheTtlMs = 6 * 60 * 60 * 1000;
const execFileAsync = promisify(execFile);

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

// Google Translate 的返回结构比较嵌套，这里只抽取真正的翻译文本片段。
function extractTranslatedText(responseBody) {
  if (!Array.isArray(responseBody) || !Array.isArray(responseBody[0])) {
    return '';
  }

  return responseBody[0]
    .map((part) => Array.isArray(part) ? part[0] || '' : '')
    .join('')
    .trim();
}

function normalizeTranslatedText(text, targetLanguage) {
  const normalizedText = String(text || '').trim();

  if (targetLanguage !== 'en') {
    return normalizedText;
  }

  return normalizedText.replace(/(\p{L})\s*[’']\s*(\p{L})/gu, "$1'$2");
}

// fetch 失败时退回 curl，尽量减少运行环境 TLS/代理差异带来的不可用。
async function requestTranslationWithCurl(text, targetLanguage) {
  const { stdout } = await execFileAsync('curl', [
    '-sS',
    '--get',
    '--max-time', '10',
    'https://translate.googleapis.com/translate_a/single',
    '--data-urlencode', 'client=gtx',
    '--data-urlencode', 'sl=auto',
    '--data-urlencode', `tl=${targetLanguage}`,
    '--data-urlencode', 'dt=t',
    '--data-urlencode', `q=${text}`
  ]);

  return JSON.parse(stdout);
}

// 单条翻译包含“查缓存 -> 请求远端 -> 规范化结果 -> 写回缓存”四个步骤。
async function translateSingleText(text, targetLanguage) {
  const cacheKey = getCacheKey(targetLanguage, text);
  const cachedTranslation = readCachedTranslation(cacheKey);

  if (cachedTranslation) {
    return cachedTranslation;
  }

  const translateUrl = new URL('https://translate.googleapis.com/translate_a/single');
  translateUrl.searchParams.set('client', 'gtx');
  translateUrl.searchParams.set('sl', 'auto');
  translateUrl.searchParams.set('tl', targetLanguage);
  translateUrl.searchParams.set('dt', 't');
  translateUrl.searchParams.set('q', text);

  let responseBody;

  try {
    const response = await fetch(translateUrl, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`翻譯服務返回 ${response.status}`);
    }

    responseBody = await response.json();
  } catch (error) {
    responseBody = await requestTranslationWithCurl(text, targetLanguage);
  }

  const translatedText = extractTranslatedText(responseBody);

  if (!translatedText) {
    throw new Error('翻譯結果為空');
  }

  const normalizedTranslatedText = normalizeTranslatedText(translatedText, targetLanguage);
  return writeCachedTranslation(cacheKey, normalizedTranslatedText);
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

  const uniqueTexts = [...new Set(items.map((item) => item.text).filter(Boolean))];
  const translatedTextBySource = Object.create(null);

  await Promise.all(uniqueTexts.map(async (text) => {
    translatedTextBySource[text] = await translateSingleText(text, normalizedTargetLanguage);
  }));

  return items.map((item) => ({
    ...item,
    translatedText: translatedTextBySource[item.text] || item.text
  }));
}

module.exports = {
  getTranslationCacheSize() {
    pruneExpiredTranslations();
    return translationCache.size;
  },
  resetTranslationCache() {
    translationCache.clear();
  },
  translateDetailItems,
  translationCacheMaxEntries
};
