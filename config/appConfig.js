require('dotenv').config();

// 所有运行时环境变量统一从这里读，避免业务代码四处直接碰 process.env。
const debugMod = process.env.DEBUG_MOD || 'false';
const title = process.env.TITLE;
const formDryRun = process.env.FORM_DRY_RUN === 'true';
const submitRateLimitMax = Number(process.env.SUBMIT_RATE_LIMIT_MAX || 5);
const formId = process.env.FORM_ID || '1FAIpQLScggjQgYutXQrjQDrutyxL0eLaFMktTMRKsFWPffQGavUFspA';
const googleFormUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
const appPort = Number(process.env.PORT || 3000);
const apiUrl = debugMod === 'true' ? 'https://nct.hosinoneko.me/api/map-data' : '/api/map-data';

module.exports = {
  appPort,
  apiUrl,
  debugMod,
  formDryRun,
  formId,
  googleFormUrl,
  googleScriptUrl,
  submitRateLimitMax,
  title
};
