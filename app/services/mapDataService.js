const axios = require('axios');

// 地图数据缓存放在 service 层，避免每次请求都直打 Apps Script。
let cachedData = null;
let lastFetchTime = 0;
const cacheDurationMs = 300000;

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
    .map((item) => ({
      name: item['學校名稱'] || '未填寫名稱',
      addr: item['學校地址'] || '無地址',
      province: item['省份'] || '',
      prov: item['區、縣'] || '',
      else: item['其他'] || '',
      lat: parseFloat(item.lat || item['緯度']),
      lng: parseFloat(item.lng || item['經度']),
      experience: item['請問您在那裏都經歷了什麼？'],
      HMaster: item['校長名字'] || '',
      scandal: item['學校的醜聞'] || '',
      contact: item['學校的聯繫方式'] || '',
      inputType: item['請問您是什麽身份？'] || ''
    }));
}

// 公开地图接口的主逻辑：读取远端数据、清洗、缓存、失败时尽量回退到缓存。
async function getMapData(googleScriptUrl) {
  const now = Date.now();

  if (cachedData && now - lastFetchTime < cacheDurationMs) {
    return cachedData;
  }

  try {
    const response = await axios.get(googleScriptUrl, {
      timeout: 10000
    });
    const rawData = normalizeRawData(response.data.data);
    const finalResponse = {
      avg_age: response.data.avg_age,
      last_synced: now,
      statistics: response.data.statistics,
      data: cleanMapData(rawData)
    };

    cachedData = finalResponse;
    lastFetchTime = now;

    return finalResponse;
  } catch (error) {
    if (cachedData) {
      return cachedData;
    }

    if (error instanceof SyntaxError) {
      throw new Error('數據解析失敗');
    }

    throw error;
  }
}

module.exports = {
  getMapData
};
