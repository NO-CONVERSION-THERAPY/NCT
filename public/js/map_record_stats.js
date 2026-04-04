(function attachMapRecordStats(globalObject, factory) {
    const exports = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = exports;
    }

    globalObject.MapRecordStats = exports;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
    const SELF_REPORT_INPUT_TYPE = '受害者本人';
    const AGENT_REPORT_INPUT_TYPE = '受害者的代理人';

    function normalizeSchoolStatsText(value) {
        return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function getSchoolStatsKey(record) {
        const normalizedName = normalizeSchoolStatsText(record && record.name);
        const normalizedProvince = normalizeSchoolStatsText(record && record.province);
        const normalizedAddress = normalizeSchoolStatsText(record && record.addr);

        if (normalizedName && normalizedProvince) {
            return `${normalizedName}::${normalizedProvince}`;
        }

        if (normalizedName) {
            return normalizedName;
        }

        if (normalizedProvince || normalizedAddress) {
            return `${normalizedProvince}::${normalizedAddress}`;
        }

        return '';
    }

    function buildSchoolReportStats(records) {
        const statsBySchool = new Map();

        (Array.isArray(records) ? records : []).forEach((record) => {
            const schoolKey = getSchoolStatsKey(record);
            if (!schoolKey) {
                return;
            }

            if (!statsBySchool.has(schoolKey)) {
                statsBySchool.set(schoolKey, {
                    selfCount: 0,
                    agentCount: 0
                });
            }

            const schoolStats = statsBySchool.get(schoolKey);

            if (record && record.inputType === SELF_REPORT_INPUT_TYPE) {
                schoolStats.selfCount += 1;
            } else if (record && record.inputType === AGENT_REPORT_INPUT_TYPE) {
                schoolStats.agentCount += 1;
            }
        });

        return statsBySchool;
    }

    function getRecordBodyPageKey(record) {
        return [
            record && record.HMaster,
            record && record.province,
            record && record.prov,
            record && record.addr,
            record && record.experience,
            record && record.scandal,
            record && record.else,
            record && record.contact
        ]
            .map((value) => normalizeSchoolStatsText(value))
            .join('::');
    }

    function groupSchoolRecords(records) {
        const groupedRecords = [];
        const groupBySchoolKey = new Map();

        (Array.isArray(records) ? records : []).forEach((record, index) => {
            const schoolKey = getSchoolStatsKey(record) || `__unknown__:${index}`;
            let group = groupBySchoolKey.get(schoolKey);

            if (!group) {
                group = {
                    schoolKey,
                    summaryRecord: record,
                    pages: [],
                    pageKeys: new Set()
                };
                groupBySchoolKey.set(schoolKey, group);
                groupedRecords.push(group);
            }

            const pageKey = getRecordBodyPageKey(record);
            if (!group.pageKeys.has(pageKey)) {
                group.pageKeys.add(pageKey);
                group.pages.push(record);
            }
        });

        return groupedRecords.map((group) => ({
            schoolKey: group.schoolKey,
            summaryRecord: group.summaryRecord,
            pages: group.pages
        }));
    }

    function getSchoolReportStats(statsBySchool, record) {
        const schoolKey = getSchoolStatsKey(record);
        if (!schoolKey || !(statsBySchool instanceof Map) || !statsBySchool.has(schoolKey)) {
            return {
                selfCount: 0,
                agentCount: 0
            };
        }

        return statsBySchool.get(schoolKey);
    }

    return {
        buildSchoolReportStats,
        groupSchoolRecords,
        getSchoolReportStats,
        getSchoolStatsKey
    };
});
