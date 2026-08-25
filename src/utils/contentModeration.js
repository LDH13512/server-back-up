export const COMMUNITY_LIMITS = Object.freeze({
  title: 30,
  nickname: 20,
  description: 500,
  comment: 300,
  suggestion: 500,
  reportReason: 500,
});

const BLOCKED_RULES = [
  {
    pattern: /\b(?:javascript|vbscript|data)\s*:/i,
    message: '실행 가능한 스크립트 주소는 입력할 수 없습니다.',
  },
  {
    pattern: /(?:아동\s*성착취|성착취물|불법\s*촬영물|리벤지\s*포르노)/i,
    message: '불법적이거나 성착취적인 표현은 사용할 수 없습니다.',
  },
  {
    pattern: /(?:마약|필로폰|코카인|대마)\s*(?:판매|구매|거래|배송)/i,
    message: '불법 물품의 거래를 암시하는 표현은 사용할 수 없습니다.',
  },
  {
    pattern: /(?:계정|비밀번호)\s*(?:탈취|해킹|판매)|악성\s*코드\s*(?:배포|설치)/i,
    message: '계정 탈취나 악성 프로그램을 조장하는 표현은 사용할 수 없습니다.',
  },
  {
    pattern: /(?:자살|자해)\s*(?:해|하자|권유|추천)|(?:죽여|해치워)\s*버리/i,
    message: '자해 또는 현실의 위해를 조장하는 표현은 사용할 수 없습니다.',
  },
  {
    pattern: /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/,
    message: '공개 게시물에 휴대전화 번호를 입력할 수 없습니다.',
  },
];

export function validateCommunityText(
  value,
  {
    label = '내용',
    maxLength = COMMUNITY_LIMITS.comment,
    required = true,
  } = {}
) {
  const text = String(value ?? '').trim();

  if (required && !text) {
    return { ok: false, error: `${label}을(를) 입력해 주세요.` };
  }

  if (!text) return { ok: true, value: '' };

  if (Array.from(text).length > maxLength) {
    return {
      ok: false,
      error: `${label}은(는) ${maxLength}자 이내로 입력해 주세요.`,
    };
  }

  const blockedRule = BLOCKED_RULES.find(({ pattern }) => pattern.test(text));
  if (blockedRule) {
    return { ok: false, error: blockedRule.message };
  }

  return { ok: true, value: text };
}

export function validateCommunityFields(fields) {
  const values = {};

  for (const field of fields) {
    const result = validateCommunityText(field.value, field);
    if (!result.ok) return result;
    values[field.key] = result.value;
  }

  return { ok: true, values };
}
