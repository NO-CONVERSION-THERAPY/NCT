const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');

test('secure-config bootstrap generates secret and encrypted values for both protected envs', () => {
  const { buildBootstrapConfig } = require(path.join(projectRoot, 'scripts/secure-config'));
  const { decryptProtectedValue } = require(path.join(projectRoot, 'config/protectedConfig'));

  const result = buildBootstrapConfig({
    formId: 'form-123',
    googleScriptUrl: 'https://script.google.com/macros/s/example/exec'
  });

  assert.match(result.formProtectionSecret, /^[0-9a-f]{64}$/);
  assert.ok(result.formIdEncrypted);
  assert.ok(result.googleScriptUrlEncrypted);
  assert.equal(
    decryptProtectedValue(result.formIdEncrypted, result.formProtectionSecret, 'form-id'),
    'form-123'
  );
  assert.equal(
    decryptProtectedValue(
      result.googleScriptUrlEncrypted,
      result.formProtectionSecret,
      'google-script-url'
    ),
    'https://script.google.com/macros/s/example/exec'
  );
});

test('secure-config bootstrap respects an explicitly provided secret', () => {
  const { buildBootstrapConfig } = require(path.join(projectRoot, 'scripts/secure-config'));

  const result = buildBootstrapConfig({
    formId: 'form-456',
    secret: 'explicit-bootstrap-secret'
  });

  assert.equal(result.formProtectionSecret, 'explicit-bootstrap-secret');
  assert.ok(result.formIdEncrypted);
  assert.equal(result.googleScriptUrlEncrypted, undefined);
});

test('secure-config bootstrap requires at least one plaintext value', () => {
  const { buildBootstrapConfig } = require(path.join(projectRoot, 'scripts/secure-config'));

  assert.throws(
    () => buildBootstrapConfig({ formId: '', googleScriptUrl: '', secret: '' }),
    /bootstrap 至少需要提供 --form-id 或 --google-script-url/
  );
});

test('secure-config bootstrap-env reads plaintext values from an env file', () => {
  const {
    buildBootstrapConfigFromEnvSource,
    loadEnvSource
  } = require(path.join(projectRoot, 'scripts/secure-config'));
  const { decryptProtectedValue } = require(path.join(projectRoot, 'config/protectedConfig'));

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'secure-config-'));
  const envFilePath = path.join(tempDir, '.env');
  fs.writeFileSync(
    envFilePath,
    [
      'FORM_ID="env-form-789"',
      'GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/from-env/exec"'
    ].join('\n'),
    'utf8'
  );

  const envSource = loadEnvSource(envFilePath);
  const result = buildBootstrapConfigFromEnvSource({ envSource });

  assert.match(result.formProtectionSecret, /^[0-9a-f]{64}$/);
  assert.equal(
    decryptProtectedValue(result.formIdEncrypted, result.formProtectionSecret, 'form-id'),
    'env-form-789'
  );
  assert.equal(
    decryptProtectedValue(
      result.googleScriptUrlEncrypted,
      result.formProtectionSecret,
      'google-script-url'
    ),
    'https://script.google.com/macros/s/from-env/exec'
  );
});
