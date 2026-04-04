(function attachFormAutocomplete(globalObject, factory) {
    const exports = factory(globalObject);

    if (typeof module === 'object' && module.exports) {
        module.exports = exports;
    }

    globalObject.FormAutocomplete = exports;
})(typeof globalThis !== 'undefined' ? globalThis : this, (globalObject) => {
    const MAX_AUTOCOMPLETE_RESULTS = 8;
    let recordsCache = null;
    let recordsRequest = null;

    // 搜索时忽略大小写和空白，提升学校名/地址混合输入的命中率。
    function normalizeAutocompleteText(value) {
        return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    }

    // 原始地图数据里可能有重复学校，这里先按“名称+地址”做一次去重。
    function buildAutocompleteRecords(data) {
        const dedupedRecords = new Map();

        (Array.isArray(data) ? data : []).forEach((item) => {
            const name = String(item && item.name ? item.name : '').trim();
            const addr = String(item && item.addr ? item.addr : '').trim();

            if (!name && !addr) {
                return;
            }

            const record = {
                name,
                addr,
                normalizedName: normalizeAutocompleteText(name),
                normalizedAddr: normalizeAutocompleteText(addr)
            };
            const dedupeKey = `${record.normalizedName}::${record.normalizedAddr}`;

            if (!dedupedRecords.has(dedupeKey)) {
                dedupedRecords.set(dedupeKey, record);
            }
        });

        return [...dedupedRecords.values()];
    }

    // 评分越小越靠前：优先当前字段前缀命中，再退化到包含匹配。
    function getMatchScore(record, query, field) {
        const primaryText = field === 'address' ? record.normalizedAddr : record.normalizedName;
        const secondaryText = field === 'address' ? record.normalizedName : record.normalizedAddr;
        const combinedText = `${record.normalizedName} ${record.normalizedAddr}`.trim();

        if (primaryText.startsWith(query)) {
            return 0;
        }

        if (primaryText.includes(query)) {
            return 1;
        }

        if (secondaryText.startsWith(query)) {
            return 2;
        }

        if (secondaryText.includes(query)) {
            return 3;
        }

        if (combinedText.includes(query)) {
            return 4;
        }

        return Number.POSITIVE_INFINITY;
    }

    // 自动补全结果按匹配质量排序，并限制数量，避免下拉列表过长。
    function getAutocompleteSuggestions(records, keyword, field, limit = MAX_AUTOCOMPLETE_RESULTS) {
        const normalizedKeyword = normalizeAutocompleteText(keyword);
        if (!normalizedKeyword) {
            return [];
        }

        return records
            .map((record) => ({
                record,
                score: getMatchScore(record, normalizedKeyword, field)
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((left, right) => {
                if (left.score !== right.score) {
                    return left.score - right.score;
                }

                return (left.record.name || left.record.addr).localeCompare(right.record.name || right.record.addr, 'zh-Hans-CN');
            })
            .slice(0, limit)
            .map((entry) => entry.record);
    }

    async function fetchMapDataPayload() {
        if (typeof globalObject.getSharedMapData === 'function') {
            return globalObject.getSharedMapData();
        }

        const response = await globalObject.fetch(globalObject.API_URL);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error((payload && payload.error) || '數據加載失敗');
        }

        return payload;
    }

    // 读取补全数据时同时做“结果缓存 + 请求去重”，减少重复网络开销。
    async function loadAutocompleteRecords() {
        if (recordsCache) {
            return recordsCache;
        }

        if (recordsRequest) {
            return recordsRequest;
        }

        recordsRequest = fetchMapDataPayload()
            .then((payload) => {
                recordsCache = buildAutocompleteRecords(payload && payload.data);
                return recordsCache;
            })
            .catch((error) => {
                recordsRequest = null;
                throw error;
            });

        return recordsRequest;
    }

    function hideResults(resultsList) {
        if (!resultsList) {
            return;
        }

        resultsList.replaceChildren();
        resultsList.hidden = true;
    }

    function renderSuggestions({
        resultsList,
        suggestions,
        onSelect
    }) {
        if (!resultsList) {
            return;
        }

        resultsList.replaceChildren();

        if (suggestions.length === 0) {
            resultsList.hidden = true;
            return;
        }

        suggestions.forEach((record) => {
            const item = document.createElement('div');
            const title = document.createElement('span');
            const address = document.createElement('small');

            item.className = 'result-item';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');

            title.className = 'school-title';
            title.textContent = record.name || record.addr || '';
            item.appendChild(title);

            if (record.addr) {
                address.className = 'school-addr';
                address.textContent = record.addr;
                item.appendChild(address);
            }

            item.addEventListener('mousedown', (event) => {
                event.preventDefault();
                onSelect(record);
            });

            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(record);
                }
            });

            resultsList.appendChild(item);
        });

        resultsList.hidden = false;
    }

    function initFormAutocomplete() {
        if (typeof document === 'undefined') {
            return;
        }

        const schoolInput = document.getElementById('school_input');
        const addressInput = document.getElementById('addr');
        const schoolResultsList = document.getElementById('school_results_list');
        const addressResultsList = document.getElementById('address_results_list');

        if (!schoolInput || !addressInput || !schoolResultsList || !addressResultsList) {
            return;
        }

        function applySuggestion(record) {
            // 选中学校时同步回填地址，减少用户二次输入。
            schoolInput.value = record.name || schoolInput.value;
            addressInput.value = record.addr || addressInput.value;
            schoolInput.setCustomValidity('');
            addressInput.setCustomValidity('');
            hideResults(schoolResultsList);
            hideResults(addressResultsList);
        }

        async function updateSuggestions(field) {
            const input = field === 'address' ? addressInput : schoolInput;
            const resultsList = field === 'address' ? addressResultsList : schoolResultsList;
            const otherResultsList = field === 'address' ? schoolResultsList : addressResultsList;
            const keyword = input.value.trim();

            // 同一时刻只保留当前输入框对应的候选面板，避免两列结果同时展开。
            hideResults(otherResultsList);

            if (!keyword) {
                hideResults(resultsList);
                return;
            }

            try {
                const records = await loadAutocompleteRecords();
                const suggestions = getAutocompleteSuggestions(records, keyword, field);

                renderSuggestions({
                    resultsList,
                    suggestions,
                    onSelect: applySuggestion
                });
            } catch (error) {
                console.error('学校补全数据加载失败:', error);
                hideResults(resultsList);
            }
        }

        function bindInputAutocomplete(input, field) {
            let debounceTimer = null;

            input.addEventListener('focus', () => {
                // 聚焦时先预热数据，首个字符输入后的响应会更快。
                loadAutocompleteRecords().catch((error) => {
                    console.debug('预加载学校补全数据失败:', error);
                });

                if (input.value.trim()) {
                    updateSuggestions(field);
                }
            });

            input.addEventListener('input', () => {
                // 防抖处理，避免用户连续输入时每个字符都触发一次筛选。
                globalObject.clearTimeout(debounceTimer);
                debounceTimer = globalObject.setTimeout(() => {
                    updateSuggestions(field);
                }, 150);
            });
        }

        bindInputAutocomplete(schoolInput, 'name');
        bindInputAutocomplete(addressInput, 'address');

        document.addEventListener('click', (event) => {
            if (!schoolResultsList.parentElement.contains(event.target)) {
                hideResults(schoolResultsList);
            }

            if (!addressResultsList.parentElement.contains(event.target)) {
                hideResults(addressResultsList);
            }
        });
    }

    if (typeof document !== 'undefined') {
        initFormAutocomplete();
    }

    return {
        buildAutocompleteRecords,
        getAutocompleteSuggestions,
        normalizeAutocompleteText
    };
});
