# N·C·T

N·C·T 是一個用來記錄、整理、公開展示「扭轉治療」相關機構與經歷資訊的站點。它提供匿名表單、公開地圖、文章頁面與多語言界面，也保留了自部署能力，方便在不同環境持續運行。

## 線上入口

- 站點首頁：https://nct.hosinoneko.me
- 匿名表單：https://nct.hosinoneko.me/form
- 公開地圖：https://nct.hosinoneko.me/map
- 隱私說明：https://nct.hosinoneko.me/privacy

## 核心能力

- 匿名表單提交，包含基礎防刷、限流與審計日志。
- 公開機構地圖與 `GET /api/map-data` 資料接口。
- 博客、通知與一般內容頁面。
- 多語言界面與部分內容翻譯。
- `sitemap.xml`、`robots.txt` 自動輸出。
- 支援 Node.js 本地運行與 Cloudflare Workers 部署。

## 技術棧

- Node.js 20+
- Express 5
- EJS
- Cloudflare Workers
- Google Form
- 可選 Google Apps Script 資料源
- 可選 Google Cloud Translation API

## 快速開始

### 1. 安裝

```bash
git clone https://github.com/HosinoEJ/No-Torsion.git
cd No-Torsion
npm install
```

### 2. 選擇本地運行方式

Node 模式：

```bash
cp .env.example .env
npm start
```

Workers 模式：

```bash
cp .dev.vars.example .dev.vars
npm run dev:workers
```

建議：

- 本地開發先保持 `FORM_DRY_RUN="true"`，避免誤提交到正式 Google Form。
- Node 模式用 `.env`，Workers 模式用 `.dev.vars`，不要混用。
- 完整配置註釋請直接看 [`.env.example`](./.env.example) 和 [`.dev.vars.example`](./.dev.vars.example)。

### 3. 常用命令

- `npm start`：以 Node.js 啓動應用。
- `npm run dev:workers`：用 Wrangler 本地調試 Workers 版本。
- `npm test`：跑測試。
- `npm run build`：做一次啓動級別的構建檢查。
- `npm run secure-config -- bootstrap-env --env-file ".env"`：從現有 env 檔讀取 `FORM_ID` / `GOOGLE_SCRIPT_URL`，自動生成密文。
- `npm run secure-config -- bootstrap --form-id "..." --google-script-url "..."`：一次性生成 `FORM_PROTECTION_SECRET` 和對應密文。
- `npm run secure-config -- generate-secret`：生成高強度 `FORM_PROTECTION_SECRET`。

## 重要配置

README 只保留最常用項；完整配置請看 [`.env.example`](./.env.example)。

| 變數 | 用途 |
| --- | --- |
| `SITE_URL` | 站點正式網址，用於 sitemap、robots 與 canonical 等輸出 |
| `FORM_DRY_RUN` | `true` 時只預覽提交，不真正送出 |
| `FORM_PROTECTION_SECRET` | 表單保護與密文解密的核心 secret，正式環境務必顯式配置 |
| `FORM_ID` / `FORM_ID_ENCRYPTED` | Google Form ID，二選一 |
| `GOOGLE_SCRIPT_URL` / `GOOGLE_SCRIPT_URL_ENCRYPTED` | 私有 Apps Script 資料源，二選一 |
| `PUBLIC_MAP_DATA_URL` | 沒有私有資料源時使用的公開地圖 API |
| `GOOGLE_CLOUD_TRANSLATION_API_KEY` | 啓用翻譯功能時必填 |
| `MAINTENANCE_MODE` | 全站維護開關 |
| `MAINTENANCE_NOTICE` | 維護頁公告文字 |
| `RATE_LIMIT_REDIS_URL` | 多實例部署時建議配置的共享限流存儲 |

配置原則：

- `FORM_ID` 和 `FORM_ID_ENCRYPTED` 只選一個。
- `GOOGLE_SCRIPT_URL` 和 `GOOGLE_SCRIPT_URL_ENCRYPTED` 只選一個。
- 使用密文配置時，必須顯式配置 `FORM_PROTECTION_SECRET`。
- Workers 正式部署時，敏感值請放到 Cloudflare `Variables and Secrets`，不要寫進倉庫或 `wrangler.jsonc`。
- 如果你暫時不使用密文配置，至少請把 `FORM_ID`、`GOOGLE_SCRIPT_URL` 和 `FORM_PROTECTION_SECRET` 都設成 `Secret`。
- 如果你使用密文配置，推薦把 `FORM_PROTECTION_SECRET` 設成 `Secret`，`FORM_ID_ENCRYPTED` 和 `GOOGLE_SCRIPT_URL_ENCRYPTED` 可用 `Text` 或 `Secret`。

## 保護敏感配置

如果你不想把 `FORM_ID` 或 `GOOGLE_SCRIPT_URL` 以明文方式放在普通環境變數中，可以改用密文配置。

如果你已經把 `FORM_ID` 和 `GOOGLE_SCRIPT_URL` 寫進 `.env` 或 `.dev.vars`，最省事的方式是直接從檔案讀取並生成：

```bash
npm run secure-config -- bootstrap-env --env-file ".env"
```

它會直接輸出：

- `FORM_PROTECTION_SECRET`
- `FORM_ID_ENCRYPTED`
- `GOOGLE_SCRIPT_URL_ENCRYPTED`

Workers 本地調試時，也可以改讀 `.dev.vars`：

```bash
npm run secure-config -- bootstrap-env --env-file ".dev.vars"
```

如果你只想分步操作，也可以手動先生成 secret，再分別加密：

```bash
npm run secure-config -- generate-secret
```

```bash
npm run secure-config -- encrypt --purpose form-id --secret "你的_FORM_PROTECTION_SECRET" --value "你的_GOOGLE_FORM_ID"
npm run secure-config -- encrypt --purpose google-script-url --secret "你的_FORM_PROTECTION_SECRET" --value "你的_GOOGLE_SCRIPT_URL"
```

需要明確的邊界：

- 這能降低明文出現在倉庫、日誌、普通配置欄位或調試頁中的風險。
- 這不是替代後端鑑權的方案；如果攻擊者能讀取服務端所有 secrets，密文與解密 secret 最終仍可能一起暴露。
- 真正要防止繞過網站驗證，最可靠的方法仍然是不要把最終寫入入口設計成可匿名直打的公開 Google Form。

## 表單隱私說明

目前表單頁與 `/privacy` 頁面對外使用的說明如下：

> 隐私说明：本问卷中填写的出生年份、性别等个人基本信息将被严格保密，相关经历、机构曝光信息可能在本站公开页面展示。提交内容会通过 Google Form / Google 表格保存和整理；请勿在可能公开的字段中填写身份证号、私人电话、家庭住址等您的个人敏感信息。

如果你後續調整了公開字段範圍，記得同步更新：

- 表單頁提示文案 `form.privacyNotice`
- 隱私頁 `/privacy`
- README 中這段說明

## 部署到 Cloudflare Workers

本專案正式部署以 GitHub + Workers Builds 為主。

### 1. 本地先驗證

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev:workers
npm test
```

### 2. 連接 GitHub 倉庫

在 Cloudflare Dashboard 中：

1. 進入 `Workers & Pages`
2. 點擊 `Create application`
3. 選擇 `Import a repository`
4. 授權 GitHub App 並選擇本專案倉庫

### 3. 建議的構建設置

| 項目 | 建議值 |
| --- | --- |
| `Root directory` | `.` |
| `Build command` | 留空 |
| `Deploy command` | `npm run deploy:workers` |

補充：

- 正式部署分支可在 `Settings -> Build -> Branch control` 中調整。
- 倉庫中的 [`wrangler.jsonc`](./wrangler.jsonc) 只保留必要的 `RUNTIME_TARGET="workers"`，其他變數請放到 Dashboard 或本地 `.dev.vars`。

### 4. 補齊 Variables 和 Secrets

至少建議配置以下項目：

部署建議：

- 最簡單且正確的做法，是把 `FORM_ID`、`GOOGLE_SCRIPT_URL`、`FORM_PROTECTION_SECRET` 都設成 `Secret`。
- 如果你要進一步降低明文誤暴露風險，再改用 `FORM_ID_ENCRYPTED`、`GOOGLE_SCRIPT_URL_ENCRYPTED`，並保留 `FORM_PROTECTION_SECRET` 為 `Secret`。

| 名稱 | 類型 | 說明 |
| --- | --- | --- |
| `SITE_URL` | Text | 正式站點網址 |
| `FORM_DRY_RUN` | Text | 正式環境建議為 `false` |
| `FORM_PROTECTION_SECRET` | Secret | 表單保護與密文解密所需 |
| `FORM_ID` | Secret | 明文 Google Form ID；簡單方案推薦這樣配置 |
| `FORM_ID_ENCRYPTED` | Text 或 Secret | 加密後的 Google Form ID；使用時留空 `FORM_ID` |
| `GOOGLE_SCRIPT_URL` | Secret | 明文私有資料源 URL；簡單方案推薦這樣配置 |
| `GOOGLE_SCRIPT_URL_ENCRYPTED` | Text 或 Secret | 加密後的私有資料源 URL；使用時留空 `GOOGLE_SCRIPT_URL` |
| `PUBLIC_MAP_DATA_URL` | Text | 沒有私有資料源時的回退公開 API |
| `GOOGLE_CLOUD_TRANSLATION_API_KEY` | Secret | 只有啓用翻譯時才需要 |
| `MAINTENANCE_MODE` | Text | 需要全站維護時設為 `true` |
| `MAINTENANCE_NOTICE` | Text | 維護公告文字 |
| `RATE_LIMIT_REDIS_URL` | Secret | 多實例部署建議配置 |

### 5. 綁定正式域名

如果你不想使用 `*.workers.dev`，可以在 `Settings -> Domains & Routes` 裡新增自定義域名。綁定完成後，記得同步更新：

- `SITE_URL`
- `PUBLIC_MAP_DATA_URL`

## 相關檔案

- [`.env.example`](./.env.example)：Node 模式環境變數示例
- [`.dev.vars.example`](./.dev.vars.example)：Workers 本地調試示例
- [`wrangler.jsonc`](./wrangler.jsonc)：Workers 配置
- [`scripts/secure-config.js`](./scripts/secure-config.js)：敏感配置加密工具

如果你要調整公開字段、提交流程或資料上游，建議連同 [`/privacy`](https://nct.hosinoneko.me/privacy) 與表單頁提示文案一起檢查，避免對外說明和實際行為脫節。
