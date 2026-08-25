import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findGameImages,
  getGameSearchCandidates,
} from '../src/utils/gameImages.js';

test('괄호 뒤의 부가 문구와 출시 문구를 이미지 검색어에서 제거한다', () => {
  assert.equal(
    getGameSearchCandidates('팰월드 정식출시(뉴비 환영 / 8월 10일)')[0],
    '팰월드'
  );
});

test('모집 문구는 제거하지만 화면에 쓰는 원문도 후보로 보존한다', () => {
  const candidates = getGameSearchCandidates('리그 오브 레전드 같이 하실 분 구해요');
  assert.equal(candidates[0], '리그 오브 레전드');
  assert.ok(candidates.includes('리그 오브 레전드 같이 하실 분 구해요'));
});

test('구분자 뒤의 일정 설명을 제거한다', () => {
  assert.equal(
    getGameSearchCandidates('발로란트 / 오늘 밤 9시')[0],
    '발로란트'
  );
});

test('한국어 별칭과 모집 표현에서 공식 영문 검색어도 만든다', () => {
  assert.ok(getGameSearchCandidates('롤').includes('League of Legends'));
  assert.ok(getGameSearchCandidates('롤 같이 하실 분 구해요').includes('League of Legends'));
  assert.ok(getGameSearchCandidates('스캠라인(8/18)').includes('Scam Line'));
  assert.ok(getGameSearchCandidates('원신 다인팟').includes('Genshin Impact'));
  assert.ok(getGameSearchCandidates('데바데').includes('Dead by Daylight'));
  assert.ok(getGameSearchCandidates('포더킹2').includes('For The King II'));
});

test('일반 검색 결과가 없을 때만 Gemini 공식 게임명으로 다시 검색한다', async () => {
  const originalFetch = globalThis.fetch;
  let aiCalls = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url === '/api/ai/generate') {
      aiCalls += 1;
      return new Response(JSON.stringify({ data: { text: 'Official Game' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/game-images?q=Official%20Game')) {
      return new Response(JSON.stringify({
        data: { images: ['https://images.example.com/official-game.jpg'] },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ query: { pages: {} }, data: { images: [] } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const images = await findGameImages('검색되지 않는 게임 이름');
    assert.equal(aiCalls, 1);
    assert.deepEqual(images, ['https://images.example.com/official-game.jpg']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
