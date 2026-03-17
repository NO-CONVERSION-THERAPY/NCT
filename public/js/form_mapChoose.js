let currentMarker = null;
const map = L.map('map').setView([37.5, 109], 3);

// 2. 加载免费的 OpenStreetMap 图层
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    minZoom: 3
}).addTo(map);

// 3. 监听地图点击事件
map.on('click', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    
    if (currentMarker !== null) {
        map.removeLayer(currentMarker); // 如果已经有点了，先从地图移除
    }

    console.log(`選取: ${lat}, ${lng}`);
    const ctAddr = document.getElementById('addr')
    ctAddr.value = `latlng${lat},${lng}`

    // 3. 创建新点并赋值给变量
    currentMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`選取點: ${lat}, ${lng}`)
        .openPopup();
});