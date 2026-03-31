const express = require('express');
const { getMapData } = require('../services/mapDataService');

// API 路由只负责把 service 层返回的数据转成 HTTP 响应。
function createApiRoutes({ googleScriptUrl }) {
  const router = express.Router();

  // 对外公开的地图数据接口。
  router.get('/api/map-data', async (req, res) => {
    try {
      const mapData = await getMapData(googleScriptUrl);
      return res.json(mapData);
    } catch (error) {
      console.error('API Error:', error.message);
      return res.status(500).json({ error: req.t('server.mapDataUnavailable') });
    }
  });

  return router;
}

module.exports = createApiRoutes;
