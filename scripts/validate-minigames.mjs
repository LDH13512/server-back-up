import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  MASTER_GAMES,
  getGameForDayNumber,
  getKSTDayNumber,
} from '../src/config/minigames.js';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const errors = [];
const gameIds = new Set();
const rankKeys = new Set();
const rankPaths = new Set();

for (const game of MASTER_GAMES) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(game.id)) {
    errors.push(`[${game.id}] id에는 영문, 숫자, -, _만 사용할 수 있습니다.`);
  }
  if (gameIds.has(game.id)) {
    errors.push(`[${game.id}] 중복된 게임 id입니다.`);
  }
  gameIds.add(game.id);

  if (!game.name?.trim()) {
    errors.push(`[${game.id}] 게시판에 표시할 name이 없습니다.`);
  }

  if (!Array.isArray(game.ranks) || game.ranks.length === 0) {
    errors.push(`[${game.id}] 리더보드 ranks가 없습니다.`);
    continue;
  }

  const expectedHref = `/minigame/${game.id}/index.html`;
  if (game.href === expectedHref) {
    const htmlPath = path.join(
      projectRoot,
      'public',
      'minigame',
      game.id,
      'index.html'
    );
    try {
      await access(htmlPath, constants.R_OK);
    } catch {
      errors.push(`[${game.id}] ${expectedHref}에 index.html이 없습니다.`);
    }
  }

  for (const rank of game.ranks) {
    if (!rank.key || !rank.label) {
      errors.push(`[${game.id}] 모든 rank에는 key와 label이 필요합니다.`);
    }
    if (rankKeys.has(rank.key)) {
      errors.push(
        `[${game.id}] rank key "${rank.key}"가 다른 게임과 중복됩니다.`
      );
    }
    rankKeys.add(rank.key);

    if (
      !Array.isArray(rank.path) ||
      rank.path.length === 0 ||
      rank.path.some((part) => typeof part !== 'string' || !part.trim())
    ) {
      errors.push(`[${game.id}/${rank.key}] Firebase path 형식이 잘못되었습니다.`);
      continue;
    }

    const serializedPath = rank.path.join('/');
    if (rankPaths.has(serializedPath)) {
      errors.push(
        `[${game.id}/${rank.key}] Firebase path가 다른 리더보드와 중복됩니다: ${serializedPath}`
      );
    }
    rankPaths.add(serializedPath);
  }
}

if (errors.length > 0) {
  console.error('❌ 미니게임 설정 검사 실패');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const todayDayNumber = getKSTDayNumber();
console.log(`✅ 기본 미니게임 ${MASTER_GAMES.length}개 설정이 정상입니다.`);
console.log('관리자 등록 게임을 제외한 KST 기준 7일 배치:');
for (let offset = 0; offset < 7; offset += 1) {
  const dayNumber = todayDayNumber + offset;
  const date = new Date(dayNumber * 86_400_000).toISOString().slice(0, 10);
  const game = getGameForDayNumber(dayNumber);
  console.log(`- ${date}: ${game.id} (${game.name})`);
}
