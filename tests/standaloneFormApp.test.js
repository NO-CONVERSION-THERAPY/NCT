const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  clearProjectModules,
  loadStandaloneFormApp,
  projectRoot,
  requestApp,
  requestPath
} = require('./helpers/appHarness');

function loadStandaloneFormAppWithPatchedFormService(envOverrides = {}, patchFormService) {
  const effectiveEnvOverrides = {
    MAINTENANCE_MODE: 'false',
    MAINTENANCE_NOTICE: '',
    MAP_DATA_NODE_TRANSPORT_OVERRIDES: 'false',
    FORM_ID: 'test-form-id',
    FRONTEND_VARIANT: 'legacy',
    ...envOverrides
  };

  const originalValues = Object.fromEntries(
    Object.keys(effectiveEnvOverrides).map((key) => [key, process.env[key]])
  );

  Object.entries(effectiveEnvOverrides).forEach(([key, value]) => {
    process.env[key] = value;
  });

  clearProjectModules();
  const formService = require(path.join(projectRoot, 'app/services/formService'));
  const restorePatch = typeof patchFormService === 'function'
    ? patchFormService(formService)
    : null;
  const app = require(path.join(projectRoot, 'app/standaloneFormServer'));

  Object.entries(originalValues).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });

  return {
    app,
    restore() {
      if (typeof restorePatch === 'function') {
        restorePatch();
      }
    }
  };
}

function responseBodyMatch(body, pattern) {
  const match = String(body || '').match(pattern);
  assert.ok(match, `Expected response body to match ${pattern}`);
  return match;
}

function buildValidSubmissionBody(overrides = {}) {
  const basePayload = {
    identity: '受害者本人',
    birth_year: '2008',
    sex: '男性',
    sex_other_type: '',
    sex_other: '',
    provinceCode: '110000',
    cityCode: '110101',
    countyCode: '',
    school_name: '独立表单测试机构',
    school_address: '北京市东城区测试路 1 号',
    date_start: '2024-01-01',
    date_end: '',
    experience: '',
    headmaster_name: '',
    contact_information: 'standalone@example.com',
    scandal: '',
    other: '',
    website: '',
    form_token: ''
  };

  return new URLSearchParams({
    ...basePayload,
    ...overrides
  }).toString();
}

test('standalone form app serves the form at the worker root path', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'false' });
  const response = await requestPath(app, '/');

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /action="\/submit"/);
  assert.match(response.body, /class="standalone-shell standalone-form-shell"/);
  assert.match(response.body, /\/css\/standalone-form\.css/);
});

test('standalone form app keeps /form/standalone as a compatibility alias', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'false' });
  const response = await requestPath(app, '/form/standalone');

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /action="\/submit"/);
});

test('standalone form debug routes stay hidden when debug mode is disabled', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'false' });
  const debugResponse = await requestPath(app, '/debug');
  const successResponse = await requestPath(app, '/debug/submit-success');
  const errorResponse = await requestPath(app, '/debug/submit-error');

  assert.equal(debugResponse.statusCode, 404);
  assert.equal(successResponse.statusCode, 404);
  assert.equal(errorResponse.statusCode, 404);
});

test('standalone form debug page renders success and error preview links when debug mode is enabled', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'true' });
  const response = await requestPath(app, '/debug');

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /调试|Debug|調試/);
  assert.match(response.body, /href="\/debug\/submit-success"/);
  assert.match(response.body, /href="\/debug\/submit-error"/);
});

test('standalone pages respect explicit language selection for standalone-specific labels', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'true' });
  const englishFormResponse = await requestPath(app, '/form/standalone?lang=en');
  const traditionalChineseFormResponse = await requestPath(app, '/form/standalone?lang=zh-TW');
  const englishSuccessResponse = await requestPath(app, '/debug/submit-success?lang=en');
  const traditionalChineseErrorResponse = await requestPath(app, '/debug/submit-error?lang=zh-TW');

  assert.equal(englishFormResponse.statusCode, 200);
  assert.match(englishFormResponse.body, /Survey on Harm Experienced in Conversion Institutions/);
  assert.match(englishFormResponse.body, /<label for="website">Website<\/label>/);
  assert.match(englishFormResponse.body, /data-standalone-language-link="en"/);
  assert.doesNotMatch(englishFormResponse.body, /class="standalone-back-link">← Back to Home<\/a>/);

  assert.equal(traditionalChineseFormResponse.statusCode, 200);
  assert.match(traditionalChineseFormResponse.body, /扭轉機構受害者情況問卷調查/);
  assert.match(traditionalChineseFormResponse.body, /<label for="website">網站<\/label>/);

  assert.equal(englishSuccessResponse.statusCode, 200);
  assert.match(englishSuccessResponse.body, /<p class="glass-eyebrow">Success<\/p>/);
  assert.match(englishSuccessResponse.body, /Back to Form/);
  assert.doesNotMatch(englishSuccessResponse.body, />Back to Home<\/a>/);

  assert.equal(traditionalChineseErrorResponse.statusCode, 200);
  assert.match(traditionalChineseErrorResponse.body, /<p class="glass-eyebrow">重試<\/p>/);
});

test('standalone form debug preview routes render the standalone success and error pages', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'true' });
  const successResponse = await requestPath(app, '/debug/submit-success');
  const errorResponse = await requestPath(app, '/debug/submit-error');

  assert.equal(successResponse.statusCode, 200);
  assert.match(successResponse.body, /standalone-state-card--success/);
  assert.match(successResponse.body, /href="\/debug"/);

  assert.equal(errorResponse.statusCode, 200);
  assert.match(errorResponse.body, /standalone-state-card--error/);
  assert.match(errorResponse.body, /href="\/debug"/);
  assert.match(errorResponse.body, /viewform\?usp=pp_url/);
});

test('standalone form app renders the dry run preview at /submit', async () => {
  clearProjectModules();
  const { issueFormProtectionToken } = require(path.join(projectRoot, 'app/services/formProtectionService'));
  const app = loadStandaloneFormApp({
    DEBUG_MOD: 'false',
    FORM_DRY_RUN: 'true',
    FORM_PROTECTION_SECRET: 'standalone-form-protection-secret',
    FORM_PROTECTION_MIN_FILL_MS: '3000'
  });
  const response = await requestApp(app, {
    path: '/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: buildValidSubmissionBody({
      form_token: issueFormProtectionToken({
        secret: 'standalone-form-protection-secret',
        issuedAt: Date.now() - 5000
      })
    })
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /表单 Dry Run 预览/);
  assert.match(response.body, /href="\/"/);
  clearProjectModules();
});

test('standalone form app confirms and submits through /submit/confirm', { concurrency: false }, async () => {
  clearProjectModules();
  const capturedCalls = [];

  try {
    const { issueFormProtectionToken } = require(path.join(projectRoot, 'app/services/formProtectionService'));
    const { app, restore } = loadStandaloneFormAppWithPatchedFormService({
      DEBUG_MOD: 'false',
      FORM_DRY_RUN: 'false',
      FORM_SUBMIT_TARGET: 'google',
      FORM_PROTECTION_SECRET: 'standalone-form-protection-secret',
      FORM_PROTECTION_MIN_FILL_MS: '3000'
    }, (formService) => {
      const originalSubmitToGoogleForm = formService.submitToGoogleForm;
      formService.submitToGoogleForm = async (...args) => {
        capturedCalls.push(args);
      };

      return () => {
        formService.submitToGoogleForm = originalSubmitToGoogleForm;
      };
    });
    const reviewResponse = await requestApp(app, {
      path: '/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: buildValidSubmissionBody({
        form_token: issueFormProtectionToken({
          secret: 'standalone-form-protection-secret',
          issuedAt: Date.now() - 5000
        })
      })
    });

    const confirmationTokenMatch = responseBodyMatch(reviewResponse.body, /name="confirmation_token" value="([^"]+)"/);
    const confirmationPayloadMatch = responseBodyMatch(reviewResponse.body, /<textarea name="confirmation_payload" hidden>([^<]*)<\/textarea>/);
    const confirmResponse = await requestApp(app, {
      path: '/submit/confirm',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        confirmation_token: confirmationTokenMatch[1],
        confirmation_payload: confirmationPayloadMatch[1]
      }).toString()
    });

    assert.equal(confirmResponse.statusCode, 200);
    assert.equal(capturedCalls.length, 1);
    assert.match(confirmResponse.body, /standalone-state-card--success/);
    assert.match(confirmResponse.body, /href="\/"/);
    restore();
  } finally {
    clearProjectModules();
  }
});

test('standalone form app exposes area options for the standalone worker bundle', async () => {
  const app = loadStandaloneFormApp({ DEBUG_MOD: 'false' });
  const response = await requestPath(app, '/api/area-options?provinceCode=110000');

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.match(response.body, /东城区|东城區|Dongcheng/);
});
