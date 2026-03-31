(() => {
    let currentMarker = null;
    let formMap = null;
    const openMapButton = document.getElementById('openMapButton');

    function ensureFormMap() {
        if (formMap) {
            return formMap;
        }

        const mapContainer = document.getElementById('map');
        if (!mapContainer || typeof L === 'undefined') {
            return null;
        }

        formMap = L.map(mapContainer).setView([37.5, 109], 3);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            minZoom: 3
        }).addTo(formMap);

        formMap.on('click', function(e) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            if (currentMarker !== null) {
                formMap.removeLayer(currentMarker);
            }

            const addressInput = document.getElementById('addr');
            if (addressInput) {
                addressInput.value = `latlng${lat},${lng}`;
            }

            currentMarker = L.marker([lat, lng]).addTo(formMap)
                .bindPopup(`選取點: ${lat}, ${lng}`)
                .openPopup();
        });

        return formMap;
    }

    window.openMap = function openMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            return;
        }

        const willShowMap = mapContainer.style.display !== 'block';
        mapContainer.style.display = willShowMap ? 'block' : 'none';

        if (!willShowMap) {
            return;
        }

        const mapInstance = ensureFormMap();
        if (!mapInstance) {
            return;
        }

        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 100);
    };

    if (openMapButton) {
        openMapButton.addEventListener('click', window.openMap);
    }
})();
