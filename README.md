# N·C·T

## N·C·T Project

[![Status](https://img.shields.io/badge/Status-Active-brightgreen)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)]()

**我們致力於記錄、曝光並抵制所有形式的「扭轉治療」機構。**  
每一份真實的聲音，都是終結傷害的力量。

- 站點首頁：https://nct.hosinoneko.me
- 匿名表單：https://nct.hosinoneko.me/form
- 公開地圖：https://nct.hosinoneko.me/map
- 原始 Google Form：https://forms.gle/eHwkmNCZtmZhLjzh7

> 我們承諾不以任何理由主動收集不必要的個人資訊。

---

## 項目目標

1. 打破信息壟斷，讓更多人看見相關機構與風險資訊。
2. 為受害者與知情者提供一個可匿名提交、可持續保存的經歷記錄入口。
3. 透過地圖與公開 API 讓資料更容易被查閱、分析與再利用。
4. 在必要時支持他人自行部署，降低單點失效與封鎖風險。

## 主要功能

- 匿名表單提交，支援基礎防刷、限流與審計日志。
- 機構地圖頁與公開 `GET /api/map-data` 資料接口。
- 博客 / 通知 / 文章頁面。
- 多語言界面與部分內容翻譯。
- 自動輸出 `sitemap.xml` 與 `robots.txt`。
- 可透過 GitHub + Cloudflare Workers Builds 自動部署。

## 技術棧

- Node.js 18+
- Express 5
- EJS
- Cloudflare Workers
- Google Form
- 可選 Google Apps Script 資料源

當前代碼保留兩種本地運行方式：

- 傳統 Node 啓動：`npm start`
- Workers 本地調試：`npm run dev:workers`

正式部署方式以 **GitHub + Workers Builds** 為主。

---

## 快速開始

### 1. 取得專案

```bash
git clone https://github.com/HosinoEJ/No-Torsion.git
cd No-Torsion
npm install
```

### 2. 建立環境變數

建議直接從範例檔開始：

```bash
cp .env.example .env
```

然後根據你的環境修改 `.env`。

如果你要用 Workers 本地調試，建議改用 `.dev.vars`，不要和 `.env` 混用。

### 3. 本地啓動

Node 模式：

```bash
npm start
```

Workers 模式：

```bash
npm run dev:workers
```

### 4. 跑測試

```bash
npm test
```

> 提示：本地運行時，表單實際提交到 Google Form 可能受到網絡環境影響。開發時建議先使用 `FORM_DRY_RUN="true"`。

---

## 配置說明

完整註釋版配置請直接查看 [.env.example](./.env.example)。

### 常用環境變數

| 變數 | 用途 | 建議 |
| --- | --- | --- |
| `TITLE` | 站點標題 | 一般填 `N·C·T` |
| `DEBUG_MOD` | 是否開啓調試頁 | 本地 `true`，正式 `false` |
| `FORM_DRY_RUN` | 是否只預覽提交、不真正送出 | 本地 `true`，正式 `false` |
| `SITE_URL` | 站點正式網址 | 正式環境必填自己的域名 |
| `SUBMIT_RATE_LIMIT_MAX` | 15 分鐘內單 IP 最多提交次數 | 正式環境建議保留或按需調整 |
| `FORM_PROTECTION_SECRET` | 表單防刷簽名密鑰 | 正式環境強烈建議顯式設置 |
| `FORM_PROTECTION_MIN_FILL_MS` | 最短填寫時間 | 預設 `3000` |
| `FORM_PROTECTION_MAX_AGE_MS` | 表單 token 最長有效期 | 預設 `86400000` |
| `FORM_ID` | Google Form ID | 不填則使用內建預設值 |
| `GOOGLE_SCRIPT_URL` | 私有 Google Apps Script 資料源 | 有私有資料源時填寫 |
| `PUBLIC_MAP_DATA_URL` | 公開地圖 API 地址 | 一般填你的 `/api/map-data` |
| `GOOGLE_CLOUD_TRANSLATION_API_KEY` | Google Cloud Translation API Key | 啓用翻譯功能時必填 |
| `TRANSLATION_PROVIDER_TIMEOUT_MS` | 翻譯請求超時 | 預設 `10000` |
| `TRUST_PROXY` | 是否信任反向代理 | Workers / 代理環境建議啓用 |
| `RATE_LIMIT_REDIS_URL` | 共享限流存儲 | 多實例部署強烈建議配置 |

### 翻譯服務配置

翻譯功能現在只支持 **Google Cloud Translation API**，不再保留其他翻譯 provider，也不再使用非正式公共接口。

建議：

- `GOOGLE_CLOUD_TRANSLATION_API_KEY` 屬於敏感資訊，應放在 Workers `Secret`，不要提交到 GitHub。
- Google Cloud Translation 固定使用官方地址 `https://translation.googleapis.com`，不需要單獨配置 base URL。
- `TRANSLATION_PROVIDER_TIMEOUT_MS` 控制單次翻譯請求超時，預設 `10000` 毫秒。
- 若未配置 `GOOGLE_CLOUD_TRANSLATION_API_KEY`，`/api/translate-text` 會直接返回失敗，地圖詳情與博客雙語區塊也不會顯示翻譯結果。

### 配置建議

- 本地開發：`DEBUG_MOD="true"`、`FORM_DRY_RUN="true"`。
- 正式部署：`DEBUG_MOD="false"`、`FORM_DRY_RUN="false"`。
- 翻譯功能現在只走**正式翻譯後端**，不再使用 `translate.googleapis.com` 這類非正式接口。
- 啓用翻譯時只需要配置 `GOOGLE_CLOUD_TRANSLATION_API_KEY`。
- `FORM_PROTECTION_SECRET` 屬於服務端敏感資訊，不要提交到版本庫。
- 若未配置 `GOOGLE_SCRIPT_URL`，地圖頁會退回使用 `PUBLIC_MAP_DATA_URL`。
- 若未配置 `RATE_LIMIT_REDIS_URL`，限流會退回單實例記憶體模式。

### 翻譯服務示例

Google Cloud Translation：

```bash
GOOGLE_CLOUD_TRANSLATION_API_KEY="替換成你的 Google Cloud API Key"
TRANSLATION_PROVIDER_TIMEOUT_MS="10000"
```

---

## 部署到 Cloudflare Workers

本專案的正式部署流程只保留 **GitHub + Workers Builds**。

倉庫根目錄已包含：

- [worker.mjs](./worker.mjs)：Workers 入口
- [wrangler.jsonc](./wrangler.jsonc)：Workers 配置

這兩個文件會把 `views/`、`blog/`、`public/`、`data.json`、`friends.json` 一併打包進 Workers 的 `/bundle`。

### 0. 前置條件

你需要準備：

- 一個 Cloudflare 帳號
- 一個 GitHub 倉庫
- Node.js 18+
- 已提交並推送的專案代碼

如果你要綁定正式域名，還需要：

- 網域已接入 Cloudflare
- 你對該 zone 擁有管理權限

### 1. 先做本地驗證

部署前建議先在本地驗證 Workers 版本：

```bash
npm install
npm run dev:workers
npm test
```

Workers 本地開發時，建議把變數放進 `.dev.vars`。最小示例：

```bash
TITLE="N·C·T"
DEBUG_MOD="true"
FORM_DRY_RUN="true"
SITE_URL="http://127.0.0.1:8787"
SUBMIT_RATE_LIMIT_MAX="5"
FORM_PROTECTION_SECRET="請換成你自己的長隨機字串"
FORM_PROTECTION_MIN_FILL_MS="3000"
FORM_PROTECTION_MAX_AGE_MS="86400000"
FORM_ID="1FAIpQLScggjQgYutXQrjQDrutyxL0eLaFMktTMRKsFWPffQGavUFspA"
GOOGLE_SCRIPT_URL=""
PUBLIC_MAP_DATA_URL="https://nct.hosinoneko.me/api/map-data"
GOOGLE_CLOUD_TRANSLATION_API_KEY="換成你自己的正式 API Key"
TRANSLATION_PROVIDER_TIMEOUT_MS="10000"
TRUST_PROXY="1"
RATE_LIMIT_REDIS_URL=""
```

### 2. 連接 GitHub 倉庫

1. 將本專案推送到 GitHub。
2. 打開 Cloudflare Dashboard。
3. 進入 **Workers & Pages**。
4. 點擊 **Create application**。
5. 在 **Import a repository** 旁選擇 **Get started**。
6. 授權 **Cloudflare Workers & Pages** GitHub App。
7. 選擇本專案所在的倉庫。

### 3. 配置 Workers Builds

推薦配置：

| 項目 | 建議值 |
| --- | --- |
| `Git branch` | `main` |
| `Root directory` | `.` |
| `Build command` | 留空 |
| `Deploy command` | `npm run deploy:workers` |
| `Non-production branch deploy command` | 保持預設 `npx wrangler versions upload` |

完成後點擊 **Save and Deploy**。

### 4. 補齊 Variables 和 Secrets

第一次部署完成後，請到：

`Workers & Pages` -> 你的 Worker -> `Settings` -> `Variables and Secrets`

建議配置以下值：

| 名稱 | 類型 | 建議 |
| --- | --- | --- |
| `TITLE` | Text | `N·C·T` |
| `DEBUG_MOD` | Text | 正式環境填 `false` |
| `FORM_DRY_RUN` | Text | 正式環境填 `false` |
| `SITE_URL` | Text | 你的正式網址 |
| `SUBMIT_RATE_LIMIT_MAX` | Text | 例如 `5` |
| `FORM_PROTECTION_SECRET` | Secret | 強烈建議配置 |
| `FORM_PROTECTION_MIN_FILL_MS` | Text | 例如 `3000` |
| `FORM_PROTECTION_MAX_AGE_MS` | Text | 例如 `86400000` |
| `FORM_ID` | Text | 你的 Google Form ID |
| `GOOGLE_SCRIPT_URL` | Text 或 Secret | 有私有資料源時填 |
| `PUBLIC_MAP_DATA_URL` | Text | 通常填你的 `/api/map-data` |
| `GOOGLE_CLOUD_TRANSLATION_API_KEY` | Secret | 啓用翻譯功能時必填 |
| `TRANSLATION_PROVIDER_TIMEOUT_MS` | Text | 例如 `10000` |
| `TRUST_PROXY` | Text | 建議 `1` 或 `true` |
| `RATE_LIMIT_REDIS_URL` | Secret | 有共享 Redis 時配置 |

> 建議把 `FORM_PROTECTION_SECRET`、`GOOGLE_CLOUD_TRANSLATION_API_KEY` 與帶密碼的 `RATE_LIMIT_REDIS_URL` 設為 `Secret`，其餘非敏感值可設為 `Text`。

補完變數後，重新觸發一次部署。

### 5. 名稱一致性

如果你是先在 Cloudflare 裡建立 Worker，再去接 GitHub 倉庫，請確保：

- Dashboard 中的 Worker 名稱
- [wrangler.jsonc](./wrangler.jsonc) 裡的 `name`

兩者完全一致，否則 Builds 會失敗。

目前本專案的 Worker 名稱為：

```text
no-torsion
```

### 6. 綁定正式域名

如果你不想使用 `*.workers.dev`，可以綁定自己的 Cloudflare 網域：

1. 進入 **Workers & Pages**
2. 選擇你的 Worker
3. 打開 **Settings > Domains & Routes**
4. 點 **Add > Custom Domain**
5. 輸入你的網域或子網域，例如：
   - `nct.example.com`
   - `example.com`
6. 點 **Add Custom Domain**

綁定成功後，記得同步更新：

- `SITE_URL`
- `PUBLIC_MAP_DATA_URL`

### 7. 上線後檢查清單

正式部署完成後，建議至少手動驗證以下路徑：

- `/`
- `/map`
- `/form`
- `/blog`
- `/api/map-data`
- `/sitemap.xml`
- `/robots.txt`

如果 `FORM_DRY_RUN="false"`，也要實測表單是否能成功送到 Google Form。

### 8. Workers 上的已知差異

- 模板、博客 Markdown 與 JSON 檔案會從 Workers 的 `/bundle` 讀取。
- 翻譯服務已移除 `curl` 子進程兜底，現在固定使用 Google Cloud Translation API。
- 若未配置正式翻譯服務，翻譯相關 API 會直接返回失敗，而不是回退原文。
- `sitemap.xml` 在 Workers 上會優先使用文章元資料中的 `CreationDate` 作為 `lastmod`。
- 若未配置共享 Redis，限流會退回單實例記憶體模式，跨實例一致性較弱。

### 9. 常見問題

**Q: 本地 `npm start` 和 Workers 版本會衝突嗎？**  
A: 不會。兩者只是不同的本地運行入口。

**Q: 為什麼本地 `.env` 能跑，但上到 Workers 還要重新填變數？**  
A: 因為 Cloudflare 線上環境不會讀你本地磁碟裡的 `.env`，必須在 Dashboard 中重新配置。

**Q: 這個專案要不要額外跑前端 build？**  
A: 目前不需要。Workers Builds 的 `Build command` 一般留空即可。

**Q: 為什麼 `Deploy command` 用的是 `npm run deploy:workers`？**  
A: 因為它會呼叫 `npx wrangler deploy`，且與本倉庫的 `package.json` 保持一致。

---

## 公開 API

### `GET /api/map-data`

公開接口：

```text
https://nct.hosinoneko.me/api/map-data
```

如果你是自行部署，則改用你自己的域名，例如：

```text
https://你的網域/api/map-data
```

返回值示例：

```json
{
  "avg_age": 17,
  "last_synced": 1774925078387,
  "statistics": [
    { "province": "河南", "count": 12 },
    { "province": "湖北", "count": 66 }
  ],
  "data": [
    {
      "name": "學校名稱",
      "addr": "學校地址",
      "province": "省份",
      "prov": "區、縣",
      "else": "其他補充内容",
      "lat": 36.62728,
      "lng": 118.58882,
      "experience": "經歷描述",
      "HMaster": "負責人/校長姓名",
      "scandal": "已知醜聞",
      "contact": "學校聯繫方式",
      "inputType": "受害者本人"
    }
  ]
}
```

字段說明：

- `lat` / `lng`：經緯度
- `last_synced`：毫秒級 Unix timestamp
- 真正的機構列表位於 `data` 欄位

### 站點還會自動輸出

```text
https://你的網域/sitemap.xml
https://你的網域/robots.txt
```

### 最簡單的調用示例

```html
<script>
  fetch('https://你的網域/api/map-data')
    .then((res) => res.json())
    .then((payload) => {
      console.log(payload.data);
    });
</script>
```

如果你想把資料做成地圖，可直接配合 [Leaflet](https://leafletjs.com) 等前端地圖庫使用；本專案自己的 `/map` 頁面就是一個完整示例。

---

## 貢獻

歡迎提交 issue、PR 或 fork 自行部署。

在提交前建議至少確認：

```bash
npm test
```

若你是針對部署、環境變數或表單流程做修改，也建議一併驗證：

- `/form`
- `/submit`
- `/api/map-data`
- `/blog`

---

## 授權

本專案授權資訊請參見 [LICENSE](./LICENSE)。
