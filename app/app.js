const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { apiUrl, formDryRun, googleFormUrl, googleScriptUrl, submitRateLimitMax, title } = require('../config/appConfig');
const { areaOptions, formRules } = require('../config/formConfig');
const { helmetConfig, requestBodyLimits } = require('../config/security');
const createApiRoutes = require('./routes/apiRoutes');
const createFormRoutes = require('./routes/formRoutes');
const createPageRoutes = require('./routes/pageRoutes');

// 统一装配 Express 应用：中间件、模板引擎和路由都从这里接入。
const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(helmet(helmetConfig));

// 模板与静态资源根目录。
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');

// 限制请求体大小，避免超大 payload 直接打进业务逻辑。
app.use(express.urlencoded({ extended: true, limit: requestBodyLimits.urlencoded }));
app.use(express.json({ limit: requestBodyLimits.json }));

// 页面、表单、API 三类路由分开挂载，便于后续继续扩展。
app.use(createPageRoutes({
  apiUrl,
  areaOptions,
  formRules,
  title
}));
app.use(createFormRoutes({
  formDryRun,
  googleFormUrl,
  submitRateLimitMax,
  title
}));
app.use(createApiRoutes({
  googleScriptUrl
}));

module.exports = app;
