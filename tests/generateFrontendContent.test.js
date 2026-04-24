const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  writeMapDataSnapshot
} = require('../scripts/generate-frontend-content');

test('writeMapDataSnapshot keeps the checked-in static snapshot unchanged', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'nct-map-static-'));
  const targetFilePath = path.join(tempDirectory, 'map-data.json');
  const snapshot = {
    last_synced: 42,
    statistics: [],
  };

  fs.writeFileSync(targetFilePath, JSON.stringify(snapshot), 'utf8');

  try {
    await writeMapDataSnapshot(tempDirectory);

    assert.deepEqual(
      JSON.parse(fs.readFileSync(targetFilePath, 'utf8')),
      snapshot
    );
  } finally {
    fs.rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test('writeMapDataSnapshot fails when the static snapshot is missing', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'nct-map-missing-'));

  try {
    await assert.rejects(
      () => writeMapDataSnapshot(tempDirectory),
      /Missing .*map-data\.json/
    );
  } finally {
    fs.rmSync(tempDirectory, { force: true, recursive: true });
  }
});
