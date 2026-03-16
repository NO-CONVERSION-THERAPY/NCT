function doGet() {
  try {
    var ssId = "1V7J8IvicBKM5HLSERukdVSNkw-Sj3Fez5Y4E8jzFAf0";
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheets()[0]; // 取得第一個分頁
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var result = [];
    
    // 欄位定義
    var addrIdx = 6;  // G 欄 (地址)
    var latIdx = 16;  // Q 欄 (緯度)
    var lngIdx = 17;  // R 欄 (經度)

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var address = row[addrIdx];
      var lat = row[latIdx];
      var lng = row[lngIdx];

      // 地理編碼邏輯
      if (address && (!lat || !lng)) {
        var loc = Maps.newGeocoder().geocode(address);
        if (loc.status === 'OK') {
          lat = loc.results[0].geometry.location.lat;
          lng = loc.results[0].geometry.location.lng;
          sheet.getRange(i + 1, latIdx + 1).setValue(lat);
          sheet.getRange(i + 1, lngIdx + 1).setValue(lng);
        }
      }

      if (lat && lng) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = row[j];
        }
        obj.lat = lat;
        obj.lng = lng;
        result.push(obj);
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"error": e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}