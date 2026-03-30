const axios = require('axios');
const { validateProvinceAndCity, validateCountyForCity } = require('../../config/areaSelector');
const { allowedIdentities, allowedSexes, formRules } = require('../../config/formConfig');

// 提交前统一做 trim，避免首尾空格造成前后端校验不一致。
function getTrimmedString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

// 只接受 YYYY-MM-DD，且必须是一个真实存在的日期。
function validateDateString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

// 文本字段的公共校验：必填和长度限制统一从这里走。
function validateTextField(errors, label, value, { required = false, maxLength }) {
  const text = getTrimmedString(value);

  if (required && !text) {
    errors.push(`${label}為必填`);
    return '';
  }

  if (typeof maxLength === 'number' && text.length > maxLength) {
    errors.push(`${label}不能超過 ${maxLength} 字`);
  }

  return text;
}

// 把前端表单请求体校验并整理成后续可直接发往 Google Form 的结构。
function validateSubmission(body) {
  const errors = [];
  const ageValue = getTrimmedString(body.age);
  const age = Number.parseInt(ageValue, 10);
  const identity = getTrimmedString(body.identity);
  const sex = getTrimmedString(body.sex);
  const sexOther = validateTextField(errors, formRules.sexOther.label, body.sex_other, {
    maxLength: formRules.sexOther.maxLength
  });
  const provinceCode = getTrimmedString(body.provinceCode);
  const cityCode = getTrimmedString(body.cityCode);
  const countyCode = getTrimmedString(body.countyCode);
  const schoolName = validateTextField(errors, formRules.schoolName.label, body.school_name, {
    required: formRules.schoolName.required,
    maxLength: formRules.schoolName.maxLength
  });
  const schoolAddress = validateTextField(errors, formRules.schoolAddress.label, body.school_address, {
    maxLength: formRules.schoolAddress.maxLength
  });
  const dateStart = getTrimmedString(body.date_start);
  const dateEnd = getTrimmedString(body.date_end);
  const experience = validateTextField(errors, formRules.experience.label, body.experience, {
    maxLength: formRules.experience.maxLength
  });
  const headmasterName = validateTextField(errors, formRules.headmasterName.label, body.headmaster_name, {
    maxLength: formRules.headmasterName.maxLength
  });
  const contactInformation = validateTextField(errors, formRules.contactInformation.label, body.contact_information, {
    required: formRules.contactInformation.required,
    maxLength: formRules.contactInformation.maxLength
  });
  const scandal = validateTextField(errors, formRules.scandal.label, body.scandal, {
    maxLength: formRules.scandal.maxLength
  });
  const other = validateTextField(errors, formRules.other.label, body.other, {
    maxLength: formRules.other.maxLength
  });
  let validatedLocation = null;
  let validatedCounty = null;

  if (!Number.isInteger(age) || age < formRules.age.min || age > formRules.age.max) {
    errors.push(`${formRules.age.label}必須是 ${formRules.age.min} 到 ${formRules.age.max} 的整數`);
  }

  if (!allowedIdentities.has(identity)) {
    errors.push('請選擇有效的填寫身份');
  }

  if (!sex) {
    errors.push(`${formRules.sex.label}為必填`);
  } else if (!allowedSexes.has(sex)) {
    errors.push('性別请修改');
  }

  if (sex === '__other_option__' && !sexOther) {
    errors.push('選擇其他性別時，請填寫說明');
  }

  if (!provinceCode) {
    errors.push(`${formRules.provinceCode.label}為必填`);
  }

  if (!cityCode) {
    errors.push(`${formRules.cityCode.label}為必填`);
  }

  if (provinceCode && cityCode) {
    validatedLocation = validateProvinceAndCity(provinceCode, cityCode);
    if (!validatedLocation) {
      errors.push('省份和城市 / 區縣不匹配');
    }
  }

  if (validatedLocation && countyCode) {
    validatedCounty = validateCountyForCity(cityCode, countyCode);
    if (!validatedCounty) {
      errors.push('城市 / 區縣和縣區不匹配');
    }
  }

  if (!dateStart) {
    errors.push(`${formRules.dateStart.label}為必填`);
  } else if (!validateDateString(dateStart)) {
    errors.push(`${formRules.dateStart.label}格式不正確`);
  }

  if (dateEnd && !validateDateString(dateEnd)) {
    errors.push(`${formRules.dateEnd.label}格式不正確`);
  }

  if (dateStart && dateEnd && dateEnd < dateStart) {
    errors.push(`${formRules.dateEnd.label}不能早於${formRules.dateStart.label}`);
  }

  return {
    errors,
    values: {
      age,
      // Google Form 当前只有一个地区字段，所以县区存在时与城市拼成一个字符串。
      province: validatedLocation ? validatedLocation.legacyProvinceName : '',
      city: validatedLocation
        ? [validatedLocation.cityName, validatedCounty ? validatedCounty.countyName : ''].filter(Boolean).join(' ')
        : '',
      schoolName,
      identity,
      sex: sex === '__other_option__' ? sexOther : sex,
      schoolAddress,
      experience,
      dateStart,
      dateEnd,
      headmasterName,
      contactInformation,
      scandal,
      other
    }
  };
}

// 这里维护的是“站内字段 -> Google Form entry.xxx” 的最终映射。
function buildGoogleFormFields(values) {
  const fields = [
    { entryId: 'entry.842223433', label: '年齡', value: String(values.age) },
    { entryId: 'entry.1766160152', label: '省份', value: values.province },
    { entryId: 'entry.402227428', label: '區、縣 / 城市', value: values.city },
    { entryId: 'entry.5034928', label: '學校名稱', value: values.schoolName },
    { entryId: 'entry.500021634', label: '填寫身份', value: values.identity },
    { entryId: 'entry.1422578992', label: '性別', value: values.sex },
    { entryId: 'entry.1390240202', label: '學校地址', value: values.schoolAddress },
    { entryId: 'entry.578287646', label: '經歷描述', value: values.experience },
    { entryId: 'entry.1533497153', label: '負責人/校長姓名', value: values.headmasterName },
    { entryId: 'entry.883193772', label: '學校聯繫方式', value: values.contactInformation },
    { entryId: 'entry.1400127416', label: '已知醜聞', value: values.scandal },
    { entryId: 'entry.2022959936', label: '其他補充', value: values.other }
  ];

  if (values.dateStart) {
    fields.push({ entryId: 'entry.1344969670', label: '入學日期', value: values.dateStart });
  }

  if (values.dateEnd) {
    fields.push({ entryId: 'entry.129670533', label: '離開日期', value: values.dateEnd });
  }

  return fields;
}

// Google Form 需要 application/x-www-form-urlencoded，因此统一在这里编码。
function encodeGoogleFormFields(fields) {
  const params = new URLSearchParams();
  fields.forEach((field) => {
    params.append(field.entryId, field.value);
  });
  return params.toString();
}

// 真正发往 Google Form 的 HTTP 请求。
async function submitToGoogleForm(googleFormUrl, encodedPayload) {
  await axios.post(googleFormUrl, encodedPayload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000
  });
}

module.exports = {
  buildGoogleFormFields,
  encodeGoogleFormFields,
  submitToGoogleForm,
  validateSubmission
};
