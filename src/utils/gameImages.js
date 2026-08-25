const WIKIPEDIA_API_URLS = [
  'https://ko.wikipedia.org/w/api.php',
  'https://en.wikipedia.org/w/api.php',
];
const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const IMAGE_CACHE_PREFIX = 'party-card-images:';
const AI_QUERY_CACHE_PREFIX = 'party-card-ai-query:';
const GAME_SEARCH_ALIASES = {
  롤: 'League of Legends',
  스캠라인: 'Scam Line',
  원신: 'Genshin Impact',
  데바데: 'Dead by Daylight',
  포더킹2: 'For The King II',
};
const TRAILING_PARTY_PHRASE = /\s*(?:정식\s*출시(?:\s*기념)?|얼리\s*액세스|신규\s*오픈|뉴비\s*환영|초보\s*환영|복귀(?:자)?\s*환영|같이\s*(?:하실|할)\s*분|함께\s*(?:하실|할)\s*분|멤버\s*모집|인원\s*모집|파티원\s*모집|모집(?:합니다|해요)?|구합니다|구해요|구함)\s*[!?.~…]*$/u;

const trimPartyPhrases = (value) => {
  let result = value.trim();
  let previous = '';
  while (result && result !== previous) {
    previous = result;
    result = result.replace(TRAILING_PARTY_PHRASE, '').trim();
  }
  return result;
};

export function getGameSearchCandidates(game) {
  const original = String(game || '').replace(/https?:\/\/\S+/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!original) return [];

  const withoutBracketSuffix = original
    .replace(/[([{（【].*$/u, '')
    .split(/\s+(?:[|·•]|-{2,})\s+|\s+\/\s+/u)[0]
    .trim();
  const cleaned = trimPartyPhrases(withoutBracketSuffix);
  const aliases = Object.entries(GAME_SEARCH_ALIASES)
    .filter(([name]) => original.includes(name))
    .map(([, alias]) => alias);
  const candidates = [cleaned, ...aliases, withoutBracketSuffix, original];

  const words = withoutBracketSuffix.split(/\s+/u).filter(Boolean);
  for (let length = words.length - 1; length >= 1; length -= 1) {
    candidates.push(trimPartyPhrases(words.slice(0, length).join(' ')));
  }

  return [...new Set(candidates.filter((candidate) => candidate.length >= 2))];
}

const readCachedImages = (game) => {
  try {
    const cached = sessionStorage.getItem(`${IMAGE_CACHE_PREFIX}${game}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const writeCachedImages = (game, images) => {
  try {
    sessionStorage.setItem(`${IMAGE_CACHE_PREFIX}${game}`, JSON.stringify(images));
  } catch {
    // The card can still use the in-memory result when storage is unavailable.
  }
};

const getAiSearchQuery = async (game) => {
  const cacheKey = `${AI_QUERY_CACHE_PREFIX}${game}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // Continue without storage.
  }

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'game-image-query', input: { game } }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || typeof payload?.data?.text !== 'string') return '';

  const query = payload.data.text
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  if (query.length < 2 || query.length > 50) return '';
  try {
    sessionStorage.setItem(cacheKey, query);
  } catch {
    // Continue without storage.
  }
  return query;
};

async function searchWikipedia(apiUrl, game, offset = 0) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '0',
    gsrsearch: game,
    gsrlimit: '10',
    gsroffset: String(offset),
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '640',
  });
  const response = await fetch(`${apiUrl}?${params.toString()}`);
  if (!response.ok) throw new Error('GAME_IMAGE_SEARCH_FAILED');

  const payload = await response.json();
  const normalizedQuery = game.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return Object.values(payload?.query?.pages || {})
    .sort((left, right) => (left.index || 0) - (right.index || 0))
    .filter((page) => {
      const normalizedTitle = String(page.title || '')
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');
      return normalizedQuery.length >= 2 && normalizedTitle.length >= 2 && (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedTitle)
      );
    })
    .map((page) => page.thumbnail?.source)
    .filter(Boolean);
}

async function searchSteam(game) {
  const response = await fetch(`/api/game-images?q=${encodeURIComponent(game)}`);
  if (!response.ok) throw new Error('GAME_IMAGE_SEARCH_FAILED');
  const payload = await response.json();
  return Array.isArray(payload?.data?.images) ? payload.data.images : [];
}

async function searchCommons(game, offset = 0) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: game,
    gsrlimit: '12',
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '640',
  });
  const response = await fetch(`${COMMONS_API_URL}?${params.toString()}`);
  if (!response.ok) throw new Error('GAME_IMAGE_SEARCH_FAILED');

  const payload = await response.json();
  return Object.values(payload?.query?.pages || {})
    .sort((left, right) => (left.index || 0) - (right.index || 0))
    .map((page) => page.imageinfo?.[0])
    .filter((image) =>
      String(image?.mime || '').startsWith('image/') &&
      Boolean(image?.thumburl || image?.url)
    )
    .map((image) => image.thumburl || image.url);
}

async function searchGameImageCandidates(candidates, offset) {
  for (const candidate of candidates) {
    try {
      const steamImages = await searchSteam(candidate);
      if (steamImages.length > 0) return steamImages;
    } catch {
      // Continue with public image sources.
    }

    try {
      const commonsImages = await searchCommons(candidate, offset);
      if (commonsImages.length > 0) return commonsImages;
    } catch {
      // Continue with Wikipedia page images.
    }

    const results = await Promise.allSettled(
      WIKIPEDIA_API_URLS.map((apiUrl) =>
        searchWikipedia(apiUrl, candidate, offset)
      )
    );
    const wikipediaImages = results.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : []
    );
    if (wikipediaImages.length > 0) return wikipediaImages;
  }

  return [];
}

export async function findGameImages(game, { refresh = false } = {}) {
  const normalizedGame = String(game || '').trim();
  if (!normalizedGame) return [];

  const cachedImages = readCachedImages(normalizedGame);
  if (!refresh && cachedImages.length > 0) return cachedImages;

  const offset = refresh ? 10 : 0;
  const ruleBasedCandidates = getGameSearchCandidates(normalizedGame);
  let searchedImages = await searchGameImageCandidates(
    ruleBasedCandidates,
    offset
  );

  if (searchedImages.length === 0) {
    try {
      const aiCandidate = await getAiSearchQuery(normalizedGame);
      if (aiCandidate && !ruleBasedCandidates.includes(aiCandidate)) {
        searchedImages = await searchGameImageCandidates(
          [aiCandidate],
          offset
        );
      }
    } catch {
      // Keep an empty result when AI or external image search is unavailable.
    }
  }

  const uniqueImages = [...new Set([...cachedImages, ...searchedImages])];
  writeCachedImages(normalizedGame, uniqueImages);
  return uniqueImages;
}
