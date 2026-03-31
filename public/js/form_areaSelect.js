(() => {
  const areaSelectorData = window.AREA_SELECTOR_DATA || { provinces: [], citiesByProvinceCode: {}, countiesByCityCode: {} };
  const provinceSelect = document.getElementById('provinceSelect');
  const citySelect = document.getElementById('citySelect');
  const countySelect = document.getElementById('countySelect');

  function renderOptions(select, options, placeholder) {
    select.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    options.forEach((option) => {
      const element = document.createElement('option');
      element.value = option.code;
      element.textContent = option.name;
      select.appendChild(element);
    });
  }

  function updateCityOptions(provinceCode) {
    const cityOptions = areaSelectorData.citiesByProvinceCode[provinceCode] || [];
    citySelect.disabled = cityOptions.length === 0;
    renderOptions(citySelect, cityOptions, cityOptions.length === 0 ? '請先選擇省份' : '選擇城市 / 區縣');
    updateCountyOptions('');
  }

  function updateCountyOptions(cityCode) {
    if (!countySelect) {
      return;
    }

    const countyOptions = areaSelectorData.countiesByCityCode[cityCode] || [];
    countySelect.disabled = countyOptions.length === 0;
    renderOptions(countySelect, countyOptions, countyOptions.length === 0 ? '可選：當前城市無縣區可選' : '可選：選擇縣區');
  }

  if (provinceSelect && citySelect) {
    renderOptions(provinceSelect, areaSelectorData.provinces || [], '選擇省份');
    citySelect.disabled = true;
    if (countySelect) {
      countySelect.disabled = true;
      renderOptions(countySelect, [], '可選：請先選擇城市 / 區縣');
    }

    provinceSelect.addEventListener('change', () => {
      updateCityOptions(provinceSelect.value);
    });

    citySelect.addEventListener('change', () => {
      updateCountyOptions(citySelect.value);
    });
  }
})();
