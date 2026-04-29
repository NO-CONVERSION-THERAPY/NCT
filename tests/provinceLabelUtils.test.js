const assert = require('node:assert/strict');
const test = require('node:test');

const geojson = require('../public/cn.json');

function getProvinceFeature(code) {
  return geojson.features.find((feature) => feature.properties.code === code);
}

test('map province labels use full simplified names and short traditional names', async () => {
  const { getFeatureProvinceLabel } = await import('../frontend/src/provinceLabelUtils.mjs');
  const hebei = getProvinceFeature('130000');
  const taiwan = getProvinceFeature('710000');

  assert.ok(hebei);
  assert.ok(taiwan);

  assert.equal(getFeatureProvinceLabel(hebei, 'zh-CN'), '河北省');
  assert.equal(getFeatureProvinceLabel(taiwan, 'zh-CN'), '台湾省');

  assert.equal(getFeatureProvinceLabel(hebei, 'zh-TW'), '河北');
  assert.equal(getFeatureProvinceLabel(taiwan, 'zh-TW'), '臺灣');
});
