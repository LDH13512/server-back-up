import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'node:fs';

const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const backupProjectId = 'backup-fcf14';
const localAiConfigs = {
  'booking-title': {
    max: 15,
    prompt: ({ game }) =>
      `Create one Korean game-party title for ${game}. Keep it within 15 characters and include an emoji. Return only the title.`,
  },
  'booking-description': {
    max: 50,
    prompt: ({ game }) =>
      `Write one witty Korean description for a ${game} game party. Keep it within 50 characters. Return only the description.`,
  },
  'game-image-query': {
    max: 50,
    prompt: ({ game }) => `
파티 모집글 제목 "${game}"에서 실제 게임의 공식 명칭만 추출해 주세요.
모집 문구, 일정, 인원, 플랫폼, 출시 안내, 괄호 안 설명, 이모지는 제거하세요.
게임을 식별하는 데 필요한 시리즈명과 부제는 보존하세요.
이미지 검색이 잘 되도록 가장 널리 알려진 한국어 또는 영문 공식 명칭을 사용하세요.
게임 이름 하나만 출력하고 따옴표나 설명은 붙이지 마세요.
`.trim(),
  },
  nickname: {
    max: 10,
    prompt: () =>
      'Create one short fun Korean gamer nickname. Return only the nickname without quotes or punctuation.',
  },
  'sketchbook-words': {
    max: 80,
    prompt: () =>
      '그리기 쉽고 서로 다른 한국어 명사 3개를 만드세요. 각 단어는 반드시 한글 음절 1~8자로만 작성하고 영문·로마자·숫자는 사용하지 마세요. 번호나 설명 없이 쉼표로만 구분해 출력하세요.',
  },
  'sketchbook-word-batch': {
    max: 1200,
    prompt: ({ excludeWords }) => `
공동 그림 도감에 추가할 쉽고 다양한 한국어 주제어 24개를 만들어 주세요.
한 장에 그릴 수 있는 구체적인 한글 명사 2~7자만 사용하세요.
분류는 동물, 음식, 사물, 탈것, 자연·우주, 장소·건축, 취미·스포츠, 판타지 중 하나만 사용하세요.
설명이나 마크다운 없이 [{"word":"수달","category":"동물"}] 형식의 JSON 배열만 출력하세요.
이미 등록된 다음 단어는 절대 다시 만들지 마세요: ${excludeWords}
`.trim(),
  },
};

function readFirebaseConfig(value) {
  try {
    const config = JSON.parse(value || '');
    return requiredFields.every((field) => typeof config[field] === 'string' && config[field]) &&
      config.projectId === backupProjectId
      ? config
      : null;
  } catch {
    return null;
  }
}

function readLocalEnvValue(name, fallback) {
  if (!fs.existsSync('.env.local')) return fallback;
  const line = fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));
  if (!line) return fallback;
  const value = line.slice(name.length + 1).trim();
  return value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mainConfig = readFirebaseConfig(readLocalEnvValue('FIREBASE_WEB_CONFIG', env.FIREBASE_WEB_CONFIG));
  const minigameConfig = readFirebaseConfig(readLocalEnvValue('FIREBASE_MINIGAME_CONFIG', env.FIREBASE_MINIGAME_CONFIG));
  const sketchbookLegacyConfig = readFirebaseConfig(
    readLocalEnvValue(
      'FIREBASE_SKETCHBOOK_LEGACY_CONFIG',
      env.FIREBASE_SKETCHBOOK_LEGACY_CONFIG
    )
  );
  const geminiApiKey = readLocalEnvValue('GEMINI_API_KEY', env.GEMINI_API_KEY);
  const localFirebaseEndpoint = {
    name: 'local-firebase-endpoint',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!String(req.url || '').startsWith('/_runtime/firebase-config')) {
          next();
          return;
        }
        const app = new URL(req.url || '', 'http://localhost').searchParams.get('app');
        const config =
          app === 'main'
            ? mainConfig
            : ['minigame', 'sketchbook'].includes(app)
              ? minigameConfig
              : null;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        if (!config || (app === 'main' && !minigameConfig)) {
          res.statusCode = 503;
          res.end("window.__PLAYGROUND_FIREBASE_BOOTSTRAP_ERROR__='SERVER_NOT_CONFIGURED';");
          return;
        }
        if (app === 'sketchbook') {
          const encoded = Buffer.from(JSON.stringify(config), 'utf8').toString('base64');
          res.end(
            `window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__=${JSON.stringify(config)};` +
              `window.__PLAYGROUND_FIREBASE_SKETCHBOOK_LEGACY_CONFIG__=${JSON.stringify(sketchbookLegacyConfig)};` +
              `window._mg_fbc=${JSON.stringify(encoded)};`
          );
          return;
        }
        if (app === 'minigame') {
          const encoded = Buffer.from(JSON.stringify(config), 'utf8').toString('base64');
          res.end(`window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__=${JSON.stringify(config)};window._mg_fbc=${JSON.stringify(encoded)};`);
          return;
        }
        const encoded = Buffer.from(JSON.stringify(minigameConfig), 'utf8').toString('base64');
        res.end(`window.__PLAYGROUND_FIREBASE_WEB_CONFIG__=${JSON.stringify(config)};window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__=${JSON.stringify(minigameConfig)};window._mg_fbc=${JSON.stringify(encoded)};`);
      });
    },
  };
  const localAiEndpoint = {
    name: 'local-ai-endpoint',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (String(req.url || '').split('?')[0] !== '/api/ai/generate') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }));
          return;
        }
        if (!geminiApiKey) {
          res.statusCode = 503;
          res.end(JSON.stringify({ ok: false, error: { code: 'SERVER_NOT_CONFIGURED' } }));
          return;
        }

        try {
          let rawBody = '';
          for await (const chunk of req) {
            rawBody += chunk;
            if (Buffer.byteLength(rawBody, 'utf8') > 8 * 1024) {
              throw new Error('PAYLOAD_TOO_LARGE');
            }
          }

          const body = JSON.parse(rawBody);
          const config = localAiConfigs[body.kind];
          const game = String(body.input?.game || '').trim();
          const excludeWords = String(body.input?.excludeWords || '').trim();
          if (
            !config ||
            (![
              'nickname',
              'sketchbook-words',
              'sketchbook-word-batch',
            ].includes(body.kind) &&
              (!game || game.length > (body.kind === 'game-image-query' ? 80 : 40)))
            || (body.kind === 'sketchbook-word-batch' &&
              !/^[가-힣,]{1,2000}$/.test(excludeWords))
          ) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: { code: 'INVALID_REQUEST' } }));
            return;
          }

          const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey,
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: config.prompt({ game, excludeWords }),
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.8,
                  maxOutputTokens:
                    body.kind === 'sketchbook-word-batch' ? 1024 : 120,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
              }),
            }
          );

          if (!response.ok) throw new Error('AI_PROVIDER_ERROR');
          const payload = await response.json();
          const text = (payload.candidates?.[0]?.content?.parts || [])
            .filter(
              (part) => !part.thought && typeof part.text === 'string'
            )
            .map((part) => part.text)
            .join('')
            .trim()
            .replace(/[\r\n]+/g, ' ');
          if (!text) {
            throw new Error('AI_PROVIDER_ERROR');
          }

          if (body.kind === 'sketchbook-words') {
            const words = text
              .split(',')
              .map((word) => word.trim())
              .filter(Boolean);
            if (
              words.length !== 3 ||
              words.some((word) => !/^[가-힣]{1,8}$/.test(word))
            ) {
              throw new Error('AI_PROVIDER_ERROR');
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, data: { words } }));
            return;
          }

          if (body.kind === 'sketchbook-word-batch') {
            const categories = new Set([
              '동물',
              '음식',
              '사물',
              '탈것',
              '자연·우주',
              '장소·건축',
              '취미·스포츠',
              '판타지',
            ]);
            const cleaned = text
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();
            const rawItems = JSON.parse(cleaned);
            const seen = new Set();
            const items = (Array.isArray(rawItems) ? rawItems : [])
              .map((item) => ({
                word: String(item?.word || '').trim().replace(/\s+/g, ''),
                category: String(item?.category || '').trim(),
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
            if (items.length < 12) {
              throw new Error('AI_PROVIDER_ERROR');
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, data: { items } }));
            return;
          }

          const limitedText = Array.from(text)
            .slice(0, config.max)
            .join('');
          res.statusCode = 200;
          res.end(
            JSON.stringify({ ok: true, data: { text: limitedText } })
          );
        } catch (error) {
          res.statusCode =
            error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 502;
          res.end(
            JSON.stringify({
              ok: false,
              error: {
                code:
                  error.message === 'PAYLOAD_TOO_LARGE'
                    ? 'PAYLOAD_TOO_LARGE'
                    : 'AI_PROVIDER_ERROR',
              },
            })
          );
        }
      });
    },
  };
  const localGameImageEndpoint = {
    name: 'local-game-image-endpoint',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (String(req.url || '').split('?')[0] !== '/api/game-images') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }));
          return;
        }

        const query = String(new URL(req.url || '', 'http://localhost').searchParams.get('q') || '').trim();
        if (query.length < 2 || query.length > 50) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: { code: 'INVALID_REQUEST' } }));
          return;
        }

        try {
          const params = new URLSearchParams({ term: query, l: 'koreana', cc: 'KR' });
          const response = await fetch(`https://store.steampowered.com/api/storesearch/?${params}`);
          if (!response.ok) throw new Error('IMAGE_PROVIDER_ERROR');
          const payload = await response.json();
          const items = Array.isArray(payload?.items) ? payload.items : [];
          let detailImages = [];
          const appId = Number(items[0]?.id);
          if (Number.isInteger(appId) && appId > 0) {
            try {
              const detailResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=koreana&cc=KR`);
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
            .map((url) => String(url || '').trim())
            .filter((url) => /^https:\/\/shared\.(?:akamai|fastly)\.steamstatic\.com\//i.test(url));
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, data: { images: [...new Set(images)].slice(0, 12) } }));
        } catch {
          res.statusCode = 502;
          res.end(JSON.stringify({ ok: false, error: { code: 'IMAGE_PROVIDER_ERROR' } }));
        }
      });
    },
  };
  return {
    plugins: [localFirebaseEndpoint, localAiEndpoint, localGameImageEndpoint, react()],
    base: './',
  };
});
