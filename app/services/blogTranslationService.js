const { escapeHtml, lexMarkdown, renderMarkdownTokens } = require('./markedService');
const { translateDetailItems } = require('./textTranslationService');

// 复用通用翻译 service，把纯文本数组改造成它接受的字段结构。
async function defaultTranslateBatch(texts, targetLanguage) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const translations = await translateDetailItems({
    items: texts.map((text, index) => ({
      fieldKey: String(index),
      text
    })),
    targetLanguage
  });

  return translations.map((entry) => entry.translatedText || '');
}

// 目前博客仅在英文场景下注入双语块，其他语言继续显示原文。
function normalizeTranslationTarget(targetLanguage) {
  return targetLanguage === 'en' ? 'en' : null;
}

// 从 marked 的内联 token 树里抽纯文本，作为后续翻译输入。
function extractPlainTextFromInlineTokens(tokens = []) {
  return tokens.map((token) => {
    if (!token) {
      return '';
    }

    switch (token.type) {
      case 'br':
        return '\n';
      case 'codespan':
      case 'escape':
      case 'text':
        return token.text || '';
      case 'del':
      case 'em':
      case 'link':
      case 'strong':
        return extractPlainTextFromInlineTokens(token.tokens || []);
      case 'image':
        return token.text || '';
      default:
        return token.text || '';
    }
  }).join('');
}

// 块级 token 的处理与渲染结构保持一致，避免翻译时丢掉列表/表格里的正文。
function extractPlainTextFromBlockTokens(tokens = []) {
  return tokens.map((token) => {
    if (!token) {
      return '';
    }

    switch (token.type) {
      case 'blockquote':
        return extractPlainTextFromBlockTokens(token.tokens || []);
      case 'code':
      case 'html':
        return '';
      case 'heading':
      case 'paragraph':
      case 'text':
        return extractPlainTextFromInlineTokens(token.tokens || []) || token.text || '';
      case 'list':
        return token.items
          .map((item) => extractPlainTextFromBlockTokens(item.tokens || []))
          .filter(Boolean)
          .join('\n');
      case 'space':
        return '';
      case 'table':
        return [
          ...(token.header || []).map((cell) => extractPlainTextFromInlineTokens(cell.tokens || [])),
          ...(token.rows || []).flat().map((cell) => extractPlainTextFromInlineTokens(cell.tokens || []))
        ]
          .filter(Boolean)
          .join('\n');
      default:
        return token.text || '';
    }
  }).filter(Boolean).join('\n');
}

// 先在服务端渲染出占位节点，真正翻译内容由前端按需填充。
function buildTranslationSlot(sourceText, className) {
  const normalizedText = String(sourceText || '').trim();

  if (!normalizedText) {
    return '';
  }

  return `<p class="${className} blog-bilingual-translation-slot" data-blog-translation-source="${escapeHtml(normalizedText)}" hidden></p>`;
}

// 文本翻译统一走“去重 -> 批量翻译 -> 还原原始顺序”，减少重复请求。
async function translateTexts(texts, { targetLanguage, translateBatch = defaultTranslateBatch } = {}) {
  const normalizedTargetLanguage = normalizeTranslationTarget(targetLanguage);

  if (!normalizedTargetLanguage) {
    return texts.map(() => '');
  }

  const trimmedTexts = texts.map((text) => String(text || '').trim());
  const uniqueTexts = [...new Set(trimmedTexts.filter(Boolean))];

  if (uniqueTexts.length === 0) {
    return trimmedTexts.map(() => '');
  }

  let translatedUniqueTexts = [];

  try {
    translatedUniqueTexts = await translateBatch(uniqueTexts, normalizedTargetLanguage);
  } catch (error) {
    return trimmedTexts.map(() => '');
  }

  const translatedTextBySource = Object.create(null);

  uniqueTexts.forEach((text, index) => {
    translatedTextBySource[text] = translatedUniqueTexts[index] || '';
  });

  return trimmedTexts.map((text) => translatedTextBySource[text] || '');
}

function shouldHydrateArticleTranslations(targetLanguage) {
  return normalizeTranslationTarget(targetLanguage) === 'en';
}

// 标题、段落、列表分别单独包装，便于前端做双语排版和样式区分。
function renderHeadingToken(token, shouldTranslate) {
  const originalHtml = renderMarkdownTokens([token]);
  const sourceText = extractPlainTextFromInlineTokens(token.tokens || []) || token.text || '';

  return [
    '<section class="blog-bilingual-block blog-bilingual-block--heading">',
    originalHtml,
    shouldTranslate
      ? buildTranslationSlot(
      sourceText,
      `blog-bilingual-heading__translation blog-bilingual-heading__translation--h${token.depth || 1}`
    )
      : '',
    '</section>'
  ].join('');
}

function renderParagraphLikeToken(token, shouldTranslate) {
  const originalHtml = renderMarkdownTokens([token]);
  const sourceText = extractPlainTextFromInlineTokens(token.tokens || []) || token.text || '';

  return [
    '<section class="blog-bilingual-block blog-bilingual-block--text">',
    originalHtml,
    shouldTranslate
      ? buildTranslationSlot(sourceText, 'blog-bilingual-block__translation')
      : '',
    '</section>'
  ].join('');
}

function renderListToken(token, shouldTranslate) {
  const tagName = token.ordered ? 'ol' : 'ul';
  const startAttribute = token.ordered && token.start ? ` start="${token.start}"` : '';

  const itemsHtml = token.items.map((item, index) => {
    const originalHtml = renderMarkdownTokens(item.tokens || []);
    const sourceText = extractPlainTextFromBlockTokens(item.tokens || []);

    return [
      '<li class="blog-bilingual-list__item">',
      `<div class="blog-bilingual-list__original">${originalHtml}</div>`,
      shouldTranslate
        ? buildTranslationSlot(sourceText, 'blog-bilingual-block__translation')
        : '',
      '</li>'
    ].join('');
  }).join('');

  return `<${tagName} class="blog-bilingual-list"${startAttribute}>${itemsHtml}</${tagName}>`;
}

// 文章详情尽量保留原 markdown 渲染结果，只在适合翻译的块旁边插槽。
function renderBlogArticleHtml(content, { targetLanguage } = {}) {
  const shouldTranslate = shouldHydrateArticleTranslations(targetLanguage);
  const tokens = lexMarkdown(content);

  if (!shouldTranslate) {
    return renderMarkdownTokens(tokens);
  }

  const htmlChunks = [];

  for (const token of tokens) {
    if (!token || token.type === 'space') {
      continue;
    }

    if (token.type === 'heading') {
      htmlChunks.push(renderHeadingToken(token, shouldTranslate));
      continue;
    }

    if (token.type === 'paragraph' || token.type === 'text') {
      htmlChunks.push(renderParagraphLikeToken(token, shouldTranslate));
      continue;
    }

    if (token.type === 'list') {
      htmlChunks.push(renderListToken(token, shouldTranslate));
      continue;
    }

    htmlChunks.push(renderMarkdownTokens([token]));
  }

  return htmlChunks.join('\n');
}

// 列表页只翻译标题，避免为摘要/正文预先发起额外翻译请求。
async function translateBlogListEntries(entries, { targetLanguage, translateBatch = defaultTranslateBatch } = {}) {
  const normalizedTargetLanguage = normalizeTranslationTarget(targetLanguage);

  if (!normalizedTargetLanguage) {
    return entries.map((entry) => ({
      ...entry,
      translatedTitle: ''
    }));
  }

  const translatedTitles = await translateTexts(
    entries.map((entry) => entry.title || ''),
    { targetLanguage: normalizedTargetLanguage, translateBatch }
  );

  return entries.map((entry, index) => ({
    ...entry,
    translatedTitle: translatedTitles[index] || ''
  }));
}

module.exports = {
  extractPlainTextFromBlockTokens,
  extractPlainTextFromInlineTokens,
  renderBlogArticleHtml,
  translateBlogListEntries
};
