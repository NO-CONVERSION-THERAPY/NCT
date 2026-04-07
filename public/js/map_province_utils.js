(function attachMapProvinceUtils(globalObject, factory) {
    const exports = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = exports;
    }

    globalObject.MapProvinceUtils = exports;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
    const simplifiedProvinceNamesByCode = {
        '110000': '北京',
        '120000': '天津',
        '130000': '河北',
        '140000': '山西',
        '150000': '内蒙古',
        '210000': '辽宁',
        '220000': '吉林',
        '230000': '黑龙江',
        '310000': '上海',
        '320000': '江苏',
        '330000': '浙江',
        '340000': '安徽',
        '350000': '福建',
        '360000': '江西',
        '370000': '山东',
        '410000': '河南',
        '420000': '湖北',
        '430000': '湖南',
        '440000': '广东',
        '450000': '广西',
        '460000': '海南',
        '500000': '重庆',
        '510000': '四川',
        '520000': '贵州',
        '530000': '云南',
        '540000': '西藏',
        '610000': '陕西',
        '620000': '甘肃',
        '630000': '青海',
        '640000': '宁夏',
        '650000': '新疆',
        '710000': '台湾',
        '810000': '香港',
        '820000': '澳门'
    };
    const legacyProvinceNamesByCode = {
        '110000': '北京',
        '120000': '天津',
        '130000': '河北',
        '140000': '山西',
        '150000': '內蒙古',
        '210000': '遼寧',
        '220000': '吉林',
        '230000': '黑龍江',
        '310000': '上海',
        '320000': '江蘇',
        '330000': '浙江',
        '340000': '安徽',
        '350000': '福建',
        '360000': '江西',
        '370000': '山東',
        '410000': '河南',
        '420000': '湖北',
        '430000': '湖南',
        '440000': '廣東',
        '450000': '廣西',
        '460000': '海南',
        '500000': '重慶',
        '510000': '四川',
        '520000': '貴州',
        '530000': '雲南',
        '540000': '西藏',
        '610000': '陝西',
        '620000': '甘肅',
        '630000': '青海',
        '640000': '寧夏',
        '650000': '新疆',
        '710000': '臺灣',
        '810000': '香港',
        '820000': '澳門'
    };
    const provinceCodes = new Set(Object.keys(legacyProvinceNamesByCode));
    const provinceCodeByAlias = buildProvinceCodeByAliasMap();

    function normalizeProvinceAlias(value) {
        return String(value || '')
            .trim()
            .replace(/\s+/g, '')
            .replace(/[（(][^）)]*[）)]/g, '')
            .replace(
                /(维吾尔自治区|維吾爾自治區|壮族自治区|壯族自治區|回族自治区|回族自治區|特别行政区|特別行政區|自治区|自治區|省|市)$/u,
                ''
            );
    }

    function buildProvinceCodeByAliasMap() {
        const aliasMap = new Map();

        provinceCodes.forEach((provinceCode) => {
            [
                provinceCode,
                simplifiedProvinceNamesByCode[provinceCode],
                legacyProvinceNamesByCode[provinceCode]
            ].forEach((alias) => {
                const normalizedAlias = normalizeProvinceAlias(alias);
                if (normalizedAlias) {
                    aliasMap.set(normalizedAlias, provinceCode);
                }
            });
        });

        return aliasMap;
    }

    function resolveProvinceCode(value) {
        const normalizedAlias = normalizeProvinceAlias(value);
        return provinceCodeByAlias.get(normalizedAlias) || '';
    }

    function getProvinceCodeFromFeature(feature) {
        const properties = feature && feature.properties ? feature.properties : {};

        return (
            resolveProvinceCode(properties.code)
            || resolveProvinceCode(properties.filename)
            || resolveProvinceCode(properties.name)
            || resolveProvinceCode(properties.fullname)
            || resolveProvinceCode(properties.province)
        );
    }

    function getProvinceCodeFromItem(item) {
        return (
            resolveProvinceCode(item && item.provinceCode)
            || resolveProvinceCode(item && item.code)
            || resolveProvinceCode(item && item.province)
            || resolveProvinceCode(item && item.name)
            || resolveProvinceCode(item && item.fullname)
        );
    }

    function getProvinceCountIncrement(item) {
        const numericCount = Number(item && item.count);
        return Number.isFinite(numericCount) ? numericCount : 1;
    }

    function buildProvinceCountMap(items) {
        const countMap = new Map();

        (Array.isArray(items) ? items : []).forEach((item) => {
            const provinceCode = getProvinceCodeFromItem(item);
            if (!provinceCode) {
                return;
            }

            countMap.set(provinceCode, (countMap.get(provinceCode) || 0) + getProvinceCountIncrement(item));
        });

        return countMap;
    }

    return {
        buildProvinceCountMap,
        getProvinceCodeFromFeature,
        normalizeProvinceAlias,
        resolveProvinceCode
    };
});
