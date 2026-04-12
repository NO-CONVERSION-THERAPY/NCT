const crypto = require('crypto');
const { getClientIp } = require('./auditLogService');
const { getRuntimeBinding } = require('./runtimeContext');

const TABLE_NAME = 'form_submissions';
const schemaReadyByBinding = new WeakMap();
const CREATE_TABLE_STATEMENT = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id TEXT PRIMARY KEY,
  identity TEXT NOT NULL,
  birth_year TEXT NOT NULL,
  approximate_age INTEGER,
  sex TEXT NOT NULL,
  province_code TEXT,
  province_name TEXT,
  city_code TEXT,
  city_name TEXT,
  county_code TEXT,
  county_name TEXT,
  school_name TEXT NOT NULL,
  school_address TEXT,
  date_start TEXT NOT NULL,
  date_end TEXT,
  experience TEXT,
  headmaster_name TEXT,
  contact_information TEXT NOT NULL,
  scandal TEXT,
  other_notes TEXT,
  lang TEXT NOT NULL,
  source_path TEXT NOT NULL,
  client_ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
`;
const TABLE_COLUMN_DEFINITIONS = [
  { name: 'id', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN id TEXT` },
  { name: 'identity', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN identity TEXT NOT NULL DEFAULT ''` },
  { name: 'birth_year', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN birth_year TEXT NOT NULL DEFAULT ''` },
  { name: 'approximate_age', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN approximate_age INTEGER` },
  { name: 'sex', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN sex TEXT NOT NULL DEFAULT ''` },
  { name: 'province_code', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN province_code TEXT` },
  { name: 'province_name', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN province_name TEXT` },
  { name: 'city_code', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN city_code TEXT` },
  { name: 'city_name', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN city_name TEXT` },
  { name: 'county_code', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN county_code TEXT` },
  { name: 'county_name', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN county_name TEXT` },
  { name: 'school_name', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN school_name TEXT NOT NULL DEFAULT ''` },
  { name: 'school_address', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN school_address TEXT` },
  { name: 'date_start', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN date_start TEXT NOT NULL DEFAULT ''` },
  { name: 'date_end', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN date_end TEXT` },
  { name: 'experience', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN experience TEXT` },
  { name: 'headmaster_name', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN headmaster_name TEXT` },
  { name: 'contact_information', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN contact_information TEXT NOT NULL DEFAULT ''` },
  { name: 'scandal', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN scandal TEXT` },
  { name: 'other_notes', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN other_notes TEXT` },
  { name: 'lang', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN lang TEXT NOT NULL DEFAULT 'zh-CN'` },
  { name: 'source_path', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN source_path TEXT NOT NULL DEFAULT ''` },
  { name: 'client_ip_hash', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN client_ip_hash TEXT` },
  { name: 'user_agent', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN user_agent TEXT` },
  { name: 'created_at', alterSql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN created_at TEXT NOT NULL DEFAULT ''` }
];

class FormSubmissionStorageUnavailableError extends Error {
  constructor(message = 'Form submission storage is unavailable.') {
    super(message);
    this.name = 'FormSubmissionStorageUnavailableError';
  }
}

function getTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNullableValue(value) {
  return value ? value : null;
}

function getConfiguredBindingNames() {
  return [
    String(process.env.D1_BINDING_NAME || '').trim(),
    'DB',
    'NCT_DB'
  ].filter(Boolean);
}

function getFormSubmissionDatabaseBinding() {
  for (const bindingName of getConfiguredBindingNames()) {
    const binding = getRuntimeBinding(bindingName);
    if (binding && typeof binding.prepare === 'function') {
      return {
        binding,
        bindingName
      };
    }
  }

  return {
    binding: null,
    bindingName: ''
  };
}

async function getFormSubmissionTableColumns(binding) {
  const result = await binding.prepare(`PRAGMA table_info(${TABLE_NAME})`).all();
  const rows = Array.isArray(result?.results) ? result.results : [];

  return new Set(
    rows
      .map((row) => getTrimmedString(row && row.name))
      .filter(Boolean)
  );
}

async function reconcileFormSubmissionSchema(binding) {
  const existingColumns = await getFormSubmissionTableColumns(binding);

  for (const definition of TABLE_COLUMN_DEFINITIONS) {
    if (existingColumns.has(definition.name)) {
      continue;
    }

    await binding.exec(definition.alterSql);
    existingColumns.add(definition.name);
  }
}

async function ensureFormSubmissionSchema(binding) {
  if (!binding) {
    throw new FormSubmissionStorageUnavailableError();
  }

  const cachedReadyPromise = schemaReadyByBinding.get(binding);
  if (cachedReadyPromise) {
    return cachedReadyPromise;
  }

  if (typeof binding.exec !== 'function') {
    throw new FormSubmissionStorageUnavailableError('Configured D1 binding does not support schema initialization.');
  }

  const readyPromise = Promise.resolve()
    .then(async () => {
      await binding.exec(CREATE_TABLE_STATEMENT);
      await reconcileFormSubmissionSchema(binding);
    })
    .catch((error) => {
      schemaReadyByBinding.delete(binding);
      throw error;
    });

  schemaReadyByBinding.set(binding, readyPromise);
  return readyPromise;
}

function hashClientIp(ip) {
  const normalizedIp = getTrimmedString(ip);
  if (!normalizedIp || normalizedIp === 'unknown') {
    return null;
  }

  return crypto.createHash('sha256').update(normalizedIp).digest('hex');
}

async function saveFormSubmission({ req, values }) {
  const { binding, bindingName } = getFormSubmissionDatabaseBinding();
  if (!binding) {
    throw new FormSubmissionStorageUnavailableError();
  }

  await ensureFormSubmissionSchema(binding);

  const submissionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userAgent = getTrimmedString(req.get ? req.get('user-agent') : req.headers?.['user-agent']).slice(0, 512);

  await binding
    .prepare(`
      INSERT INTO ${TABLE_NAME} (
        id,
        identity,
        birth_year,
        approximate_age,
        sex,
        province_code,
        province_name,
        city_code,
        city_name,
        county_code,
        county_name,
        school_name,
        school_address,
        date_start,
        date_end,
        experience,
        headmaster_name,
        contact_information,
        scandal,
        other_notes,
        lang,
        source_path,
        client_ip_hash,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      submissionId,
      values.identity,
      values.birthYear,
      Number.isInteger(values.googleFormAge) ? values.googleFormAge : null,
      values.sex,
      normalizeNullableValue(values.provinceCode),
      normalizeNullableValue(values.province),
      normalizeNullableValue(values.cityCode),
      normalizeNullableValue(values.city),
      normalizeNullableValue(values.countyCode),
      normalizeNullableValue(values.county),
      values.schoolName,
      normalizeNullableValue(values.schoolAddress),
      values.dateStart,
      normalizeNullableValue(values.dateEnd),
      normalizeNullableValue(values.experience),
      normalizeNullableValue(values.headmasterName),
      values.contactInformation,
      normalizeNullableValue(values.scandal),
      normalizeNullableValue(values.other),
      getTrimmedString(req.lang) || 'zh-CN',
      getTrimmedString(req.originalUrl || req.path || '/submit/confirm'),
      hashClientIp(getClientIp(req)),
      normalizeNullableValue(userAgent),
      createdAt
    )
    .run();

  return {
    bindingName,
    createdAt,
    submissionId
  };
}

module.exports = {
  CREATE_TABLE_STATEMENT,
  FormSubmissionStorageUnavailableError,
  TABLE_NAME,
  getFormSubmissionDatabaseBinding,
  saveFormSubmission
};
