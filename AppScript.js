const SHEET_NAME = "MAIN";
const SHEET_FILE = "1V7J8IvicBKM5HLSERukdVSNkw-Sj3Fez5Y4E8jzFAf0";


function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_FILE);
    
    // --- 1. 處理 MAIN 分頁 ---
    const mainSheet = ss.getSheetByName(SHEET_NAME);
    const mainData = mainSheet.getDataRange().getValues();
    const mainHeaders = mainData[0];
    const rows = mainData.slice(1).map(row => {
      let obj = {};
      mainHeaders.forEach((h, i) => { if (h) obj[h] = row[i]; });
      return obj;
    });

    // --- 2. 處理 統計 分頁 ---
    const statsSheet = ss.getSheetByName('统计');
    // 直接抓取 W2 那一格的平均年齡 (第 2 行, W 欄是第 23 欄)
    const overallAvgAge = statsSheet.getRange("W2").getValue();
    const overallSchoolNum = statsSheet.getRange("Y2").getValue();
    const formNum = statsSheet.getRange("X2").getValue();
    // 抓取 U 和 V 兩欄 (省份 和 頻率)
    const uvData = statsSheet.getRange("U:V").getValues();

    const statsResult = uvData.map((row, index) => {
      // 跳過標題，從第三行開始
      if (index < 1) return null;
      const provName = row[0] ? row[0].toString().trim() : ""; // U 欄
      if (!provName || provName === "省份" || provName === "總計") return null;
      return {
        "province": provName.replace(/(省|市|自治区|特别行政区)/g, ""),
        "count": Number(row[1]) || 0  // V 欄
      };
    }).filter(item => item !== null);

    const zaaData = statsSheet.getRange("Z:AA").getValues();
    const statsResultForm = zaaData.map((row, index) => {
      // 跳過標題，從第三行開始
      if (index < 1) return null;
      const provName = row[0] ? row[0].toString().trim() : ""; // U 欄
      if (!provName || provName === "省份" || provName === "總計") return null;
      return {
        "province": provName.replace(/(省|市|自治区|特别行政区)/g, ""),
        "count": Number(row[1]) || 0  // V 欄
      };
    }).filter(item => item !== null);



    // --- 3. 組合輸出 ---
    const finalResult = {
      "SchoolNum": Number(overallSchoolNum) || 0,
      "avg_age": Number(overallAvgAge) || 0,
      "formNum": Number(formNum) || 0,
      "LastSynced": new Date().toISOString(),
      "statistics": statsResult,
      "statisticsForm": statsResultForm,
      "data": rows
    };

    return ContentService.createTextOutput(JSON.stringify(finalResult))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 設定區：在此輸入你的檔案 ID 與兩個工作表名稱
const TARGET_SHEETS = ["表單回覆", "批处理数据"]; // 填入你的兩個工作表名稱

function mainUpdateGeocodes() {
  const ss = SpreadsheetApp.openById(SHEET_FILE);
  const startTime = new Date().getTime();

  for (const sheetName of TARGET_SHEETS) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.warn("===============" + "找不到工作表：" + sheetName + "===============");
      continue;
    }
    
    console.log("===============" + "正在處理工作表：" + sheetName + "===============");
    // 執行處理邏輯，並傳入剩餘可用時間
    const isTimeUp = processSingleSheet(sheet, startTime);
    
    if (isTimeUp) {
      console.log("時間已滿 5 分鐘，停止後續處理。");
      break;
    }
  }
  console.log("所有任務執行完畢。");
}


function processSingleSheet(sheet, startTime) {
  const data = sheet.getDataRange().getValues();
  
  // 欄位定義 (依照你的設定)
  const ADDRESS_INDEX = 6;   // G 欄
  const LAT_COLUMN_NUM = 18; // R 欄
  const LNG_COLUMN_NUM = 19; // S 欄
  
  for (let i = 1; i < data.length; i++) {
    // 5 分鐘安全保護 (300,000 毫秒)
    if (new Date().getTime() - startTime > 300000) {
      return true; // 告知主程式已超時
    }

    let address = data[i][ADDRESS_INDEX]; 
    let lat = data[i][LAT_COLUMN_NUM - 1]; 
    
    // 如果 R 欄是空的，才執行解析
    if (!lat || lat === "" || lat === 0) {
      if (!address) continue; // 如果連地址都沒有，那就快滾一邊去吧

      const addressStr = address.toString();
      const latlngCheck = addressStr.startsWith("latlng");

      try {
        let finalLat, finalLng;

        if (latlngCheck) {
          console.log('看來恁是選地圖滴 - ' + sheet.getName());
          const coords = addressStr.replace("latlng", "").split(",");
          finalLat = coords[0];
          let lngValue = parseFloat(coords[1]);
          // 經度校正邏輯
          finalLng = ((lngValue + 180) % 360 + 360) % 360 - 180;
        } else {
          const response = Maps.newGeocoder().geocode(addressStr);
          if (response.results && response.results.length > 0) {
            const loc = response.results[0].geometry.location;
            finalLat = loc.lat;
            finalLng = loc.lng;
            Utilities.sleep(500); // 減少到 0.5 秒，通常這就夠了
          } else {
            console.warn("找不到地址：" + `"${addressStr}"`);
            continue;
          }
        }

        // 寫入儲存格
        if (finalLat && finalLng) {
          sheet.getRange(i + 1, LAT_COLUMN_NUM).setValue(finalLat); 
          sheet.getRange(i + 1, LNG_COLUMN_NUM).setValue(finalLng); 
          console.log(`${sheet.getName()} 第 ${i + 1} 列更新成功：${addressStr}`);
        }

      } catch (e) {
        console.error("錯誤：" + e.message);
        if (e.message.includes("limit")) return true; // 配額滿了也直接中斷
      }
    }
  }
  return false;
}