const fs = require('fs');
const path = require('path');
const { paths } = require('../config/fileConfig');
const { getAreaOptions } = require('../config/areaSelector');
const {
  defaultLanguage,
  getLanguageOptions,
  getMessages,
} = require('../config/i18n');
const { supportedLanguages } = require('../config/provinceMetadata');
const { renderBlogArticleHtml } = require('./lib/blogTranslationService');

const STATIC_MAP_DATA_PATH = '/content/map-data.json';

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function buildAreaSelectorPayload() {
  const defaultAreaOptions = getAreaOptions('zh-CN');

  return {
    generatedAt: new Date().toISOString(),
    provincesByLanguage: Object.fromEntries(
      supportedLanguages.map((language) => [language, getAreaOptions(language).provinces])
    ),
    citiesByProvinceCode: defaultAreaOptions.citiesByProvinceCode,
    countiesByCityCode: defaultAreaOptions.countiesByCityCode
  };
}

function buildSiteBootstrapPayload() {
  return {
    defaultLanguage,
    generatedAt: new Date().toISOString(),
    languageOptionsByLanguage: Object.fromEntries(
      supportedLanguages.map((language) => [language, getLanguageOptions(language)])
    ),
    messagesByLanguage: Object.fromEntries(
      supportedLanguages.map((language) => [language, getMessages(language)])
    ),
    supportedLanguages,
  };
}

function buildBlogIndexPayload() {
  const savedTags = JSON.parse(fs.readFileSync(paths.blogData, 'utf8'));

  return {
    generatedAt: new Date().toISOString(),
    entries: Array.isArray(savedTags.Data) ? savedTags.Data : [],
    tags: savedTags.TagList && typeof savedTags.TagList === 'object' ? savedTags.TagList : {}
  };
}

function buildBlogArticlePayload(articleId) {
  const articlePath = path.join(paths.blog, `${articleId}.md`);
  const articleMarkdown = fs.readFileSync(articlePath, 'utf8');

  return {
    generatedAt: new Date().toISOString(),
    articleId,
    articleHtml: renderBlogArticleHtml(articleMarkdown, { targetLanguage: 'en' })
  };
}

async function writeMapDataSnapshot(contentDirectory) {
  // Keep builds deterministic by reusing the checked-in static snapshot.
  const targetFilePath = path.join(contentDirectory, 'map-data.json');

  if (!fs.existsSync(targetFilePath)) {
    throw new Error(`Missing ${targetFilePath}. Add a static map snapshot before building.`);
  }
}

async function main() {
  const contentDirectory = path.join(paths.public, 'content');
  const blogDirectory = path.join(contentDirectory, 'blog');
  const blogArticlesDirectory = path.join(blogDirectory, 'articles');

  ensureDirectory(contentDirectory);
  ensureDirectory(blogDirectory);
  ensureDirectory(blogArticlesDirectory);

  await writeMapDataSnapshot(contentDirectory);
  writeJson(path.join(contentDirectory, 'area-selector.json'), buildAreaSelectorPayload());
  writeJson(path.join(contentDirectory, 'site-bootstrap.json'), buildSiteBootstrapPayload());
  writeJson(path.join(blogDirectory, 'index.json'), buildBlogIndexPayload());

  fs.readdirSync(paths.blog)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => path.basename(fileName, '.md'))
    .sort()
    .forEach((articleId) => {
      writeJson(
        path.join(blogArticlesDirectory, `${articleId}.json`),
        buildBlogArticlePayload(articleId)
      );
    });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  STATIC_MAP_DATA_PATH,
  buildAreaSelectorPayload,
  buildBlogArticlePayload,
  buildBlogIndexPayload,
  buildSiteBootstrapPayload,
  ensureDirectory,
  main,
  writeJson,
  writeMapDataSnapshot
};
