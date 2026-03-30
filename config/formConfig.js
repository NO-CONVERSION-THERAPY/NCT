const { provinceOptions, cityOptionsByProvinceCode, countiesByCityCode } = require('./areaSelector');

// 表單枚举值、长度规则和地区联动数据都集中在这里，前后端共用一套定义。
const allowedIdentities = new Set(['受害者本人', '受害者的代理人']);
const allowedSexes = new Set(['男', '女', 'MtF', 'FtM', '__other_option__']);
const formRules = {
  age: { label: '年齡', required: true, min: 1, max: 100 },
  identity: { label: '填寫身份', required: true },
  sex: { label: '性別', required: true },
  sexOther: { label: '其他性別說明', maxLength: 10 },
  provinceCode: { label: '省份', required: true },
  cityCode: { label: '城市 / 區縣', required: true },
  countyCode: { label: '縣區', required: false },
  schoolName: { label: '學校名稱', required: true, maxLength: 20 },
  schoolAddress: { label: '學校地址', maxLength: 50 },
  dateStart: { label: '入學日期', required: true },
  dateEnd: { label: '離開日期' },
  experience: { label: '經歷描述', maxLength: 8000 },
  headmasterName: { label: '負責人/校長姓名', maxLength: 10 },
  contactInformation: { label: '學校聯繫方式', required: true, maxLength: 30 },
  scandal: { label: '已知醜聞', maxLength: 3000 },
  other: { label: '其他補充', maxLength: 3000 }
};
const areaOptions = {
  provinces: provinceOptions,
  citiesByProvinceCode: cityOptionsByProvinceCode,
  countiesByCityCode
};

module.exports = {
  allowedIdentities,
  allowedSexes,
  areaOptions,
  formRules
};
