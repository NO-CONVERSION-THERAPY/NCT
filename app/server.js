const app = require('./app');
const { appPort, apiUrl, debugMod } = require('../config/appConfig');

// server.js 只负责启动 HTTP 服务，业务装配在 app/app.js 里。
module.exports = app;

if (require.main === module) {
  app.listen(appPort, () => {
    if (debugMod === 'true') {
      console.warn('警告！你現在在調試模式', debugMod, 'api获取位置：', apiUrl);
    }
    console.log(`Server is running at http://localhost:${appPort}`);
  });
}
