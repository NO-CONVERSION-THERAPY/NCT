const SHEET_NAME = "表單回覆 1"; // *** 請務必確認你的分頁名稱 ***

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById('1V7J8IvicBKM5HLSERukdVSNkw-Sj3Fez5Y4E8jzFAf0'); 
    const sheet = ss.getSheetByName(SHEET_NAME); // 改用名稱抓取更精準
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = data.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateGeocodes() {
  const ss = SpreadsheetApp.openById('1V7J8IvicBKM5HLSERukdVSNkw-Sj3Fez5Y4E8jzFAf0'); 
  const sheet = ss.getSheetByName("表單回覆 1"); // 請確認你的工作表名稱
  const data = sheet.getDataRange().getValues();
  
  const startTime = new Date().getTime();
  
  // 設定欄位索引
  const ADDRESS_INDEX = 6; // G 欄 (索引 6)
  const LAT_COLUMN_NUM = 26; // Z 欄 (第 26 欄)
  const LNG_COLUMN_NUM = 27; // AA 欄 (第 27 欄)
  
  for (let i = 1; i < data.length; i++) {
    // 5 分鐘安全保護，避免超時
    if (new Date().getTime() - startTime > 300000) { 
      console.log("執行時間將滿 5 分鐘，請稍後再次手動執行以處理剩餘資料。");
      break; 
    }

    let address = data[i][ADDRESS_INDEX]; 
    // 注意：data 陣列索引是從 0 開始，所以 Z 欄是索引 25
    let lat = data[i][LAT_COLUMN_NUM-1]; 
    
    // 如果 Z 欄是空的，才執行解析
    if (!lat || lat === "" || lat === 0) {
      if (!address) continue;//如果連地址都沒有，那就快滾一邊去吧
      const latlngCheck = address.startsWith("latlng");

      if (latlngCheck==true) {
        console.log('看來恁是選地圖滴')
          let coords = address.replace("latlng", "").split(",");
          while(coords[1]<360)coords-360;
          sheet.getRange(i + 1, LAT_COLUMN_NUM).setValue(coords[0]); 
          sheet.getRange(i + 1, LNG_COLUMN_NUM).setValue(coords[1]); 
      }

      try {
        const response = Maps.newGeocoder().geocode(address);
        if (response.results && response.results.length > 0) {
          const loc = response.results[0].geometry.location;
          
          // 寫入 Z 欄 (26) 和 AA 欄 (27)
          sheet.getRange(i + 1, LAT_COLUMN_NUM).setValue(loc.lat); 
          sheet.getRange(i + 1, LNG_COLUMN_NUM).setValue(loc.lng); 
          
          console.log("第 " + (i + 1) + " 列更新成功：" + address);
          Utilities.sleep(1000); // 遵守 Google 每秒限制
        } else {
          console.warn("找不到地址，填入 N/A：" + address);
        }
      } catch (e) {
        console.error("錯誤：" + e.message);
        if (e.message.includes("limit")) {
          console.error("已達今日 Geocode 限額，請明天再試。");
          break;
        }
      }
    }
  }
}