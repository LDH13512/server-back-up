import { Redis } from "@upstash/redis";
import { allowOrigin, enforceRateLimit, parseJsonBody, sendError, setCorsHeaders } from "../_lib/api-security.js";

const CONFIG = {
  "booking-title": {
    fields: { game: 40 },
    min: 16,
    max: 30,
    prompt: ({ game }) => `
게임 "${game}"의 파티원을 모집하는 재치 있고 친근한 한국어 제목을 하나 작성해 주세요.

규칙:
- 게임 이름이나 그 게임의 대표적인 세계관, 장소, 플레이 요소를 자연스럽게 활용하세요.
- 단순한 키워드 나열이나 "승패는 중요"처럼 끝나지 않은 문구가 아니라, 함께하자고 권하는 완성된 문장으로 작성하세요.
- 너무 광고 같거나 과장된 표현은 피하고, 친구에게 같이 게임하자고 권하는 느낌으로 작성하세요.
- 약 18~30자 길이로 작성하세요.
- 이모지는 있어도 하나만 사용하세요.
- 따옴표, 설명, 해설 없이 제목만 출력하세요.

좋은 분위기의 예시: "즐겁게 소환사의 협곡에서 노실 분?"
예시를 그대로 복사하지 말고 입력된 게임에 맞게 새로 작성하세요.
`.trim(),
  },
  "booking-description": {
    fields: { game: 40 },
    min: 35,
    max: 100,
    prompt: ({ game }) => `
게임 "${game}"의 파티 모집글에 들어갈 재미있고 자연스러운 한국어 소개 문장을 하나 작성해 주세요.

규칙:
- 해당 게임의 분위기나 대표적인 플레이 요소를 살리세요.
- 초보자도 부담 없이 참여하고 싶어지는 친근한 말투로 작성하세요.
- 짧은 키워드나 미완성 문장이 아니라 2문장 이내의 완성된 소개로 작성하세요.
- 승패나 실력만 강조하지 말고 함께 즐기는 분위기를 우선하세요.
- 약 45~90자 길이로 작성하세요.
- 따옴표, 괄호 속 부연 설명, 제목, 해설 없이 소개 문장만 출력하세요.
`.trim(),
  },
  "kakao-share-intro": {
    fields: { game: 40 },
    max: 30,
    prompt: ({ game }) => `
게임 "${game}"의 파티 모집 정보를 친구들에게 공유할 때 맨 위에 넣을 짧고 재미있는 한국어 추천 문구를 하나 작성해 주세요.

규칙:
- 반드시 공백을 포함해 30자 이내로 작성하세요.
- 입력된 게임 이름이나 그 게임의 세계관, 장소, 캐릭터, 대표적인 플레이 요소 중 하나를 자연스럽게 활용하세요.
- 친구에게 함께 게임하자고 권하는 친근하고 완성된 문장으로 작성하세요.
- 비속어, 욕설, 혐오 표현, 특정 집단이나 사람을 비하하는 표현은 절대 사용하지 마세요.
- 과도한 경쟁, 도박, 폭력적인 현실 행동을 부추기는 표현은 피하세요.
- 이모지는 있어도 하나만 사용하세요.
- 따옴표, 해설, 제목, 줄바꿈 없이 추천 문구만 출력하세요.

예시의 분위기: "오늘 밤 협곡에서 같이 달리실 분?"
예시를 그대로 복사하지 말고 입력된 게임에 맞는 새 문구를 작성하세요.
`.trim(),
  },
  "game-image-query": {
    fields: { game: 80 },
    max: 50,
    prompt: ({ game }) => `
파티 모집글 제목 "${game}"에서 실제 게임의 공식 명칭만 추출해 주세요.

규칙:
- 모집 문구, 일정, 인원, 플랫폼, 출시 안내, 괄호 안 설명, 이모지는 제거하세요.
- 게임을 식별하는 데 필요한 시리즈명과 부제는 보존하세요.
- 이미지 검색이 잘 되도록 가장 널리 알려진 한국어 또는 영문 공식 명칭을 사용하세요.
- 게임 이름 하나만 출력하고 따옴표, 설명, 문장부호는 붙이지 마세요.
`.trim(),
  },
  nickname: { fields: {}, max: 10, prompt: () => "Create one short fun Korean gamer nickname. Return only the nickname without quotes or punctuation." },
  "sketchbook-words": {
    fields: {},
    max: 80,
    prompt: () =>
      "그리기 쉽고 서로 다른 한국어 명사 3개를 만드세요. 각 단어는 반드시 한글 음절 1~8자로만 작성하고 영문·로마자·숫자는 사용하지 마세요. 번호나 설명 없이 쉼표로만 구분해 출력하세요.",
  },
  "sketchbook-word-batch": {
    fields: { excludeWords: 2000 },
    maxOutputTokens: 1024,
    timeoutMs: 15000,
    prompt: ({ excludeWords }) => `
공동 그림 도감에 추가할 쉽고 다양한 한국어 주제어 24개를 만들어 주세요.

반드시 아래 규칙을 지키세요.
- 한 장에 바로 그릴 수 있는 구체적인 한국어 명사만 사용합니다.
- 각 단어는 한글 2~7자이며 문장, 추상 개념, 상표명, 고유명사는 제외합니다.
- 흔한 단어만 반복하지 말고 서로 최대한 다른 대상을 고릅니다.
- 분류는 동물, 음식, 사물, 탈것, 자연·우주, 장소·건축, 취미·스포츠, 판타지 중 하나만 사용합니다.
- 설명이나 마크다운 없이 JSON 배열만 출력합니다.
- 형식: [{"word":"수달","category":"동물"}]

이미 등록된 다음 단어는 절대 다시 만들지 마세요:
${excludeWords}
`.trim(),
  },
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

function redisClient() {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  return url && token ? new Redis({ url, token }) : null;
}

function validate(kind, input) {
  const config = CONFIG[kind];
  if (!config || !input || typeof input !== "object" || Array.isArray(input)) return null;
  const values = {};
  for (const [field, max] of Object.entries(config.fields)) {
    if (typeof input[field] !== "string" || !input[field].trim() || input[field].length > max) return null;
    values[field] = input[field].trim();
  }
  if (
    kind === "sketchbook-word-batch" &&
    !/^[가-힣,]{1,2000}$/.test(values.excludeWords)
  ) {
    return null;
  }
  return Object.keys(input).every((field) => field in config.fields) ? { config, values } : null;
}

async function generateText(
  prompt,
  { maxOutputTokens = 256, timeoutMs = 10000 } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const providerPayload = await response.json().catch(() => null);
      const providerError = providerPayload?.error;
      console.error("Gemini API request failed", {
        httpStatus: response.status,
        code: providerError?.code,
        status: providerError?.status,
        message: String(providerError?.message || "Unknown provider error").slice(0, 300),
      });
      throw new Error("AI_PROVIDER_ERROR");
    }

    const payload = await response.json();
    return (payload.candidates?.[0]?.content?.parts || [])
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("")
      .trim()
      .replace(/[\r\n]+/g, " ");
  } finally {
    clearTimeout(timer);
  }
}

async function handleGameImageSearch(req, res) {
  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", "허용되지 않은 요청입니다.");
  }

  const query = String(
    req.query?.q ||
      new URL(req.url || "", "http://localhost").searchParams.get("q") ||
      ""
  ).trim();
  if (query.length < 2 || query.length > 50) {
    return sendError(res, 400, "INVALID_REQUEST", "게임 이름이 올바르지 않습니다.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const params = new URLSearchParams({ term: query, l: "koreana", cc: "KR" });
    const response = await fetch(
      `https://store.steampowered.com/api/storesearch/?${params}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "ArcadeBoard/5.5 game-image-search" },
      }
    );
    if (!response.ok) throw new Error("IMAGE_PROVIDER_ERROR");
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    let detailImages = [];
    const appId = Number(items[0]?.id);
    if (Number.isInteger(appId) && appId > 0) {
      try {
        const detailResponse = await fetch(
          `https://store.steampowered.com/api/appdetails?appids=${appId}&l=koreana&cc=KR`,
          {
            signal: controller.signal,
            headers: { "User-Agent": "ArcadeBoard/5.5 game-image-search" },
          }
        );
        if (detailResponse.ok) {
          const detailPayload = await detailResponse.json();
          const detail = detailPayload?.[appId]?.data;
          detailImages = [
            detail?.header_image,
            ...(Array.isArray(detail?.screenshots)
              ? detail.screenshots.map((screenshot) => screenshot?.path_thumbnail)
              : []),
          ];
        }
      } catch {
        // The search thumbnail remains a valid fallback.
      }
    }
    const images = [...detailImages, ...items.map((item) => item?.tiny_image)]
      .map((url) => String(url || "").trim())
      .filter((url) =>
        /^https:\/\/shared\.(?:akamai|fastly)\.steamstatic\.com\//i.test(url)
      );
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    return res.status(200).json({
      ok: true,
      data: { images: [...new Set(images)].slice(0, 12) },
    });
  } catch (error) {
    return sendError(
      res,
      error?.name === "AbortError" ? 504 : 502,
      error?.name === "AbortError"
        ? "IMAGE_PROVIDER_TIMEOUT"
        : "IMAGE_PROVIDER_ERROR",
      "게임 이미지를 검색할 수 없습니다."
    );
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (!allowOrigin(req, res)) return sendError(res, 403, "ORIGIN_NOT_ALLOWED", "허용되지 않은 요청 출처입니다.");
  if (req.method === "OPTIONS") return res.status(204).end();
  const route = String(
    req.query?.route ||
      new URL(req.url || "", "http://localhost").searchParams.get("route") ||
      ""
  );
  if (route === "game-images") return handleGameImageSearch(req, res);
  if (req.method !== "POST") return sendError(res, 405, "METHOD_NOT_ALLOWED", "허용되지 않은 요청입니다.");
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) return sendError(res, 400, "INVALID_REQUEST", "JSON 요청만 허용됩니다.");
  const parsed = parseJsonBody(req);
  if (parsed.error) return sendError(res, parsed.error === "PAYLOAD_TOO_LARGE" ? 413 : 400, parsed.error, "요청 형식이 올바르지 않습니다.");
  const validated = validate(parsed.body.kind, parsed.body.input);
  if (!validated) return sendError(res, 400, "INVALID_REQUEST", "허용되지 않은 AI 요청입니다.");
  const redis = redisClient();
  if (!process.env.GEMINI_API_KEY) return sendError(res, 503, "SERVER_NOT_CONFIGURED", "AI 서비스를 사용할 수 없습니다.");
  try {
    const isSketchbookBatch = parsed.body.kind === "sketchbook-word-batch";
    const retryAfter = await enforceRateLimit(
      redis,
      req,
      isSketchbookBatch ? "ai-sketchbook-batch" : "ai",
      isSketchbookBatch
        ? Number(process.env.AI_SKETCHBOOK_BATCH_LIMIT_PER_HOUR || 2)
        : Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20),
      isSketchbookBatch ? 60 * 60 : 60
    );
    if (retryAfter) { res.setHeader("Retry-After", retryAfter); return sendError(res, 429, "RATE_LIMITED", "잠시 후 다시 시도해 주세요."); }
    let text;
    try {
      const basePrompt = validated.config.prompt(validated.values);
      const generationOptions = {
        maxOutputTokens: validated.config.maxOutputTokens,
        timeoutMs: validated.config.timeoutMs,
      };
      text = await generateText(basePrompt, generationOptions);
      if (validated.config.min && Array.from(text).length < validated.config.min) {
        text = await generateText(
          `${basePrompt}\n\n이전 응답이 너무 짧았습니다. 반드시 ${validated.config.min}자 이상인 자연스럽고 완성된 문장으로 작성하세요.`,
          generationOptions
        );
      }
    } catch (error) {
      return sendError(
        res,
        error.name === "AbortError" ? 504 : 502,
        error.name === "AbortError" ? "AI_TIMEOUT" : "AI_PROVIDER_ERROR",
        "AI 생성에 실패했습니다."
      );
    }
    if (!text) return sendError(res, 502, "AI_PROVIDER_ERROR", "AI 생성에 실패했습니다.");
    if (parsed.body.kind === "sketchbook-words") {
      const words = text.split(",").map((word) => word.trim()).filter(Boolean);
      if (
        words.length !== 3 ||
        words.some((word) => !/^[가-힣]{1,8}$/.test(word))
      ) {
        return sendError(res, 502, "AI_PROVIDER_ERROR", "AI 생성에 실패했습니다.");
      }
      return res.status(200).json({ ok: true, data: { words } });
    }
    if (parsed.body.kind === "sketchbook-word-batch") {
      const categories = new Set([
        "동물",
        "음식",
        "사물",
        "탈것",
        "자연·우주",
        "장소·건축",
        "취미·스포츠",
        "판타지",
      ]);
      try {
        const cleaned = text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const rawItems = JSON.parse(cleaned);
        if (!Array.isArray(rawItems)) throw new Error("INVALID_BATCH");
        const seen = new Set();
        const items = rawItems
          .map((item) => ({
            word: String(item?.word || "").trim().replace(/\s+/g, ""),
            category: String(item?.category || "").trim(),
          }))
          .filter((item) => {
            if (
              !/^[가-힣]{2,7}$/.test(item.word) ||
              !categories.has(item.category) ||
              seen.has(item.word)
            ) {
              return false;
            }
            seen.add(item.word);
            return true;
          })
          .slice(0, 32);
        if (items.length < 12) throw new Error("INVALID_BATCH");
        return res.status(200).json({ ok: true, data: { items } });
      } catch {
        return sendError(
          res,
          502,
          "AI_PROVIDER_ERROR",
          "AI 주제어 생성에 실패했습니다."
        );
      }
    }
    const limitedText = Array.from(text).slice(0, validated.config.max).join("");
    if (parsed.body.kind === "kakao-share-intro") {
      const cleanedText = limitedText.replace(/['"]/g, "").trim();
      const blockedPattern =
        /(?:씨발|시발|ㅅㅂ|병신|ㅂㅅ|좆|지랄|개새끼|한남|한녀|김치녀|된장녀|틀딱|맘충|급식충)/i;
      return res.status(200).json({
        ok: true,
        data: {
          text:
            cleanedText && !blockedPattern.test(cleanedText)
              ? cleanedText
              : "같이 하실분 급구 합니다!",
        },
      });
    }
    return res.status(200).json({ ok: true, data: { text: limitedText } });
  } catch { return sendError(res, 502, "AI_PROVIDER_ERROR", "AI 생성에 실패했습니다."); }
}
