/**
 * 새 미니게임 등록 안내
 *
 * 이 파일은 게임 정보의 형식과 기본 제공 게임을 정의하는 중앙 설정입니다.
 * 일반적인 단일 리더보드 게임은 폴더를 배포한 뒤 관리자 화면에서
 * id, name, label을 등록하는 것이 가장 간단합니다.
 *
 * 관리자 등록 게임은 메인 Firebase의 minigames 컬렉션에 저장되고,
 * 아래 RAW_GAMES 뒤에 자동으로 합쳐집니다. reset-arcade.js 등에 같은
 * 목록을 다시 만들지 마세요.
 *
 * 관리자 화면을 사용하지 않고 기본 게임으로 직접 포함하려면:
 * 1. public/minigame/<게임 id>/index.html 경로에 게임 파일을 둡니다.
 * 2. 아래 RAW_GAMES 배열에 게임 정보 한 개를 추가합니다.
 * 3. 리더보드가 하나라면 다음처럼 label만 지정합니다.
 *
 *    {
 *      id: 'newgame',
 *      name: '🎮 새 게임',
 *      label: '새게임왕'
 *    }
 *
 *    위 설정의 주소와 Firebase 경로는 자동으로 다음과 같이 만들어집니다.
 *    - 게임 주소: /minigame/newgame/index.html
 *    - 리더보드: artifacts/newgame/public/data/leaderboard
 *
 * 4. 점수/시간처럼 리더보드가 여러 개이거나 기존 경로가 다르면 ranks를 씁니다.
 *
 *    {
 *      id: 'newgame',
 *      name: '🎮 새 게임',
 *      ranks: [
 *        {
 *          key: 'score',
 *          label: '점수왕',
 *          path: ['artifacts', 'newgame', 'public', 'data', 'leaderboard_s']
 *        },
 *        {
 *          key: 'time',
 *          label: '시간왕',
 *          path: ['artifacts', 'newgame', 'public', 'data', 'leaderboard_t'],
 *          isTime: true
 *        }
 *      ]
 *    }
 *
 * 주의사항
 * - id는 폴더명 및 Firebase 경로와 정확히 같아야 하며 중복되면 안 됩니다.
 * - 시간이 짧을수록 높은 순위인 기록에는 isTime: true를 지정합니다.
 * - 게임 HTML이 기록을 저장하는 Firebase 경로와 path가 반드시 같아야 합니다.
 * - 기존 게임을 삭제하거나 id/path를 바꾸면 기존 기록에 접근할 수 없게 됩니다.
 * - 관리자 등록 또는 이 배열 추가 후 별도 초기화 파일 수정은 필요 없습니다.
 */

// 🎯 [규칙 자동화] 미니게임 원시 등록 데이터 풀
export const RAW_GAMES = [
  {
    id: 'squirrel',
    name: '🐿️ 다람쥐스토랑',
    label: '쥐도리',
    ranks: [
      {
        key: 'squirrel',
        label: '쥐도리',
        path: ['artifacts', 'squirrel', 'public', 'data', 'leaderboard_net']
      }
    ]
  },
  {
    id: 'rhythm',
    name: '🎹 리듬겜',
    aggregateRank: { key: 'rhythm-king', label: '리듬왕', type: 'rhythm-king' },
    ranks: [
      { key: 'rhythm-neon-sprint', label: 'Neon왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_neon_sprint'] },
      { key: 'rhythm-starlight-drive', label: 'Starlight왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_starlight_drive'] },
      { key: 'rhythm-bit-quest', label: 'Bit Quest왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_bit_quest'] },
      { key: 'rhythm-exit-the-premises', label: 'Exit왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_exit_the_premises'] },
      { key: 'rhythm-pixelland', label: 'Pixelland왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_pixelland'] },
      { key: 'rhythm-dungeon-level', label: 'Dungeon왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_dungeon_level'] },
      { key: 'rhythm-blip-stream', label: 'Blip왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_blip_stream'] },
      { key: 'rhythm-edm-detection', label: 'EDM왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_edm_detection'] },
      { key: 'rhythm-salty-ditty', label: 'Salty왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_salty_ditty'] },
      { key: 'rhythm-electrodoodle', label: 'Doodle왕', path: ['artifacts', 'rhythm', 'public', 'data', 'leaderboard_electrodoodle'] }
    ]
  },
  { 
    id: 'tidyup', 
    name: '🧹삼단정리', 
    label: '청소왕' 
  },
  {
    id: 'yahtzee', 
    name: '🎲 야찌', 
    label: '주사위왕' 
  },
  { 
    id: 'bubble', 
    name: '🫧 버블 스피너', 
    label: '거품왕'  
  },
  { 
    id: 'pacman', 
    name: '👻 팩맨', 
    label: '팩맨왕' 
  },
  { 
    id: 'apple', 
    name: '🍎 사과게임', 
    label: '사과왕' 
  },
  { 
    id: '2048', 
    name: '🔢 2048게임', 
    ranks: [ 
      { key: 'g2048', label: '점수왕', path: ['artifacts', '2048', 'public', 'data', 'leaderboard_s'] },
      { key: 't2048', label: '시간왕', path: ['artifacts', '2048', 'public', 'data', 'leaderboard_t'], isTime: true }
    ] 
  },
  { 
    id: 'watermelon', 
    name: '🍉 수박게임', 
    label: '수박왕'
  },
  { 
    id: 'snake', 
    name: '🐍 뱀게임', 
    label: '뱀왕' 
  },
  { 
    id: 'aim', 
    name: '🎯 사격장', 
    label: '에임왕' 
  },
  { 
    id: 'flappybird', 
    name: '🐦 플래피 버드', 
    label: '새왕'  
  },
  {
    id: 'ladder', 
    name: '🪜 무한의 계단', 
    label: '사다리왕'  
  },
  { 
    id: 'tetris', 
    name: ' 🧩테트리스', 
    ranks: [ 
      { key: '스프린트', label: '스프린트왕', path: ['artifacts', 'tetris', 'public', 'data', 'leaderboard_t'], isTime: true },
      { key: '점수', label: '점수왕', path: ['artifacts', 'tetris', 'public', 'data', 'leaderboard_s'] }
    ]
  },
  { 
    id: 'machine', 
    name: '🎰 슬롯머신', 
    label: '도박왕'  
  },
  { 
    id: 'mine', 
    name: '💣 지뢰찾기', 
    label: '지뢰왕',
    isTime: true 
  },
  { 
    id: 'dino', 
    name: '🦖 DINO JUMP', 
    label: '공룡왕'  
  },
  { 
    id: '10sec', 
    name: '⏱️스톱워치', 
    label: '시간왕', isTime: true 
  },
  { 
    id: 'russianroulette', 
    name: '🔫 러시안 룰렛', 
    label: '빵야빵야왕'  
  },
  { 
    id: 'roadkill', 
    name: '🐔 길건너친구들', 
    label: '로드킹'  
  },
   { 
    id: 'sichuan', 
    name: '🀄 범키의 사천성', 
    label: '마작킹'  
  },
];

// ✨ [자동화 코어] 입력된 정보를 가이드 규칙에 맞게 런타임에 자동 팽창 변환합니다.
const normalizeGame = (game) => {
  const href = game.href || `/minigame/${game.id}/index.html`;

  let rawRanks = game.ranks;
  if (!rawRanks && game.label) {
    rawRanks = [{ key: game.id, label: game.label }];
  } else if (!rawRanks) {
    rawRanks = [{ key: game.id, label: '최강자' }];
  }

  const normalizedRanks = rawRanks.map(r => ({
    key: r.key,
    label: r.label,
    path: r.path || ['artifacts', game.id, 'public', 'data', 'leaderboard'],
    isTime: r.isTime || game.isTime || false
  }));

  return {
    ...game,
    href,
    ranks: normalizedRanks
  };
};

export const MASTER_GAMES = RAW_GAMES.map(normalizeGame);

const REGISTERED_GAME_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;

/**
 * 관리자 화면에서 Firebase에 등록한 단일 리더보드 게임을 기본 게임과 합칩니다.
 * 관리자 게임은 createdAt → id 순서로 정렬하므로 브라우저와 예약 작업에서
 * Firestore 조회 순서가 달라도 같은 요일 배치를 계산합니다.
 */
export const mergeGameRegistrations = (registrations = []) => {
  const usedIds = new Set(MASTER_GAMES.map((game) => game.id));
  const sortedRegistrations = [...registrations].sort((a, b) => {
    const timeDifference = Number(a?.createdAt || 0) - Number(b?.createdAt || 0);
    return timeDifference || String(a?.id || '').localeCompare(String(b?.id || ''));
  });
  const registeredGames = [];

  for (const registration of sortedRegistrations) {
    const id = String(registration?.id || '').trim();
    const name = String(registration?.name || '').trim();
    const label = String(registration?.label || '').trim();
    if (
      !REGISTERED_GAME_ID_PATTERN.test(id) ||
      !name ||
      !label ||
      usedIds.has(id)
    ) {
      continue;
    }

    usedIds.add(id);
    registeredGames.push(
      normalizeGame({
        id,
        name,
        label,
        createdAt: Number(registration.createdAt || 0),
        updatedAt: Number(registration.updatedAt || 0),
        source: 'admin',
      })
    );
  }

  return [...MASTER_GAMES, ...registeredGames];
};

// 🔄 MASTER_GAMES 기반으로 관리자 리셋에 사용할 Firebase 경로 리스트 추출
export const MINIGAME_PATHS = MASTER_GAMES.reduce((acc, game) => {
  game.ranks.forEach(r => {
    acc.push(r.path);
  });
  return acc;
}, []);

export const getMinigamePaths = (games = MASTER_GAMES) =>
  games.flatMap((game) => game.ranks.map((rank) => rank.path));

/**
 * [공유 핵심 함수] 게시판, 브라우저 보조 초기화, 서버 예약 초기화가 모두 동일하게 사용하는
 * 결정론적 게임 순열(permutation)을 반환합니다.
 * baseSeed와 알고리즘이 변경되면 게임 배치 순서가 완전히 바뀌므로 절대 수정 금지.
 */
export const getGamePermutation = (gameCount = MASTER_GAMES.length) => {
  const N = gameCount;
  if (!Number.isInteger(N) || N <= 0) {
    throw new TypeError('gameCount는 1 이상의 정수여야 합니다.');
  }
  const permutation = Array.from({ length: N }, (_, i) => i);
  let baseSeed = 54322;
  const seededRandom = () => {
    const x = Math.sin(baseSeed++) * 10000;
    return x - Math.floor(x);
  };
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  return permutation;
};

/**
 * KST 절대 일수에 해당하는 게임을 반환합니다.
 * 게시판, 브라우저 보조 초기화, 예약 초기화가 반드시 이 함수를 함께 사용해야 합니다.
 */
export const getGameForDayNumber = (dayNumber, games = MASTER_GAMES) => {
  if (!Number.isInteger(dayNumber)) {
    throw new TypeError('dayNumber는 정수여야 합니다.');
  }
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error('등록된 미니게임이 없습니다.');
  }

  const permutation = getGamePermutation(games.length);
  const slot = ((dayNumber % games.length) + games.length) % games.length;
  return games[permutation[slot]];
};

/**
 * [공유 핵심 함수] KST 기준 오늘의 절대 일수(dayNumber)를 반환합니다.
 * 동일한 날이면 항상 동일한 값을 반환합니다.
 */
export const getKSTDayNumber = () => {
  const kstTimestamp = Date.now() + (9 * 60 * 60 * 1000);
  return Math.floor(kstTimestamp / (24 * 60 * 60 * 1000));
};

/**
 * [공유 핵심 함수] 특정 슬롯(요일 인덱스 0=월~6=일)의 최근 dayNumber를 반환합니다.
 * MiniGameModal의 weeklyActiveGames 계산에 사용됩니다.
 */
export const getRecentTargetDayNumber = (slotIdx) => {
  const now = new Date();
  const kstTimestamp = now.getTime() + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstTimestamp);
  
  const currentUTCDay = kstDate.getUTCDay();
  const currentWeekday = currentUTCDay === 0 ? 6 : currentUTCDay - 1;
  
  let diff = currentWeekday - slotIdx;
  if (diff < 0) diff += 7;
  
  const targetKSTTimestamp = kstTimestamp - (diff * 24 * 60 * 60 * 1000);
  return Math.floor(targetKSTTimestamp / (24 * 60 * 60 * 1000));
};
