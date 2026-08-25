import { validateCommunityText } from './contentModeration.js';

export const KAKAO_SHARE_INTRO_MAX_LENGTH = 500;

export const DEFAULT_KAKAO_SHARE_INTRO = '같이 하실분 급구 합니다!';

const BLOCKED_KAKAO_INTRO_PATTERN =
  /(?:씨발|시발|ㅅㅂ|병신|ㅂㅅ|좆|지랄|개새끼|한남|한녀|김치녀|된장녀|틀딱|맘충|급식충)/i;

const getDayOfWeek = (dateString) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return '';

  const [year, month, day] = dateString.split('-').map(Number);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dayIndex = new Date(year, month - 1, day).getDay();

  return `(${weekdays[dayIndex]})`;
};

const textOrFallback = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  return value.trim() || fallback;
};

const formatSchedule = (booking) => {
  if (booking?.isAlwaysOpen) return '상시 모집';

  const date = textOrFallback(booking?.date, '날짜 미정');
  const time = textOrFallback(booking?.time, '시간 미정');
  const dateWithDay = date === '날짜 미정' ? date : `${date}${getDayOfWeek(date)}`;

  return `${dateWithDay} ${time === '미정' ? '시간 미정' : time}`;
};

/**
 * 직접 입력하거나 AI가 만든 추천 문구를 검증합니다.
 * 추천 문구는 30자 이내이며 비속어·혐오 표현을 허용하지 않습니다.
 */
export const validateKakaoShareIntro = (value) => {
  const result = validateCommunityText(value, {
    label: '추천 문구',
    maxLength: KAKAO_SHARE_INTRO_MAX_LENGTH,
  });

  if (!result.ok) return result;
  if (BLOCKED_KAKAO_INTRO_PATTERN.test(result.value)) {
    return {
      ok: false,
      error: '비속어나 혐오 표현은 추천 문구에 사용할 수 없습니다.',
    };
  }

  return result;
};

export const getDefaultKakaoShareIntro = (booking) =>
  String(booking?.description || '').trim() || DEFAULT_KAKAO_SHARE_INTRO;

/**
 * 카카오톡에 붙여넣을 간단한 모집글 안내 문구를 만듭니다.
 * 게임, 일시, 파티장을 포함한 전체 참가자, 모집 현황만 복사합니다.
 */
export const buildKakaoBookingMessage = (
  booking,
  intro = DEFAULT_KAKAO_SHARE_INTRO
) => {
  const host = textOrFallback(booking?.nickname, '미정');
  const participants = Array.isArray(booking?.participants)
    ? booking.participants.filter((participant) => typeof participant === 'string' && participant.trim())
    : [];
  const people = [host, ...participants];
  const capacity = textOrFallback(String(booking?.capacity ?? ''), '미정');
  const introValidation = validateKakaoShareIntro(intro);
  const resolvedIntro = introValidation.ok
    ? introValidation.value
    : DEFAULT_KAKAO_SHARE_INTRO;

  return [
    resolvedIntro,
    `게임: ${textOrFallback(booking?.game, '게임명 미정')}`,
    `일시: ${formatSchedule(booking)}`,
    `사람: ${people.join(', ')}`,
    `모집 현황: ${people.length}/${capacity}명`,
  ].join('\n');
};

const copyTextToClipboard = async (text) => {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

/**
 * 같은 모집글의 전달용 정보를 클립보드에만 복사합니다.
 */
export const copyBookingForKakao = async (
  booking,
  intro = DEFAULT_KAKAO_SHARE_INTRO
) => {
  const message = buildKakaoBookingMessage(booking, intro);

  try {
    const copied = await copyTextToClipboard(message);
    return { copied, message };
  } catch {
    return { copied: false, message };
  }
};
