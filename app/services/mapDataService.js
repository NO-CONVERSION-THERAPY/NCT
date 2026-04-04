// 地图数据缓存放在 service 层，避免每次请求都直打 Apps Script。
let cachedData = null;
let lastFetchTime = 0;
let inFlightRequest = null;
let lastForceRefreshTime = 0;
const cacheDurationMs = 300000;
// 即使用户手动点刷新，也给上游 Apps Script 一个冷却时间，避免被连续击穿。
const forceRefreshCooldownMs = 30000;

// 远端没有提供 last_synced 时，用当前抓取时间兜底，保证前端总能显示相对时间。
function resolveLastSyncedTimestamp(lastSynced, fallbackTimestamp) {
  const numericLastSynced = Number(lastSynced);
  return Number.isFinite(numericLastSynced) && numericLastSynced > 0 ? numericLastSynced : fallbackTimestamp;
}

// 优先使用服务端私有数据源；没有时再退回公开 map-data 接口。
function resolveMapDataSource({ googleScriptUrl, publicMapDataUrl }) {
  const dataSourceUrl = googleScriptUrl || publicMapDataUrl;

  if (!dataSourceUrl || dataSourceUrl === '/api/map-data') {
    throw new Error('未配置有效的地圖數據源');
  }

  return dataSourceUrl;
}

// Apps Script 可能返回数组，也可能返回 JSON 字符串，这里统一兜底。
function normalizeRawData(rawData) {
  if (Array.isArray(rawData)) {
    return rawData;
  }

  if (typeof rawData === 'string') {
    return JSON.parse(rawData);
  }

  throw new Error('預期收到陣列但得到其他類型');
}

// 对外 API 只暴露前端真正需要的字段，原始表格列不直接透出。
function cleanMapData(rawData) {
  return rawData
    .filter((item) => item && (item.lat || item['緯度']))
    // 同时兼容新字段名与历史中文列名，方便表结构渐进迁移。
    .map((item) => ({
      name: item.name || item['學校名稱'] || '未填寫名稱',
      addr: item.addr || item['學校地址'] || '無地址',
      province: item.province || item['省份'] || '',
      prov: item.prov || item['區、縣'] || '',
      else: item.else || item['其他'] || '',
      lat: parseFloat(item.lat || item['緯度']),
      lng: parseFloat(item.lng || item['經度']),
      experience: item.experience || item['請問您在那裏都經歷了什麼？'] || '',
      HMaster: item.HMaster || item['校長名字'] || '',
      scandal: item.scandal || item['學校的醜聞'] || '',
      contact: item.contact || item['學校的聯繫方式'] || '',
      inputType: item.inputType || item['請問您是什麽身份？'] || ''
    }));
}

// 公开地图接口的主逻辑：读取远端数据、清洗、缓存、失败时尽量回退到缓存。
async function getMapData({ forceRefresh = false, googleScriptUrl, publicMapDataUrl }) {
  const now = Date.now();

  // 常规请求优先命中缓存，避免每次页面访问都走网络。
  if (!forceRefresh && cachedData && now - lastFetchTime < cacheDurationMs) {
    return cachedData;
  }

  // 强制刷新也受冷却保护，避免多个用户同时点刷新时频繁命中上游。
  if (forceRefresh && cachedData && now - lastForceRefreshTime < forceRefreshCooldownMs) {
    return cachedData;
  }

  // 并发请求复用同一个 Promise，避免同一时间发出多次相同抓取。
  if (inFlightRequest) {
    return cachedData && !forceRefresh ? cachedData : inFlightRequest;
  }

  if (forceRefresh) {
    lastForceRefreshTime = now;
  }

  const request = (async () => {
    try {
      const dataSourceUrl = resolveMapDataSource({ googleScriptUrl, publicMapDataUrl });
      const response = await fetch(dataSourceUrl, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`地圖數據源返回 ${response.status}`);
      }

      const responseBody = await response.json();
      const rawData = normalizeRawData(responseBody.data);
      const avgAge = Number(responseBody.avg_age);
      const finalResponse = {
        avg_age: Number.isFinite(avgAge) ? avgAge : 0,//受害者平均年齡
        schoolNum: Number.isFinite(responseBody.SchoolNum) ? Number(responseBody.SchoolNum) : 0,//學校數量
        formNum: Number.isFinite(responseBody.formNum) ? Number(responseBody.formNum) : 0,//表單數量
        last_synced: resolveLastSyncedTimestamp(responseBody.last_synced, now),//上一次更新時間
        statistics: Array.isArray(responseBody.statistics) ? responseBody.statistics : [],//各省扭轉幾個數量
        statisticsForm: Array.isArray(responseBody.statisticsForm) ? responseBody.statisticsForm : [],//各省收到的表單數量
        data: cleanMapData(rawData)
      };

      cachedData = finalResponse;
      lastFetchTime = now;

      return finalResponse;
    } catch (error) {
      // 抓取失败但本地仍有旧缓存时，优先保服务可用而不是直接报错。
      if (cachedData) {
        return cachedData;
      }

      if (error instanceof SyntaxError) {
        throw new Error('數據解析失敗');
      }

      throw error;
    }
  })();

  inFlightRequest = request;

  try {
    return await request;
  } finally {
    if (inFlightRequest === request) {
      inFlightRequest = null;
    }
  }
}

module.exports = {
  getMapData,
  resolveLastSyncedTimestamp,
  resetMapDataCache() {
    cachedData = null;
    inFlightRequest = null;
    lastFetchTime = 0;
    lastForceRefreshTime = 0;
  }
};
