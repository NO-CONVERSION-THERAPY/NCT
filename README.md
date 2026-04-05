# NO CONVERSION THERAPY

## N·C·T project

[![Status](https://img.shields.io/badge/Status-Active-brightgreen)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)]()

**我們致力於記錄、曝光並抵制所有形式的「扭轉治療」機構。** 每一份真實的聲音，都是終結傷害的力量。你的簽名與參與，將幫助更多人避開深淵。

---

## 我爲什麼要這麼做？

1. **信息對稱**：打破非法人格糾正機構的信息壟斷。
2. **證據固定**：為受害者提供一個經歷記錄平台。
3. **地圖瀏覽**：讓所有人看到那些溝槽的物件在國内的覆蓋程度
4. **法律推動**：wc這個好像有點難，但是我們在做了！！！！

## 表單收集

如果你曾是受害者或知情者，請通過我們的網站匿名提交詳細信息。我們會根據您的表單匯總出一個地圖：
 **[填寫表單](https://NCT.hosinoneko.me/form)**

原表單LINK:[Google From](https://forms.gle/eHwkmNCZtmZhLjzh7)

*我承諾我不會以任何理由收集您的個人資訊*

---

## Stargazers over time
[![Stargazers over time](https://starchart.cc/NO-CONVERSION-THERAPY/NCT.svg?variant=adaptive)](https://starchart.cc/NO-CONVERSION-THERAPY/NCT)

---

## 開發與貢獻

若出現國家級的域名封鎖，各位可以自行部署。

本專案基於 **Node.js + Express + EJS** 構建，並部署於 Vercel。

### 環境要求
- Node.js 18.x 

### 快速開始

Build command
```bash
npm install
```

請先在專案根目錄建立 `.env`：

```bash
# 站點標題
TITLE="NO CONVERSION THERAPY"

# 本地開發建議開啓，方便直接走公開地圖 API
DEBUG_MOD="true"

# 本地開發建議開啓，提交表單時只顯示預覽，不真的送到 Google Form
FORM_DRY_RUN="true"

# 站點對外網址，會用於 sitemap.xml / robots.txt
SITE_URL="https://nct.hosinoneko.me"

# 服務埠號
PORT="3000"

# 表單提交限流，15 分鐘內最多提交次數
SUBMIT_RATE_LIMIT_MAX="5"

# 表單防刷 token 的簽名密鑰；正式環境強烈建議設置一個長隨機字串
# 用途：/form 下發的 form_token 會用它簽名，/submit 會用它驗證 token 是否被篡改
# 要求：所有應用實例必須使用同一個值，建議使用至少 32 位隨機字串
# 示例：openssl rand -hex 32
FORM_PROTECTION_SECRET=""

# 表單最短填寫時間（毫秒），過快提交會被視為異常
FORM_PROTECTION_MIN_FILL_MS="3000"

# 表單 token 最長有效時間（毫秒），超過後需刷新表單重新取得
FORM_PROTECTION_MAX_AGE_MS="86400000"

# Google Form 的表單 ID；不填則使用專案內建預設值
FORM_ID="1FAIpQLScggjQgYutXQrjQDrutyxL0eLaFMktTMRKsFWPffQGavUFspA"

# Google Apps Script API 位址
# 若未設置，地圖頁會直接使用公開 API
GOOGLE_SCRIPT_URL=""

# 公開地圖資料 API
PUBLIC_MAP_DATA_URL="https://nct.hosinoneko.me/api/map-data"

# 若部署在 Nginx / Caddy / Vercel 等反向代理後，可設為 1 或 true
# 讓限流與審計正確識別用戶真實 IP。Vercel 會自動開啓。
TRUST_PROXY="false"

# 若部署為多實例，建議配置共享 Redis，讓限流能跨實例生效
# 也可直接使用 REDIS_URL
# 用途：讓 /submit 與其他限流接口共用同一份計數，避免多實例時每台各算各的
# 留空行為：自動退回單實例進程內記憶體限流；應用重啓後計數會清空，多實例之間不共享
# 常見格式：
#   本地 Redis: redis://127.0.0.1:6379
#   帶密碼 Redis: redis://default:password@host:6379
#   TLS Redis: rediss://default:password@host:6379
RATE_LIMIT_REDIS_URL=""
```

常見配置建議：

- 本地開發：保留 `DEBUG_MOD="true"` 與 `FORM_DRY_RUN="true"`。
- 正式部署：將 `DEBUG_MOD="false"`、`FORM_DRY_RUN="false"`，並把 `SITE_URL` 改成你的正式網域。
- 正式部署時強烈建議一併設置 `FORM_PROTECTION_SECRET`；否則表單防刷 token 只能退回使用派生值。
- 若你有自己的 Google Apps Script 資料源，請填入 `GOOGLE_SCRIPT_URL`；否則網站會退回使用 `PUBLIC_MAP_DATA_URL`。
- 如果你把站點放在反向代理後面，自行部署時建議一併設置 `TRUST_PROXY="1"`。
- 若你的站點會跑多個實例，建議配置 `RATE_LIMIT_REDIS_URL` 或 `REDIS_URL`，避免每個實例各算各的限流額度。
- 若 `RATE_LIMIT_REDIS_URL` / `REDIS_URL` 留空，程式會回退到單實例記憶體限流；單機部署可接受，但應用重啓後會清空計數，且多實例之間不共享。

補充說明：

- `FORM_PROTECTION_SECRET` 是服務端簽名密鑰，不是前端公開配置。請只放在伺服器環境變數中，不要寫進客戶端腳本或提交到版本庫。
- `RATE_LIMIT_REDIS_URL` 與 `REDIS_URL` 二選一即可；程式會優先讀 `RATE_LIMIT_REDIS_URL`，沒有時再退回 `REDIS_URL`。

*一般來説 `TITLE` 填 `NO CONVERSION THERAPY` 就可以了。*

若想在本地開發
```bash
git clone https://github.com/HosinoEJ/No-Torsion.git
cd No-Torsion
npm install
```
最後就可以啓動了：
```bash
npm start
```

如需跑一下目前專案內建的 smoke test：
```bash
npm test
```

警告：在本地運行時，發送表單功能可能會受到GFW的影響。

### API 與站點輸出

如果你想在你的網站顯示網站地圖，或者用來分析數據，可以使用我們的api，這在一定程度上可以促進去中心化。

公開 API：
```
https://nct.hosinoneko.me/api/map-data
```

如果你是自行部署，則改用你自己的網域，例如：
```text
https://你的網域/api/map-data
```

另外，網站現在也會自動提供：
```text
https://你的網域/sitemap.xml
https://你的網域/robots.txt
```

`/api/map-data` 會回傳一個 `GET` 類型的 JSON 物件，以下是案例：

```JSON
{
    "avg_age": 17,
    "last_synced": 1774925078387,
    "statistics": [
        {
            "province": "河南",
            "count": 12
        },
        {
            "province": "湖北",
            "count": 66
        },
        {
            "province": "福建",
            "count": 3
        }
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

其中：

- `lat` 和 `lng` 是經緯度。
- `last_synced` 是毫秒級 Unix timestamp。
- 真正的機構列表在 `data` 欄位中，不是整個回傳值本身。

### API案例：機構地圖

本網站其實已經是一個案例了：https://NCT.hosinoneko.me/map

當然我也鼓勵大家去自己製作：

我們在這裏使用的是[LEAFLETJS](https://leafletjs.com)這個項目實現的在綫地圖查看，html程式碼在此處：

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>机构综合地图</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        #map { height: 80vh; width: 100%; border-radius: 8px; }
        .custom-popup b { color: #e63946; }
    </style>
</head>
<body>
    <h1>机构综合地图</h1>
    <div id="map"></div>
    <p><a href="/">返回首页</a></p>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map').setView([36.06, 120.38], 6); // 預設視角

        // 選用簡潔的底圖風格
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

        const apiUrl = 'https://nct.hosinoneko.me/api/map-data';

        fetch(apiUrl)
            .then(res => res.json())
            .then(payload => {
                payload.data.forEach(item => {
                    const marker = L.marker([item.lat, item.lng]).addTo(map);

                    // 1. 鼠標指到圖標：顯示標題 (Tooltip)
                    marker.bindTooltip(item.name, {
                        sticky: true, 
                        direction: 'top' 
                    });

                    // 2. 點擊：顯示所有詳細資訊 (Popup)
                    const popupContent = document.createElement('div');
                    const title = document.createElement('b');
                    const region = document.createElement('small');
                    const headmaster = document.createElement('p');
                    const divider = document.createElement('hr');
                    const address = document.createElement('address');

                    popupContent.className = 'custom-popup';
                    title.textContent = item.name || '';
                    region.textContent = item.prov || '';
                    headmaster.textContent = item.HMaster || '';
                    address.textContent = item.addr || '';

                    popupContent.appendChild(title);
                    popupContent.appendChild(document.createElement('br'));
                    popupContent.appendChild(region);
                    popupContent.appendChild(headmaster);
                    popupContent.appendChild(divider);
                    popupContent.appendChild(address);

                    marker.bindPopup(popupContent);
                });
            });
    </script>
</body>
</html>
```

你也可以將資訊全部列出來：

```HTML
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<div id="data-container">
    <h3>所有數據</h3>
</div>
<script>
    async function loadData() {
        try {
            const response = await axios.get('https://nct.hosinoneko.me/api/map-data');
            
            const rawData = response.data.data;

            const container = document.getElementById('data-container');

            rawData.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';

                const wrapper = document.createElement('div');
                wrapper.className = 'div';
                wrapper.style.width = '100%';

                const title = document.createElement('h2');
                title.textContent = item.name || '';

                const headmaster = document.createElement('p');
                headmaster.textContent = `負責人：${item.HMaster || ''}`;

                const province = document.createElement('p');
                province.textContent = `省份：${item.province || ''}`;

                const region = document.createElement('p');
                region.textContent = `鄉、鎮：${item.prov || ''}`;

                const address = document.createElement('p');
                address.textContent = `地址：${item.addr || ''}`;

                const divider = document.createElement('hr');

                wrapper.appendChild(title);
                wrapper.appendChild(headmaster);
                wrapper.appendChild(province);
                wrapper.appendChild(region);
                wrapper.appendChild(address);
                wrapper.appendChild(divider);

                if (item.scandal) {
                    const scandal = document.createElement('div');
                    scandal.className = 'scandal';
                    scandal.textContent = `⚠️ ${item.scandal}`;
                    wrapper.appendChild(scandal);
                }

                const contact = document.createElement('div');
                contact.className = 'contact';
                contact.textContent = `聯繫方式：${item.contact || ''}`;
                wrapper.appendChild(contact);

                card.appendChild(wrapper);
                container.appendChild(card);
            });
        } catch (error) {
            console.error('獲取數據失敗:', error);
            document.getElementById('data-container').innerHTML = '<p>數據加載失敗</p>';
        }
    }

    // 執行函數
    loadData();
</script>
```

就這樣沒啦！你完全不需要搞什麽複雜的伺服器編寫，只需要你寫一個html頁面，上傳到github pages就可以了！
