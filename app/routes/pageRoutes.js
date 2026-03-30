const express = require('express');
const { loadFriends } = require('../services/friendsService');

// 页面路由只负责渲染模板，不承载表单提交或 API 逻辑。
function createPageRoutes({ apiUrl, areaOptions, formRules, title }) {
  const router = express.Router();

  // 首頁：项目导航入口。
  router.get('/', (req, res) => {
    res.render('index', {
      t: req.t,
      title: `主頁|${title}`,
      apiUrl
    });
  });

  // 表單頁：把地区联动数据和前端校验规则一并下发到模板。
  router.get('/form', (req, res) => {
    res.render('form', {
      t: req.t,
      title: `填寫表單|${title}`,
      apiUrl,
      areaOptions,
      formRules
    });
  });

  // 地圖頁：展示汇总后的机构数据。
  router.get('/map', (req, res) => {
    res.render('map', {
      t: req.t,
      title: `地圖|${title}`,
      apiUrl
    });
  });

  // 關於頁：这里额外读取 friends.json 作为友链数据源。
  router.get('/aboutus', (req, res) => {
    res.render('about', {
      t: req.t,
      title: `關於我們|${title}`,
      friends: loadFriends(),
      apiUrl
    });
  });

  // 預留的調試頁面入口。
  router.get('/debug', (req, res) => {
    res.render('debug', {
      t: req.t,
      apiUrl
    });
  });

  return router;
}

module.exports = createPageRoutes;
