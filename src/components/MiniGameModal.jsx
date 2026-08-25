import React, { useState, useEffect, useMemo } from 'react';
import { X, Gamepad2 } from 'lucide-react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { minigameApp, minigameDb } from '../config/firebase';

// 🎯 중앙 제어소의 단일 선택 함수를 사용해 표시와 초기화 대상이 항상 같게 합니다.
import { getGameForDayNumber, getRecentTargetDayNumber } from '../config/minigames';
import { calculateRhythmKing, RHYTHM_KING_MIN_SONGS } from '../utils/rhythmKing';

// 🎨 자동 로테이션 슬롯 고정 테마 색상 (월~일 순서대로 7개 지정)
const SLOT_COLORS = [
  'bg-[#008081]', // 1번째 슬롯 (월 - 청록)
  'bg-rose-500',  // 2번째 슬롯 (화 - 장미)
  'bg-amber-500', // 3번째 슬롯 (수 - 골드)
  'bg-[#3F51B5]', // 4번째 슬롯 (목 - 인디고)
  'bg-[#8B5CF6]', // 5번째 슬롯 (금 - 보라)
  'bg-[#34C759]', // 6번째 슬롯 (토 - 연두)
  'bg-[#03A9F4]'  // 7번째 슬롯 (일 - 스카이 블루)
];

const DAYS_SHORT = ['월', '화', '수', '목', '금', '토', '일'];

export default function MiniGameModal({ gameCatalog, isOpen, onClose, user }) {
  const [topPlayers, setTopPlayers] = useState({});

  // 🎰 중복을 100% 방지하면서 요일별 단일 슬롯 교체 알고리즘 구동
  // minigames.js의 공유 함수로 예약/보조 초기화와 완전히 동일한 게임을 선택합니다.
  const weeklyActiveGames = useMemo(() => {
    const activeGames = [];
    for (let slotIdx = 0; slotIdx < 7; slotIdx++) {
      const dayNumber = getRecentTargetDayNumber(slotIdx);
      activeGames.push(getGameForDayNumber(dayNumber, gameCatalog));
    }

    return activeGames;
  }, [gameCatalog, isOpen]);

  // 🛠️ [버그3 수정] 주간 날짜 필터 제거 — 데이터 초기화는 서버(reset-arcade.js)와 App.jsx의
  // checkMinigameDailyReset이 담당하므로, 여기서는 현재 존재하는 데이터에서 단순히 1위만 추출합니다.
  // 이전 주간 필터는 미니게임 자체 리더보드(전체 데이터 기준)와 1위가 달라지는 버그의 원인이었습니다.
  const extractLeaderboardTopPlayer = (snap, isTime = false) => {
    if (snap.empty) return '기록 없음';

    const items = snap.docs.map(doc => {
      const d = doc.data();

      const scoreKeys = isTime
        ? ['time', 'duration', 'value', 'score']
        : ['score', 'highScore', 'points', 'totalScore', 'total', 'grandTotal', 'yachtScore', 'value', 'maxScore'];

      let score = isTime ? 999999999 : -999999999;
      let scoreFound = false;

      for (const key of scoreKeys) {
        if (d[key] !== undefined && d[key] !== null) {
          const val = parseFloat(d[key]);
          if (!isNaN(val)) { score = val; scoreFound = true; break; }
        }
      }

      if (!scoreFound) {
        for (const [key, val] of Object.entries(d)) {
          if (typeof val === 'number' && key !== 'id') {
            if (isTime && (key.toLowerCase().includes('time') || key.toLowerCase().includes('duration'))) {
              score = val; scoreFound = true; break;
            } else if (!isTime && !key.toLowerCase().includes('time') && !key.toLowerCase().includes('date')) {
              score = val; scoreFound = true; break;
            }
          }
        }
      }

      const nameKeys = ['nickname', 'name', 'username', 'player', 'id', 'userId', 'uid', 'displayName', 'user', 'playerName'];
      let name = '';
      for (const key of nameKeys) {
        if (d[key] && typeof d[key] === 'string') { name = d[key]; break; }
      }
      return { name: name || '이름없음', score };
    });

    if (items.length === 0) return '기록 없음';

    if (isTime) {
      items.sort((a, b) => a.score - b.score);
    } else {
      items.sort((a, b) => b.score - a.score);
    }

    return items[0]?.name || '이름없음';
  };

  useEffect(() => {
    if (!isOpen || !user) return;
    const handlePlayerData = async () => {
      try {
        const minigameAuth = getAuth(minigameApp);
        if (!minigameAuth.currentUser) await signInAnonymously(minigameAuth);

        // [버그1 수정] 활성 게임의 리더보드 데이터 로드만 수행합니다.
        // 비활성 게임 데이터 삭제(클린업) 로직을 완전히 제거했습니다.
        // 데이터 삭제는 서버의 reset-arcade.js(크론잡)와 App.jsx의
        // checkMinigameDailyReset에서만 수행하여 모달 열기 시 데이터가
        // 의도치 않게 삭제되는 버그를 원천 차단합니다.
        for (const game of weeklyActiveGames) {
          if (game.aggregateRank?.type === 'rhythm-king') {
            const songSnapshots = await Promise.all(
              game.ranks.map((rank) => getDocs(collection(minigameDb, ...rank.path)))
            );
            const songLeaderboards = songSnapshots.map((snap) => snap.docs.map((record) => record.data()));
            const rhythmKing = calculateRhythmKing(songLeaderboards);
            const summary = rhythmKing
              ? `${rhythmKing.name} · ${rhythmKing.totalPoints} PTS`
              : `후보 없음 (서로 다른 ${RHYTHM_KING_MIN_SONGS}곡 필요)`;
            setTopPlayers(prev => ({ ...prev, [game.aggregateRank.key]: summary }));
            continue;
          }

          for (const rank of game.ranks) {
            const snap = await getDocs(collection(minigameDb, ...rank.path));
            setTopPlayers(prev => ({ ...prev, [rank.key]: extractLeaderboardTopPlayer(snap, rank.isTime) }));
          }
        }
      } catch (err) {
        console.error("미니게임 데이터 로드 오류: ", err);
      }
    };
    handlePlayerData();
  }, [isOpen, user, weeklyActiveGames]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white p-6 md:p-8 rounded-[2rem] w-full max-w-[340px] shadow-2xl relative text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
          <X size={16}/>
        </button>
        <h3 className="text-lg font-black mb-1 text-slate-800 flex items-center justify-center gap-1.5 mt-2">
          <Gamepad2 className="theme-text" size={20}/> 미니게임 선택
        </h3>
        <p className="text-[11px] font-bold text-slate-400 mb-6">매일 요일별로 새로운 추천 게임이 업데이트되며,<p>매일 00시에 해당 게임 기록이 초기화 됩니다!</p></p>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {weeklyActiveGames.map((game, idx) => {
            const buttonColorClass = SLOT_COLORS[idx] || 'bg-slate-500';
            const dayLabel = DAYS_SHORT[idx];

            const rankTextSummary = game.aggregateRank
              ? `${game.aggregateRank.label}: ${topPlayers[game.aggregateRank.key] || '로딩 중...'}`
              : game.rankSummary || game.ranks.map(r => {
                const playerName = topPlayers[r.key] || '로딩 중...';
                return `${r.label}: ${playerName}`;
              }).join(', ');

            return (
              <a
                key={`${game.id}-${idx}`}
                href={game.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2.5 ${buttonColorClass} text-white rounded-xl font-black text-sm flex flex-col hover:brightness-105 active:scale-[0.98] transition-all shadow-md`}
              >
                <span>[{dayLabel}] {game.name}</span>
                <span className="text-[11px] font-bold text-white/80 mt-0.5 tracking-tight">
                  ({rankTextSummary})
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
