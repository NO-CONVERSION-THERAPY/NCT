const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium } = require('playwright');

const {
  loadStandaloneFormApp,
  startServer
} = require('./helpers/appHarness');

test('standalone language picker switches the page language through a GET navigation', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'true' });
  const server = await startServer(app);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(`${server.baseUrl}/form/standalone?lang=zh-CN`, {
      waitUntil: 'networkidle'
    });

    await page.click('[data-standalone-language-link="en"]');
    await page.waitForURL(/lang=en/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    assert.match(page.url(), /lang=en/);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(await page.textContent('h1'), /Survey on Harm Experienced in Conversion Institutions/);
  } finally {
    await browser.close();
    await server.close();
  }
});
