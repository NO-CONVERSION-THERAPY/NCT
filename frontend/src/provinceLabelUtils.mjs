export function getFeatureProvinceLabel(feature, lang) {
  const properties = feature && feature.properties || {};
  const resolvedLanguage = lang === 'zh-TW' || lang === 'en' ? lang : 'zh-CN';

  if (resolvedLanguage === 'zh-TW') {
    return (
      properties['name_zh-TW']
      || properties['fullname_zh-TW']
      || properties.name
      || properties.fullname
      || ''
    );
  }

  if (resolvedLanguage === 'zh-CN') {
    return (
      properties['fullname_zh-CN']
      || properties['name_zh-CN']
      || properties.fullname
      || properties.name
      || ''
    );
  }

  return (
    properties.fullname_en
    || properties.name_en
    || properties.fullname
    || properties.name
    || ''
  );
}
