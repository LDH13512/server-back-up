// ==========================================
// 🗂️ [SYMBOL REGISTRY] - 전체 심볼 명세서
// ==========================================
const SYMBOL_TYPES = {
  empty: { emoji: '❌', name: '공백', desc: '아무런 수익을 내지 못하는 버리는 공간입니다.', payout: 0, rarity: 'common' },
  coin: { emoji: '🪙', name: '코인', desc: '기본 수익 1코인을 영구 지불합니다.', payout: 1, rarity: 'common' },
  flower: { emoji: '🌸', name: '꽃', desc: '기본 +1코인. 태양(☀️) 옆에 있으면 벌꿀(🍯)을 덱에 제조해 줍니다.', payout: 1, rarity: 'common' },
  cat: { emoji: '🐱', name: '고양이', desc: '인접한 우유(🥛)를 사정없이 먹어치워 +14코인을 획득하고 우유를 파괴합니다.', payout: 2, rarity: 'uncommon' },
  milk: { emoji: '🥛', name: '우유', desc: '고양이가 좋아하고 아기를 무조건 성장시키는 신선한 우유입니다.', payout: 1, rarity: 'common' },
  seed: { emoji: '🌱', name: '씨앗', desc: '기본 +1코인. 태양(☀️)과 인접하면 100% 확률로 확정 진화하며, 난쟁이(🧑‍🌾)와 인접하면 50% 확률로 정성스럽게 재배되어 나무(🌳)로 진화합니다.', payout: 1, rarity: 'common' },
  tree: { emoji: '🌳', name: '나무', desc: '기본 +2코인. 매 스핀 30% 확률로 바나나(🍌)를 생성합니다. 만약 화면에 태양(☀️)이 등장하면 슬롯에 직접 나오지 않더라도 40% 확률로 바나나를 2개씩 원격 생산합니다.', payout: 2, rarity: 'uncommon' },
  banana: { emoji: '🍌', name: '바나나', desc: '원숭이와 고릴라 왕이 가장 좋아하는 음식입니다. 소멸 대상이 되기 쉽습니다.', payout: 1, rarity: 'common' },
  monkey: { emoji: '🐒', name: '원숭이', desc: '인접한 바나나(🍌)를 야무지게 해치워 +12코인을 획득하고 덱에서 삭제합니다. 25% 확률로 바나나 껍질(👣)을 바닥에 떨어트립니다.', payout: 2, rarity: 'uncommon' },
  diamond: { emoji: '💎', name: '다이아몬드', desc: '기본 수익 +5코인. 인접한 다이아몬드끼리 뭉칠수록 개당 +8코인 추가 보너스를 획득합니다.', payout: 5, rarity: 'rare' },
  crab: { emoji: '🦀', name: '꽃게', desc: '인접한 다른 꽃게 1개당 +4코인을 가중시켜 떼를 지을수록 폭발력을 띱니다.', payout: 1, rarity: 'uncommon' },
  beer: { emoji: '🍺', name: '맥주', desc: '기본 보상을 지불합니다. 사람(난쟁이, 광부, 어부)이 마시거나 바커스의 기적으로 와인이 되는 기적의 액체입니다.', payout: 1, rarity: 'uncommon' },
  dwarf: { emoji: '🧑‍🌾', name: '난쟁이', desc: '인접한 맥주(🍺)를 마셔 기본 +12코인(바커스 제물 누적 버프 가산)을 얻고 맥주를 제거합니다. 다른 난쟁이와 인접 시 5% 확률로 아기를 낳습니다.', payout: 2, rarity: 'uncommon' },
  calf: { emoji: '🐂', name: '송아지', desc: '기본 +2코인을 줍니다. 아기 동물로서 매 스핀 시 15%의 확률로 다 자란 소(🐄)로 한 차례 더 성장합니다.', payout: 2, rarity: 'common' },
  cow: { emoji: '🐄', name: '소', desc: '기본 +6코인의 높은 가치를 띱니다. 난쟁이(🧑‍🌾)와 만나거나 슬롯 화면에 등장 시 50% 확률로 우유(🥛)를 신선하게 짜내 덱에 추가해 줍니다.', payout: 6, rarity: 'rare' },
  honey: { emoji: '🍯', name: '벌꿀', desc: '자체 생산 가치 외에 곰돌이의 포식용 타깃이 됩니다.', payout: 1, rarity: 'common' },
  bear: { emoji: '🐻', name: '곰돌이', desc: '인접한 벌꿀(🍯)을 핥아먹으며 자폭 없이 벌꿀만 완전 연소시켜 +12코인을 받습니다.', payout: 2, rarity: 'uncommon' },
  wheat: { emoji: '🌾', name: '밀', desc: '기본 +1코인. 인접한 난쟁이(🧑‍🌾)를 만나면 밀은 소멸하면서 가공 맥주(🍺)를 확정 제조하고 50% 확률로 새로운 밀(🌾)을 덱에 복사합니다. 태양(☀️)과 인접하면 100% 확률로 밀을 2개 생성합니다.', payout: 1, rarity: 'common' },
  sun: { emoji: '☀️', name: '태양', desc: '만물을 비추는 신적 존재! 인접한 식물계 심볼들에게 더 강력한 햇볕 버프(+3코인)를 내려줍니다.', payout: 2, rarity: 'legendary' },
  bomb: { emoji: '💣', name: '폭탄', desc: '인접 무작위 대상 1개를 대폭발시켜 덱에서 파괴 제거하고 +12코인을 안긴 뒤 장렬히 자폭 정리됩니다. 저금통을 터트리면 내부 저축액을 배출시킵니다.', payout: 0, rarity: 'uncommon' },
  purse: { emoji: '👛', name: '동전 지갑', desc: '기본 +1코인. 필드에 깔린 다른 동전(🪙) 1개당 자신의 지불 가치가 영구 버프(+2)를 받습니다.', payout: 1, rarity: 'rare' },
  magnet: { emoji: '🧲', name: '강력 자석', desc: '기본 +1코인. 화면 내 인접하지 않은 곳에 있는 동전들을 자석 주변 빈자리(공백)로 끌어당깁니다. 달라붙은 동전당 +1코인을 받습니다.', payout: 1, rarity: 'uncommon' },
  coin_press: { emoji: '⚙️', name: '주조기', desc: '기본 +1코인. 인접한 곳에 동전(🪙)이 있으면 매 스핀마다 100% 확률로 새로운 동전(🪙)을 무조건 생산해 덱에 영구 추가합니다.', payout: 1, rarity: 'rare' },
  king_midas: { emoji: '👑', name: '미다스 왕', desc: '기본 +3코인. 인접 무작위 심볼 1개를 코인(🪙)으로 영구 연금 변환하고 원본은 덱에서 지웁니다. 변환 성공 시 +15코인을 얻습니다.', payout: 3, rarity: 'legendary' },
  goblin: { emoji: '👺', name: '탐욕스러운 고블린', desc: '기본 +1코인. 인접한 동전(🪙)을 꿀꺽 삼켜 덱에서 지우고 즉시 +6코인으로 변환 지불합니다.', payout: 1, rarity: 'uncommon' },
  golden_chip: { emoji: '🎫', name: '카지노 칩', desc: '기본 +1코인. 인접 배치된 동전(🪙)들의 가치를 각각 +2코인씩 더해주며, 50% 확률로 카지노 칩 자체의 가치가 2배(기본 2코인)로 상승 정산됩니다.', payout: 1, rarity: 'rare' },
  lion: { emoji: '🦁', name: '사자왕', desc: '동물 빌드의 무자비한 지배자! 기본 +4코인. 인접 배치된 모든 동물계 심볼(꽃게 제외) 하나를 확정 사냥하여 소멸시키고 정산금을 +10코인 추가 지불합니다.', payout: 4, rarity: 'legendary' },
  gaia: { emoji: '🧚', name: '가이아', desc: '자연 빌드의 전설! 기본 +3코인. 매 스핀 시 40% 확률로 인접 식물계 심볼(씨앗, 나무, 밀, 꽃) 중 하나를 영구 복제해 덱에 넣고 +10코인을 줍니다.', payout: 3, rarity: 'legendary' },
  bacchus: { emoji: '🍷', name: '바커스', desc: '음료 빌드의 전설! 기본 +3코인. 주변에 난쟁이와 맥주가 함께 모이면 맥주 하나를 제물로 삼아 난쟁이의 맥주 정산금을 영구히 +10코인씩 중첩 증가시킵니다. 매 스핀 시작 시 1% 확률로 화면의 맥주를 와인으로 강제 변환합니다.', payout: 3, rarity: 'legendary' },
  
  // ⚙️ [문구 패치 완결] 유저 요청안에 맞춰 동굴 설명구 수정 완료
  cave: { emoji: '🕳️', name: '동굴', desc: '기본 +2코인을 줍니다.광부(👷)와 인접했을 때 각각 50%확률로 다이아몬드 혹은 폭탄을 채굴합니다.', payout: 2, rarity: 'uncommon' },
  
  gem_giant: { emoji: '🗿', name: '보석 거인', desc: '다이아몬드 빌드의 전설! 기본 +4코인. 인접 다이아몬드(💎) 하나당 +10코인의 파워 버프를 주며, 필드 내의 다이아몬드 개수당 +4코인을 영구 지불합니다.', payout: 4, rarity: 'legendary' },
  mermaid: { emoji: '🧜‍♀️', name: '인어공주', desc: '꽃게 빌드의 전설! 기본 +3코인. 자신과 인접한 꽃게(🦀) 하나당 가치를 +3코인씩 강화시키며, 인접 꽃게와 교감 시 30% 확률로 새로운 꽃게(🦀)를 덱에 산란합니다.', payout: 3, rarity: 'legendary' },
  fish_trap: { emoji: '🧺', name: '통발', desc: '기본 +1코인. 인접한 난쟁이(🧑‍🌾)가 있으면 통발은 사라지고 난쟁이를 어부(🎣)로 영구 전직시킵니다.', payout: 1, rarity: 'common' },
  fisherman: { emoji: '🎣', name: '어부', desc: '기본 +3코인. 슬롯 화면에 등판 시 20% 확률로 화면 안의 빈칸(❌)에 즉시 꽃게(🦀)를 낚아올려 물리 배치하고 덱에 추가합니다. 인접한 맥주(🍺)를 들이켜 +12코인을 획득하고 소멸시킵니다.', payout: 3, rarity: 'rare' },
  venus: { emoji: '👩', name: '비너스', desc: '사랑의 여신입니다. 기본 +3코인. 화면에 비너스가 존재하면 필드의 모든 난쟁이, 어부, 광부가 주변에 파트너가 없어도 무조건 3% 확률로 아기(👶)를 출산하도록 축복합니다.', payout: 3, rarity: 'legendary' },
  gorilla: { emoji: '🦍', name: '고릴라 왕', desc: '바나나 빌드의 전설적 포식자! 기본 +4코인. 화면 전체에 깔린 모든 바나나(🍌)를 소모하거나 없애지 않고 개당 무려 +12코인씩 배당금으로 쓸어 담으며, 자신과 인접한 모든 바나나 껍질(👣)을 무조건 일반 바나나(🍌)로 되돌려 덱에 부활시킵니다.', payout: 4, rarity: 'legendary' },
  piggy_bank: { emoji: '🐷', name: '돼지 저금통 (0)', desc: '기본 +1코인. 슬롯 보드에서 동전(🪙)과 인접할 때마다 저장된 동전 값이 두 배씩 증식합니다. 폭탄(💣)이나 광부(👷)에 파괴되면 누적 저축액을 정산 배출합니다.', payout: 1, rarity: 'uncommon' },
  baby: { emoji: '👶', name: '아기', desc: '기본 +1코인. 성장 가능성이 무궁무진한 아기입니다. 우유(🥛)를 만나면 확정 전직하며 일반 상태에선 화면 등장 시 50% 확률로 난쟁이(🧑‍🌾)로 진화하고 백그라운드 덱 내부에서 매 스핀 0.01% 확률로 국왕 각성합니다.', payout: 1, rarity: 'common' },
  banana_peel: { emoji: '👣', name: '바나나 껍질', desc: '기본 +2코인. 인접한 일반 사람 심볼(난쟁이, 어부, 탐욕스러운 고블린, 광부)을 즉시 미끄러트려 필드와 덱에서 함께 소멸시키며 사망 보험금 +10코인을 획득합니다. (왕이나 거인 제외)', payout: 2, rarity: 'uncommon' },
  pickaxe: { emoji: '⛏️', name: '곡괭이', desc: '기본 +1코인. 인접한 난쟁이(🧑‍🌾)가 있으면 곡괭이는 사라지고 난쟁이를 광부(👷)로 영구 전직시킵니다.', payout: 1, rarity: 'common' },
  miner: { emoji: '👷', name: '광부', desc: '기본 +2코인. 동굴(🕳️)과 인접 시 50% 확률로 다이아몬드, 50% 확률로 폭탄을 채굴합니다. 인접한 맥주(🍺)를 마셔 보너스를 얻으며 돼지 저금통을 발견하면 파괴합니다.', payout: 2, rarity: 'rare' },
  wine: { emoji: '🍾', name: '와인', desc: '기본 +3코인. [SPECIAL 등급] 인접 배치된 난쟁이(🧑‍🌾)가 존재할 경우, 해당 난쟁이를 술의 신 바커스(🍷)로 각성 진화시키고 소멸합니다.', payout: 3, rarity: 'special' }
};

// ==========================================
// 🧠 [BACKGROUND SPIN ENGINE HOOK] - 스핀 감지 코어
// ==========================================
function runGlobalPerSpinCheck(sys, itemsToAdd) {
  const { state, cardWidth, cardHeight } = sys;
  const spinKey = `${state.stage}_${state.spinsRemaining}_${state.totalCoinsEarned}`;
  const ROWS = 4; const COLS = 5;
  
  SYMBOL_TYPES.piggy_bank.name = `돼지 저금통 (${state.piggySavings || 0})`;

  if (state._lastGlobalSpinKey === spinKey) return;
  state._lastGlobalSpinKey = spinKey;

  const hasBacchus = state.grid.some(row => row.some(cell => cell.id === 'bacchus'));
  if (hasBacchus) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.grid[r][c].id === 'beer' && Math.random() < 0.01) {
          state.grid[r][c].id = 'wine';
          state.grid[r][c].winHighlight = true;
          
          const bIdx = state.deck.indexOf('beer');
          if (bIdx > -1) state.deck.splice(bIdx, 1);
          itemsToAdd.push('wine');
          
          sys.spawnFloatingText("바커스의 기적: 와인 탄생! 🍾", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#a855f7');
          sys.sound.playHatch();
        }
      }
    }
  }

  if (state.deck && state.deck.length > 0) {
    for (let i = 0; i < state.deck.length; i++) {
      if (state.deck[i] === 'baby' && Math.random() < 0.0001) {
        state.deck[i] = 'king_midas';
        sys.spawnFloatingText("DECK BABY AWAKENS AS MIDAS! 👑", cardWidth * 2.5, cardHeight * 2, '#fbbf24');
        sys.sound.playHatch();
      }
    }
  }

  const hasSun = state.grid.some(row => row.some(cell => cell.id === 'sun'));
  if (hasSun && state.deck) {
    let treeCount = state.deck.filter(id => id === 'tree').length;
    let totalBananasSpawned = 0;
    
    for (let i = 0; i < treeCount; i++) {
      if (Math.random() < 0.40) {
        itemsToAdd.push('banana', 'banana');
        totalBananasSpawned += 2;
      }
    }
    if (totalBananasSpawned > 0) {
      sys.spawnFloatingText(`SOLAR GROWTH! +${totalBananasSpawned} 🍌`, cardWidth * 2.5, cardHeight * 1.5, '#22c55e');
      sys.sound.playHatch();
    }
  }
}

// ==========================================
// 🤝 [DECLARATIVE SYNERGY RULES] - 결합 로직 엔진
// ==========================================
const SYNERGY_RULES = [
  { id: 'global_hook_empty', type: 'CUSTOM', trigger: 'empty', execute: (r, c, adjs, rm, add, sys) => { runGlobalPerSpinCheck(sys, add); return 0; } },
  { id: 'global_hook_coin', type: 'CUSTOM', trigger: 'coin', execute: (r, c, adjs, rm, add, sys) => { runGlobalPerSpinCheck(sys, add); return 0; } },

  { id: 'cat_eat_milk', type: 'CONSUME', trigger: 'cat', target: 'milk', bonus: 14, message: 'EAT MILK! +14 🥛', sound: 'eat', color: '#38bdf8' },
  { id: 'fisherman_drink_beer', type: 'CONSUME', trigger: 'fisherman', target: 'beer', bonus: 12, message: 'DRINK BEER! +12 🍺', sound: 'eat', color: '#f97316' },
  { id: 'miner_drink_beer', type: 'CONSUME', trigger: 'miner', target: 'beer', bonus: 12, message: 'DRINK BEER! +12 🍺', sound: 'eat', color: '#f97316' },
  { id: 'bear_eat_honey', type: 'CONSUME', trigger: 'bear', target: 'honey', bonus: 12, message: 'EAT HONEY! +12 🍯', sound: 'eat', color: '#facc15' },
  { id: 'calf_grow', type: 'TRANSFORM', trigger: 'calf', into: 'cow', chance: 0.15, message: 'GROW TO COW! 🐄', sound: 'hatch', color: '#a855f7' },
  { id: 'crab_stack', type: 'ADJACENT_BUFF', trigger: 'crab', target: 'crab', multiplier: 4, message: 'CRAB CLAN 🦀', color: '#f87171' },
  { id: 'baby_grow_dwarf', type: 'TRANSFORM', trigger: 'baby', into: 'dwarf', chance: 0.50, message: 'GROW TO DWARF! 🧑‍🌾', sound: 'hatch', color: '#f43f5e' },

  {
    id: 'dwarf_drink_beer_custom',
    type: 'CUSTOM',
    trigger: 'dwarf',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const beerTarget = adjs.find(a => a.id === 'beer' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      if (beerTarget) {
        itemsToRemove.push(`${beerTarget.r}_${beerTarget.c}`);
        sys.state.grid[beerTarget.r][beerTarget.c].winHighlight = true;
        sys.sound.playEat();
        
        const totalDwarfEarn = 12 + (state.dwarfBeerBonus || 0);
        sys.spawnFloatingText(`DRINK BEER! +${totalDwarfEarn} 🍺`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f97316');
        return totalDwarfEarn;
      }
      return 0;
    }
  },
  {
    id: 'monkey_eat_banana',
    type: 'CUSTOM',
    trigger: 'monkey',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      runGlobalPerSpinCheck(sys, itemsToAdd);
      const { state, cardWidth, cardHeight } = sys;
      const targetFood = adjs.find(a => state.grid[a.r][a.c].id === 'banana');
      
      if (targetFood) {
        state.grid[targetFood.r][targetFood.c].winHighlight = true;
        sys.sound.playEat();
        
        const bIdx = state.deck.indexOf('banana');
        if (bIdx > -1) {
          state.deck.splice(bIdx, 1);
        }
        
        let txt = 'EAT BANANA! +12 🍌';
        if (Math.random() < 0.25) {
          state.grid[targetFood.r][targetFood.c].id = 'banana_peel';
          itemsToAdd.push('banana_peel');
          txt = 'DROPPED PEEL! +12 🍌👣';
        } else {
          state.grid[targetFood.r][targetFood.c].id = 'empty'; 
        }
        
        sys.spawnFloatingText(txt, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#eab308');
        return 12;
      }
      return 0;
    }
  },
  {
    id: 'banana_peel_slip',
    type: 'CUSTOM',
    trigger: 'banana_peel',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      runGlobalPerSpinCheck(sys, itemsToAdd);
      const { cardWidth, cardHeight, state, updateDestructionLogUI } = sys;
      const humans = ['dwarf', 'fisherman', 'goblin', 'miner']; 
      const victim = adjs.find(a => humans.includes(a.id) && !itemsToRemove.includes(`${a.r}_${a.c}`));
      
      if (victim) {
        itemsToRemove.push(`${victim.r}_${victim.c}`);
        itemsToRemove.push(`${r}_${c}`);
        state.grid[victim.r][victim.c].winHighlight = true;
        
        const targetSym = SYMBOL_TYPES[victim.id] || SYMBOL_TYPES['empty'];
        state.destroyedByBombs.unshift({ emoji: targetSym.emoji, name: `${targetSym.name} (미끄러짐)`, timestamp: Date.now() });
        if (state.destroyedByBombs.length > 3) state.destroyedByBombs.pop();
        
        updateDestructionLogUI();
        
        sys.spawnFloatingText("HUMAN SLIPPED! +10 👣💥", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f43f5e');
        sys.sound.playExplosion();
        sys.createExplosionParticles(victim.c * cardWidth + cardWidth/2, victim.r * cardHeight + cardHeight/2, 12);
        return 10;
      }
      return 0;
    }
  },
  {
    id: 'baby_evolution',
    type: 'CUSTOM',
    trigger: 'baby',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      runGlobalPerSpinCheck(sys, itemsToAdd);
      const { cardWidth, cardHeight } = sys;
      
      const milkTarget = adjs.find(a => a.id === 'milk' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      if (milkTarget) {
        itemsToRemove.push(`${milkTarget.r}_${milkTarget.c}`); 
        itemsToRemove.push(`${r}_${c}`); 
        itemsToAdd.push('dwarf'); 
        sys.spawnFloatingText("BABY DRINKS MILK! -> DWARF! +10 🥛👶", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f43f5e');
        sys.sound.playHatch();
        return 10; 
      }

      if (Math.random() < 0.50) {
        itemsToRemove.push(`${r}_${c}`);
        itemsToAdd.push('dwarf');
        sys.spawnFloatingText("GROW TO DWARF! 🧑‍🌾", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f43f5e');
        sys.sound.playHatch();
      }
      return 0;
    }
  },
  {
    id: 'dwarf_breeding',
    type: 'CUSTOM',
    trigger: 'dwarf',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const isVenusPresent = state.grid.some(row => row.some(cell => cell.id === 'venus'));
      const hasPhysicalPartner = adjs.some(a => a.id === 'dwarf'); 
      const breedChance = isVenusPresent ? 0.03 : 0.05; 
      
      if ((hasPhysicalPartner || isVenusPresent) && Math.random() < breedChance) {
        itemsToAdd.push('baby');
        const textMsg = (!hasPhysicalPartner && isVenusPresent) ? "VENUS BLESS! +5 👶" : "MAKE A BABY! +5 👶";
        sys.spawnFloatingText(textMsg, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ec4899');
        sys.sound.playHatch();
        return 5;
      }
      return 0;
    }
  },
  {
    id: 'fisherman_breeding',
    type: 'CUSTOM',
    trigger: 'fisherman',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const isVenusPresent = state.grid.some(row => row.some(cell => cell.id === 'venus'));
      const breedChance = isVenusPresent ? 0.03 : 0.00; 
      
      if (isVenusPresent && Math.random() < breedChance) {
        itemsToAdd.push('baby');
        sys.spawnFloatingText("VENUS BLESS! +5 👶", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ec4899');
        sys.sound.playHatch();
        return 5;
      }
      return 0;
    }
  },
  {
    id: 'fisherman_fishing',
    type: 'CUSTOM',
    trigger: 'fisherman',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, ROWS, COLS, cardWidth, cardHeight } = sys;
      if (Math.random() < 0.20) { 
        let targetCell = adjs.find(a => a.id === 'empty');
        if (!targetCell) {
          const allEmpties = [];
          for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
              if (state.grid[row][col].id === 'empty') allEmpties.push({ r: row, c: col });
            }
          }
          if (allEmpties.length > 0) targetCell = allEmpties[Math.floor(Math.random() * allEmpties.length)];
        }
        if (targetCell) {
          state.grid[targetCell.r][targetCell.c].id = 'crab';
          state.grid[targetCell.r][targetCell.c].winHighlight = true;
          itemsToAdd.push('crab');
          sys.spawnFloatingText("FISHED CRAB TO SCREEN! 🦀", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f87171');
          sys.sound.playHatch();
          sys.createExplosionParticles(targetCell.c * cardWidth + cardWidth/2, targetCell.r * cardHeight + cardHeight/2, 8);
        } else {
          itemsToAdd.push('crab');
          sys.spawnFloatingText("CAUGHT CRAB TO DECK! 🦀", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ef4444');
          sys.sound.playCoin(); 
        }
      }
      return 0;
    }
  },
  {
    id: 'seed_growth',
    type: 'CUSTOM',
    trigger: 'seed',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      runGlobalPerSpinCheck(sys, itemsToAdd);
      const { cardWidth, cardHeight } = sys;
      const hasSun = adjs.some(a => a.id === 'sun');
      const hasDwarf = adjs.some(a => a.id === 'dwarf');
      let shouldGrow = false;
      let floatingMsg = "";
      
      if (hasSun) {
        shouldGrow = true;
        floatingMsg = "PHOTOSYNTHESIS TO TREE! 🌳";
      } else if (hasDwarf && Math.random() < 0.50) {
        shouldGrow = true;
        floatingMsg = "FARMING SEED TO TREE! 🌳";
      }
      
      if (shouldGrow) {
        itemsToRemove.push(`${r}_${c}`);
        itemsToAdd.push('tree'); 
        sys.spawnFloatingText(floatingMsg, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#4ade80');
        sys.sound.playHatch();
      }
      return 0;
    }
  },
  {
    id: 'tree_fruiting',
    type: 'CUSTOM',
    trigger: 'tree',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { cardWidth, cardHeight } = sys;
      const hasSun = sys.state.grid.some(row => row.some(cell => cell.id === 'sun'));
      
      if (!hasSun) {
        itemsToAdd.push('banana');
        sys.spawnFloatingText("AUTO BANANA! 🍌", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#eab308');
        sys.sound.playCoin();
      }
      return 0;
    }
  },
  {
    id: 'cow_milking',
    type: 'CUSTOM',
    trigger: 'cow',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { cardWidth, cardHeight } = sys;
      const hasDwarf = adjs.some(a => a.id === 'dwarf');
      const selfChance = Math.random() < 0.50;
      
      if (hasDwarf || selfChance) {
        itemsToAdd.push('milk');
        const reason = hasDwarf ? "MILKING! 🥛" : "AUTO MILK! 🥛";
        sys.spawnFloatingText(reason, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ffffff');
        sys.sound.playCoin();
      }
      return 0;
    }
  },
  {
    id: 'gorilla_feast',
    type: 'CUSTOM',
    trigger: 'gorilla',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, ROWS, COLS, cardWidth, cardHeight } = sys;
      
      const peelTargets = adjs.filter(a => a.id === 'banana_peel');
      peelTargets.forEach(p => {
        state.grid[p.r][p.c].id = 'banana'; 
        state.grid[p.r][p.c].winHighlight = true;
        
        const pkIdx = state.deck.indexOf('banana_peel');
        if (pkIdx > -1) state.deck.splice(pkIdx, 1);
        itemsToAdd.push('banana');
      });
      
      if (peelTargets.length > 0) {
        sys.spawnFloatingText(`왕의 수거: 바나나 부활! +${peelTargets.length} 🍌`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f59e0b');
        sys.sound.playHatch();
      }

      let bananaCount = 0;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (state.grid[row][col].id === 'banana') {
            bananaCount++;
            state.grid[row][col].winHighlight = true;
          }
        }
      }
      if (bananaCount > 0) {
        sys.spawnFloatingText(`GORILLA FEAST! +${bananaCount * 12} 🦍`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f59e0b');
        sys.sound.playCoin();
        return bananaCount * 12;
      }
      return 0;
    }
  },
  {
    id: 'piggy_bank_save',
    type: 'CUSTOM',
    trigger: 'piggy_bank',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      runGlobalPerSpinCheck(sys, itemsToAdd);
      const { state, cardWidth, cardHeight } = sys;
      const adjacentCoins = adjs.filter(a => a.id === 'coin').length;
      
      if (adjacentCoins > 0) {
        for (let i = 0; i < adjacentCoins; i++) {
          if (!state.piggySavings || state.piggySavings === 0) {
            state.piggySavings = 1;
          } else {
            state.piggySavings *= 2;
          }
        }
        SYMBOL_TYPES.piggy_bank.name = `돼지 저금통 (${state.piggySavings})`;
        sys.spawnFloatingText(`PIGGY MULTIPLY! (누적: ${state.piggySavings}🪙)`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#facc15');
      }
      return 0;
    }
  },
  {
    id: 'wheat_brewing',
    type: 'CUSTOM',
    trigger: 'wheat',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { cardWidth, cardHeight } = sys;
      const hasDwarf = adjs.some(a => a.id === 'dwarf');
      const hasSun = adjs.some(a => a.id === 'sun');
      
      if (hasSun) {
        itemsToAdd.push('wheat', 'wheat'); 
        sys.spawnFloatingText("SUNLIGHT WHEAT MULTIPLY! +2 🌾", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#4ade80');
      }

      if (hasDwarf) {
        itemsToRemove.push(`${r}_${c}`); 
        itemsToAdd.push('beer');         
        
        let floatingTxt = "BREWING BEER! 🍺";
        if (Math.random() < 0.50) {
          itemsToAdd.push('wheat');
          floatingTxt = "BREWING & DOUBLE WHEAT! 🍺🌾";
        }
        
        sys.spawnFloatingText(floatingTxt, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f97316');
        sys.sound.playCoin();
      }
      return 0;
    }
  },
  {
    id: 'sunlight_buff',
    type: 'CUSTOM',
    trigger: 'sun',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const targetPlants = adjs.filter(a => ['seed', 'tree', 'wheat', 'flower'].includes(a.id));
      if (targetPlants.length > 0) {
        targetPlants.forEach(p => { state.grid[p.r][p.c].winHighlight = true; });
        sys.spawnFloatingText(`SUNLIGHT! +${targetPlants.length * 3} ☀️`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#eab308');
        return targetPlants.length * 3;
      }
      return 0;
    }
  },
  {
    id: 'goblin_eat_coin',
    type: 'CUSTOM',
    trigger: 'goblin',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const coinTarget = adjs.find(a => a.id === 'coin' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      if (coinTarget) {
        itemsToRemove.push(`${coinTarget.r}_${coinTarget.c}`); state.grid[coinTarget.r][coinTarget.c].winHighlight = true;
        sys.spawnFloatingText("STEAL COIN! +6 🪙", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#eab308'); sys.sound.playEat();
        return 6;
      }
      return 0;
    }
  },
  {
    id: 'lion_beast_buff',
    type: 'CUSTOM',
    trigger: 'lion',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const preyAnimals = adjs.filter(a => ['cat', 'monkey', 'calf', 'cow', 'bear'].includes(a.id) && !itemsToRemove.includes(`${a.r}_${a.c}`));
      
      if (preyAnimals.length > 0) {
        const targetVictim = preyAnimals[Math.floor(Math.random() * preyAnimals.length)];
        itemsToRemove.push(`${targetVictim.r}_${targetVictim.c}`); 
        state.grid[targetVictim.r][targetVictim.c].winHighlight = true;
        
        sys.spawnFloatingText("LION FEAST HUNTER! +10 🦁🍖", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f97316');
        sys.sound.playEat();
        sys.createExplosionParticles(targetVictim.c * cardWidth + cardWidth/2, targetVictim.r * cardHeight + cardHeight/2, 10);
        return 10; 
      }
      return 0;
    }
  },
  {
    id: 'bacchus_festival',
    type: 'CUSTOM',
    trigger: 'bacchus',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const hasDwarf = adjs.some(a => a.id === 'dwarf');
      
      if (hasDwarf) {
        const beerTarget = adjs.find(a => a.id === 'beer' && !itemsToRemove.includes(`${a.r}_${a.c}`));
        if (beerTarget) {
          itemsToRemove.push(`${beerTarget.r}_${beerTarget.c}`);
          sys.state.grid[beerTarget.r][beerTarget.c].winHighlight = true;
          
          state.dwarfBeerBonus = (state.dwarfBeerBonus || 0) + 10;
          
          const dwarfTarget = adjs.find(a => a.id === 'dwarf');
          if (dwarfTarget) sys.state.grid[dwarfTarget.r][dwarfTarget.c].winHighlight = true;
          sys.state.grid[r][c].winHighlight = true;

          sys.spawnFloatingText(`바커스 제물 수용! 난쟁이 주량 영구 강화 (+10) 🍷🍺`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ec4899'); 
          sys.sound.playHatch(); 
          return 0; 
        }
      }
      return 0;
    }
  },
  {
    id: 'mermaid_synergy',
    type: 'CUSTOM',
    trigger: 'mermaid',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const MathChance = Math.random() < 0.30;
      const adjacentCrabs = adjs.filter(a => a.id === 'crab');
      adjacentCrabs.forEach(p => { state.grid[p.r][p.c].winHighlight = true; });
      
      if (adjacentCrabs.length > 0 && MathChance) {
        itemsToAdd.push('crab'); 
        sys.spawnFloatingText("CRAB SPAWNING! 🦀", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f87171'); 
        sys.sound.playHatch();
      } 
      
      const adjacentCrabBonus = adjacentCrabs.length * 3;
      if (adjacentCrabBonus > 0) {
        sys.spawnFloatingText("MERMAID NEIGHBOR BUFF! +" + adjacentCrabBonus + " 🦀", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#f87171'); 
        sys.sound.playCoin();
        return adjacentCrabBonus;
      }
      return 0;
    }
  },
  {
    id: 'gem_giant_synergy',
    type: 'CUSTOM',
    trigger: 'gem_giant',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, ROWS, COLS, cardWidth, cardHeight } = sys;
      const adjacentDiamonds = adjs.filter(a => a.id === 'diamond');
      adjacentDiamonds.forEach(p => { state.grid[p.r][p.c].winHighlight = true; });
      let totalDiamonds = 0;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) { 
          if (state.grid[row][col].id === 'diamond') { 
            totalDiamonds++; 
            state.grid[row][col].winHighlight = true; 
          } 
        }
      }
      const totalBonus = (adjacentDiamonds.length * 10) + (totalDiamonds * 4);
      if (totalBonus > 0) { 
        sys.spawnFloatingText("GEM RESONANCE! +" + totalBonus + " 💎", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#67e8f9'); 
        sys.sound.playCoin(); 
      }
      return totalBonus;
    }
  },
  {
    id: 'midas_touch',
    type: 'CUSTOM',
    trigger: 'king_midas',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const transformable = adjs.filter(a => a.id !== 'empty' && a.id !== 'coin' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      
      if (transformable.length > 0) {
        const target = transformable[Math.floor(Math.random() * transformable.length)];
        const originalId = target.id; 
        
        state.grid[target.r][target.c].id = 'coin';
        state.grid[target.r][target.c].winHighlight = true;
        
        const idx = state.deck.indexOf(originalId);
        if (idx > -1) {
          state.deck.splice(idx, 1);
        }
        
        itemsToAdd.push('coin');
        
        sys.spawnFloatingText("MIDAS TOUCH! +15 🪙👑", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#fbbf24');
        sys.sound.playCoin();
        return 15;
      }
      return 0;
    }
  },
  {
    id: 'miner_mining',
    type: 'CUSTOM',
    trigger: 'miner',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight, updateDestructionLogUI } = sys;
      const caveTarget = adjs.find(a => a.id === 'cave');
      const piggyTarget = adjs.find(a => a.id === 'piggy_bank' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      let totalGoldFromMines = 0;
      
      if (piggyTarget) {
        itemsToRemove.push(`${piggyTarget.r}_${piggyTarget.c}`); 
        state.grid[r][c].winHighlight = true;
        state.grid[piggyTarget.r][piggyTarget.c].winHighlight = true;
        
        const piggyPayout = (state.piggySavings || 0);
        state.piggySavings = 0; 
        SYMBOL_TYPES.piggy_bank.name = `돼지 저금통 (0)`;
        
        state.destroyedByBombs.unshift({ emoji: '🐷', name: '돼지 저금통 (광부 파괴)', timestamp: Date.now() });
        if (state.destroyedByBombs.length > 3) state.destroyedByBombs.pop();
        updateDestructionLogUI();
        
        sys.spawnFloatingText(`👷🔨 저금통 광산 정산! +${piggyPayout}`, piggyTarget.c * cardWidth + cardWidth/2, piggyTarget.r * cardHeight + 20, '#facc15');
        sys.sound.playExplosion();
        sys.createExplosionParticles(piggyTarget.c * cardWidth + cardWidth/2, piggyTarget.r * cardHeight + cardHeight/2, 8);
        totalGoldFromMines += piggyPayout;
      }
      
      if (caveTarget) {
        state.grid[r][c].winHighlight = true;
        state.grid[caveTarget.r][caveTarget.c].winHighlight = true;
        
        const rand = Math.random();
        if (rand < 0.50) { 
          itemsToAdd.push('diamond');
          sys.spawnFloatingText("광부 고급 다이아 채굴! 💎👷", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#a5f3fc');
          sys.sound.playCoin();
        } else { 
          itemsToAdd.push('bomb');
          sys.spawnFloatingText("화약 폭탄 발굴! 💣👷", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ef4444');
          sys.sound.playExplosion();
        }
      }
      return totalGoldFromMines;
    }
  },
  {
    id: 'miner_breeding_venus',
    type: 'CUSTOM',
    trigger: 'miner',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const isVenusPresent = state.grid.some(row => row.some(cell => cell.id === 'venus'));
      if (isVenusPresent && Math.random() < 0.03) { 
        itemsToAdd.push('baby');
        sys.spawnFloatingText("비너스의 축복! 광부 출산 +5 👶👷", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ec4899');
        sys.sound.playHatch();
        return 5;
      }
      return 0;
    }
  },
  {
    id: 'wine_transmutation',
    type: 'CUSTOM',
    trigger: 'wine',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const dwarfTarget = adjs.find(a => a.id === 'dwarf' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      
      if (dwarfTarget) {
        state.grid[dwarfTarget.r][dwarfTarget.c].id = 'bacchus'; 
        state.grid[dwarfTarget.r][dwarfTarget.c].winHighlight = true;
        state.grid[r][c].winHighlight = true;
        
        const dIdx = state.deck.indexOf('dwarf');
        if (dIdx > -1) state.deck.splice(dIdx, 1);
        itemsToAdd.push('bacchus');
        
        sys.spawnFloatingText("난쟁이가 주신 바커스로 대각성! 🍾->🍷", dwarfTarget.c * cardWidth + cardWidth/2, dwarfTarget.r * cardHeight + 20, '#ec4899');
        sys.sound.playHatch();
        sys.createExplosionParticles(dwarfTarget.c * cardWidth + cardWidth/2, dwarfTarget.r * cardHeight + cardHeight/2, 8);
      }
      return 0;
    }
  },
  {
    id: 'golden_chip_bonus',
    type: 'CUSTOM',
    trigger: 'golden_chip',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      
      let chipBasePayout = 1;
      let isJackpotDoubled = false;
      
      if (Math.random() < 0.50) {
        chipBasePayout = 2;
        isJackpotDoubled = true;
      }
      
      const adjacentCoins = adjs.filter(a => a.id === 'coin');
      if (adjacentCoins.length > 0) {
        adjacentCoins.forEach(p => { state.grid[p.r][p.c].winHighlight = true; });
      }
      
      const totalCustomBonus = (isJackpotDoubled ? 1 : 0) + (adjacentCoins.length * 2);
      
      if (isJackpotDoubled || adjacentCoins.length > 0) {
        const floatMessage = isJackpotDoubled 
          ? `🎰 칩 잭팟 2배 돌파! +${totalCustomBonus + 1} 🎫` 
          : `카지노 배당 연산! +${totalCustomBonus + 1} 🎫`;
        sys.spawnFloatingText(floatMessage, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#fbbf24');
        sys.sound.playCoin();
      }
      return totalCustomBonus; 
    }
  },
  {
    id: 'bomb_explosion',
    type: 'CUSTOM',
    trigger: 'bomb',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight, updateDestructionLogUI } = sys;
      
      const validTargets = adjs.filter(a => state.grid[a.r][a.c].id !== 'empty' && state.grid[a.r][a.c].id !== 'bomb');
      
      if (validTargets.length > 0) {
        const target = validTargets[Math.floor(Math.random() * validTargets.length)];
        const targetId = state.grid[target.r][target.c].id; 
        
        state.grid[target.r][target.c].winHighlight = true;
        state.grid[r][c].winHighlight = true;
        
        const targetSym = SYMBOL_TYPES[targetId] || SYMBOL_TYPES['empty'];
        state.destroyedByBombs.unshift({ emoji: targetSym.emoji, name: targetSym.name, timestamp: Date.now() });
        if (state.destroyedByBombs.length > 3) state.destroyedByBombs.pop();
        updateDestructionLogUI();

        let bombScore = 12;
        
        if (targetId === 'piggy_bank') {
          const piggyPayout = (state.piggySavings || 0);
          state.piggySavings = 0;
          SYMBOL_TYPES.piggy_bank.name = `돼지 저금통 (0)`;
          bombScore += piggyPayout;
          sys.spawnFloatingText(`🐷💣 저금통 폭파 정산! +${piggyPayout}`, target.c * cardWidth + cardWidth/2, target.r * cardHeight + 20, '#facc15');
        } else {
          sys.spawnFloatingText(`💣💥 폭파 성공! ${targetSym.emoji || ''} 제거 +12`, c * cardWidth + cardWidth/2, r * cardHeight + 20, '#ef4444');
        }
        
        const tIdx = state.deck.indexOf(targetId);
        if (tIdx > -1) state.deck.splice(tIdx, 1);
        
        const bIdx = state.deck.indexOf('bomb');
        if (bIdx > -1) state.deck.splice(bIdx, 1);
        
        state.grid[target.r][target.c].id = 'empty';
        state.grid[r][c].id = 'empty';
        
        sys.sound.playExplosion();
        sys.createExplosionParticles(target.c * cardWidth + cardWidth/2, target.r * cardHeight + cardHeight/2);
        sys.createExplosionParticles(c * cardWidth + cardWidth/2, r * cardHeight + cardHeight/2);
        
        return bombScore;
      }
      return 0;
    }
  },
  { id: 'diamond_stack', type: 'ADJACENT_BUFF', trigger: 'diamond', target: 'diamond', multiplier: 8, message: 'DIAMOND CLUSTER! +8 💎', color: '#a5f3fc' },
  {
    id: 'fish_trap_promotion',
    type: 'CUSTOM',
    trigger: 'fish_trap',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const dwarfTarget = adjs.find(a => a.id === 'dwarf' && !itemsToRemove.includes(`${a.r}_${a.c}`));
      
      if (dwarfTarget) {
        itemsToRemove.push(`${r}_${c}`); 
        state.grid[dwarfTarget.r][dwarfTarget.c].id = 'fisherman';
        state.grid[dwarfTarget.r][dwarfTarget.c].winHighlight = true;
        
        const dIdx = state.deck.indexOf('dwarf');
        if (dIdx > -1) { state.deck.splice(dIdx, 1); }
        itemsToAdd.push('fisherman');
        
        sys.spawnFloatingText("어부 전직! 🎣", dwarfTarget.c * cardWidth + cardWidth/2, dwarfTarget.r * cardHeight + 20, '#38bdf8');
        sys.sound.playHatch();
        sys.createExplosionParticles(dwarfTarget.c * cardWidth + cardWidth/2, dwarfTarget.r * cardHeight + cardHeight/2, 6);
      }
      return 0;
    }
  },
  {
    id: 'pickaxe_promotion',
    type: 'CUSTOM',
    trigger: 'pickaxe',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { state, cardWidth, cardHeight } = sys;
      const dwarfTarget = adjs.find(a => a.id === 'dwarf' && !itemsToRemove.includes(`${a.r}_${a.c}`));

      if (dwarfTarget) {
        itemsToRemove.push(`${r}_${c}`); 
        state.grid[dwarfTarget.r][dwarfTarget.c].id = 'miner'; 
        state.grid[dwarfTarget.r][dwarfTarget.c].winHighlight = true;

        const dIdx = state.deck.indexOf('dwarf');
        if (dIdx > -1) { state.deck.splice(dIdx, 1); }
        itemsToAdd.push('miner');

        sys.spawnFloatingText("광부 전직 완료! ⛏️👷", dwarfTarget.c * cardWidth + cardWidth/2, dwarfTarget.r * cardHeight + 20, '#f59e0b');
        sys.sound.playHatch();
        sys.createExplosionParticles(dwarfTarget.c * cardWidth + cardWidth/2, dwarfTarget.r * cardHeight + cardHeight/2, 6);
      }
      return 0;
    }
  },
  {
    id: 'coin_press_copy',
    type: 'CUSTOM',
    trigger: 'coin_press',
    execute: (r, c, adjs, itemsToRemove, itemsToAdd, sys) => {
      const { cardWidth, cardHeight } = sys;
      const hasCoin = adjs.some(a => a.id === 'coin');
      if (hasCoin) { 
        itemsToAdd.push('coin'); 
        sys.spawnFloatingText("PRESS COIN! 🪙⚙️", c * cardWidth + cardWidth/2, r * cardHeight + 20, '#fbbf24'); 
        sys.sound.playCoin();
      }
      return 0;
    }
  }
];

export { SYMBOL_TYPES, SYNERGY_RULES };