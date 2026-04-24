export const SELF_IDENTITY = '受害者本人';
export const AGENT_IDENTITY = '受害者的代理人';
export const OTHER_SEX_OPTION = '__other_option__';
export const CUSTOM_OTHER_SEX_OPTION = '__custom_other_sex__';
export const CUSTOM_AGENT_RELATIONSHIP_OPTION = '__custom_agent_relationship__';
export const CUSTOM_PARENT_MOTIVATION_OPTION = '__custom_parent_motivation__';
export const CUSTOM_VIOLENCE_CATEGORY_OPTION = '__custom_violence_category__';
export const CUSTOM_EXIT_METHOD_OPTION = '__custom_exit_method__';
export const CUSTOM_LEGAL_AID_OPTION = '__custom_legal_aid__';

function readLocalizedLabel(source, path, fallback = '') {
  let cursor = source;

  for (const segment of path) {
    if (!cursor || typeof cursor !== 'object') {
      return fallback;
    }

    cursor = cursor[segment];
  }

  return cursor == null ? fallback : cursor;
}

function localizeOptions(i18n, options) {
  return options.map((option) => ({
    value: option.value,
    label: readLocalizedLabel(i18n, option.path, option.fallback)
  }));
}

export function buildLocalizedFormConfig(i18n) {
  const formMessages = i18n && i18n.form ? i18n.form : {};
  const currentYear = new Date().getUTCFullYear();

  return {
    agentRelationshipOptions: localizeOptions(formMessages, [
      { value: '朋友', path: ['agentRelationshipOptions', 'friend'], fallback: 'Friend' },
      { value: '伴侣', path: ['agentRelationshipOptions', 'partner'], fallback: 'Partner' },
      { value: '亲属', path: ['agentRelationshipOptions', 'family'], fallback: 'Family' },
      { value: '救助工作者', path: ['agentRelationshipOptions', 'supportWorker'], fallback: 'Support worker' },
      { value: CUSTOM_AGENT_RELATIONSHIP_OPTION, path: ['agentRelationshipOptions', 'other'], fallback: 'Other' }
    ]),
    exitMethodOptions: localizeOptions(formMessages, [
      { value: '到期后家长接回', path: ['exitMethodOptions', 'pickedUp'], fallback: 'Picked up by family' },
      { value: '自行逃离', path: ['exitMethodOptions', 'escape'], fallback: 'Escaped' },
      { value: '被强制转学', path: ['exitMethodOptions', 'transfer'], fallback: 'Forced transfer' },
      { value: '被解救', path: ['exitMethodOptions', 'rescued'], fallback: 'Rescued' },
      { value: '机构关闭', path: ['exitMethodOptions', 'closed'], fallback: 'Institution closed' },
      { value: CUSTOM_EXIT_METHOD_OPTION, path: ['exitMethodOptions', 'other'], fallback: 'Other' }
    ]),
    formRules: {
      birthYear: {
        label: readLocalizedLabel(formMessages, ['fields', 'birthYear'], 'Birth year'),
        max: currentYear,
        min: 1900,
        required: true
      },
      sexOther: {
        label: readLocalizedLabel(formMessages, ['fields', 'sex'], 'Sex'),
        maxLength: 30
      },
      agentRelationship: {
        label: readLocalizedLabel(formMessages, ['fields', 'agentRelationship'], 'Relationship'),
        maxLength: 30
      },
      parentMotivationOther: {
        label: readLocalizedLabel(formMessages, ['fields', 'parentMotivations'], 'Parent motivations'),
        maxLength: 120
      },
      schoolName: {
        label: readLocalizedLabel(formMessages, ['fields', 'schoolName'], 'Institution'),
        maxLength: 20,
        required: true
      },
      schoolAddress: {
        label: readLocalizedLabel(formMessages, ['fields', 'schoolAddress'], 'Address'),
        maxLength: 50
      },
      experience: {
        label: readLocalizedLabel(formMessages, ['fields', 'experience'], 'Experience'),
        maxLength: 8000
      },
      exitMethodOther: {
        label: readLocalizedLabel(formMessages, ['fields', 'exitMethod'], 'Exit method'),
        maxLength: 120
      },
      legalAidOther: {
        label: readLocalizedLabel(formMessages, ['fields', 'legalAidStatus'], 'Legal aid'),
        maxLength: 120
      },
      headmasterName: {
        label: readLocalizedLabel(formMessages, ['fields', 'headmasterName'], 'Headmaster'),
        maxLength: 10
      },
      abuserInfo: {
        label: readLocalizedLabel(formMessages, ['fields', 'abuserInfo'], 'Abuser information'),
        maxLength: 600
      },
      contactInformation: {
        label: readLocalizedLabel(formMessages, ['fields', 'contactInformation'], 'Contact'),
        maxLength: 30,
        required: true
      },
      violenceCategoryOther: {
        label: readLocalizedLabel(formMessages, ['fields', 'violenceCategories'], 'Violence categories'),
        maxLength: 120
      },
      scandal: {
        label: readLocalizedLabel(formMessages, ['fields', 'scandal'], 'Scandal'),
        maxLength: 3000
      },
      other: {
        label: readLocalizedLabel(formMessages, ['fields', 'other'], 'Other'),
        maxLength: 3000
      }
    },
    identityOptions: localizeOptions(formMessages, [
      { value: SELF_IDENTITY, path: ['identityOptions', 'self'], fallback: 'Survivor' },
      { value: AGENT_IDENTITY, path: ['identityOptions', 'agent'], fallback: 'Representative' }
    ]),
    legalAidOptions: localizeOptions(formMessages, [
      { value: '是', path: ['legalAidOptions', 'yes'], fallback: 'Yes' },
      { value: '否', path: ['legalAidOptions', 'no'], fallback: 'No' },
      { value: '想但不知道途径', path: ['legalAidOptions', 'unsureHow'], fallback: 'Need help but do not know how' },
      { value: '担心报复', path: ['legalAidOptions', 'fearRetaliation'], fallback: 'Fear retaliation' },
      { value: CUSTOM_LEGAL_AID_OPTION, path: ['legalAidOptions', 'other'], fallback: 'Other' }
    ]),
    otherSexTypeOptions: localizeOptions(formMessages, [
      { value: 'MtF', path: ['sexIdentityOptions', 'mtf'], fallback: 'MtF' },
      { value: 'FtM', path: ['sexIdentityOptions', 'ftm'], fallback: 'FtM' },
      { value: 'X', path: ['sexIdentityOptions', 'x'], fallback: 'X' },
      { value: 'Queer', path: ['sexIdentityOptions', 'queer'], fallback: 'Queer' }
    ]),
    parentMotivationOptions: localizeOptions(formMessages, [
      { value: '"网瘾"/游戏沉迷', path: ['parentMotivationOptions', 'internetAddiction'], fallback: 'Internet addiction / gaming' },
      { value: '"厌学"/学业问题', path: ['parentMotivationOptions', 'studyIssues'], fallback: 'School or study issues' },
      { value: '"叛逆"/行为管教', path: ['parentMotivationOptions', 'behaviorControl'], fallback: 'Behavior correction' },
      { value: '精神或心理健康相关问题', path: ['parentMotivationOptions', 'mentalHealth'], fallback: 'Mental health concerns' },
      { value: '性别认同相关（如跨性别等）', path: ['parentMotivationOptions', 'genderIdentity'], fallback: 'Gender identity' },
      { value: '性取向相关（如同性恋、双性恋等）', path: ['parentMotivationOptions', 'sexualOrientation'], fallback: 'Sexual orientation' },
      { value: '家庭冲突中的恶意施暴或惩罚手段', path: ['parentMotivationOptions', 'familyViolence'], fallback: 'Family conflict or punishment' },
      { value: '咨询师/医生/老师等人士建议', path: ['parentMotivationOptions', 'professionalAdvice'], fallback: 'Suggested by professionals' },
      { value: '亲属或身边人建议', path: ['parentMotivationOptions', 'relativesAdvice'], fallback: 'Suggested by relatives or others' },
      { value: '网络广告或机构宣传误导', path: ['parentMotivationOptions', 'advertising'], fallback: 'Misleading promotion' },
      { value: '不清楚/从未被告知原因', path: ['parentMotivationOptions', 'unknown'], fallback: 'Unknown' },
      { value: CUSTOM_PARENT_MOTIVATION_OPTION, path: ['parentMotivationOptions', 'other'], fallback: 'Other reason' }
    ]),
    sexOptions: localizeOptions(formMessages, [
      { value: '女性', path: ['sexOptions', 'female'], fallback: 'Female' },
      { value: '男性', path: ['sexOptions', 'male'], fallback: 'Male' },
      { value: OTHER_SEX_OPTION, path: ['sexOptions', 'other'], fallback: 'Other' }
    ]),
    violenceCategoryOptions: localizeOptions(formMessages, [
      { value: '虚假/非法宣传', path: ['violenceCategoryOptions', 'falsePromotion'], fallback: 'False or illegal promotion' },
      { value: '冒充警察绑架', path: ['violenceCategoryOptions', 'fakePolice'], fallback: 'Kidnapping while posing as police' },
      { value: '直接接触的肢体暴力（如扇耳光等）', path: ['violenceCategoryOptions', 'directPhysical'], fallback: 'Direct physical violence' },
      { value: '使用工具的肢体暴力（如棍棒殴打、电击等）', path: ['violenceCategoryOptions', 'toolPhysical'], fallback: 'Violence using tools' },
      { value: '体罚（如长跑等）', path: ['violenceCategoryOptions', 'corporalPunishment'], fallback: 'Corporal punishment' },
      { value: '限制自由（如捆绑等）', path: ['violenceCategoryOptions', 'restriction'], fallback: 'Restriction of freedom' },
      { value: '辱骂或公开羞辱', path: ['violenceCategoryOptions', 'humiliation'], fallback: 'Humiliation' },
      { value: '言语的性暴力（如性羞辱等）', path: ['violenceCategoryOptions', 'verbalSexual'], fallback: 'Verbal sexual violence' },
      { value: '肢体的性暴力（如性侵犯等）', path: ['violenceCategoryOptions', 'physicalSexual'], fallback: 'Physical sexual violence' },
      { value: '关禁闭', path: ['violenceCategoryOptions', 'solitary'], fallback: 'Solitary confinement' },
      { value: '饮食限制或不健康饮食', path: ['violenceCategoryOptions', 'foodRestriction'], fallback: 'Food restriction' },
      { value: '睡眠剥夺', path: ['violenceCategoryOptions', 'sleepDeprivation'], fallback: 'Sleep deprivation' },
      { value: '强迫服用药物', path: ['violenceCategoryOptions', 'forcedMedication'], fallback: 'Forced medication' },
      { value: '性别扭转（如强迫改变外表等）', path: ['violenceCategoryOptions', 'genderConversion'], fallback: 'Gender conversion' },
      { value: '精神控制或洗脑', path: ['violenceCategoryOptions', 'brainwashing'], fallback: 'Brainwashing' },
      { value: CUSTOM_VIOLENCE_CATEGORY_OPTION, path: ['violenceCategoryOptions', 'other'], fallback: 'Other violent behavior' }
    ])
  };
}

export function buildLocalizedInstitutionCorrectionRules(i18n) {
  const correctionMessages = i18n && i18n.institutionCorrection ? i18n.institutionCorrection : {};

  return {
    schoolName: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'schoolName'], 'Institution'),
      maxLength: 80,
      required: true
    },
    provinceCode: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'province'], 'Province'),
      required: false
    },
    cityCode: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'city'], 'City'),
      required: false
    },
    countyCode: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'county'], 'County'),
      required: false
    },
    schoolAddress: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'schoolAddress'], 'Address'),
      maxLength: 200,
      required: false
    },
    contactInformation: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'contactInformation'], 'Contact'),
      maxLength: 120,
      required: false
    },
    headmasterName: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'headmasterName'], 'Headmaster'),
      maxLength: 80,
      required: false
    },
    correctionContent: {
      label: readLocalizedLabel(correctionMessages, ['fields', 'correctionContent'], 'Correction'),
      maxLength: 4000,
      required: false
    }
  };
}
