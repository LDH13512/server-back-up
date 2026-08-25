import React, { useEffect, useState } from 'react';
import { Lock, Clock, MessageSquare, Crown, Flag, Share2, Infinity as InfIcon, Loader2, RefreshCw } from 'lucide-react';
import { getDayOfWeek } from '../utils/helpers';
import { findGameImages } from '../utils/gameImages';

export default function PartyCard({
  b,
  onOpenDetail,
  onReport,
  onKakaoShare,
  isAdmin,
  currentDate,
  onHideBadge,
  theme = "teal",
}) {
  const savedGameImages = Array.isArray(b.gameImages)
    ? b.gameImages.filter((url) => typeof url === 'string' && url.startsWith('https://'))
    : [];
  const savedGameImagesKey = savedGameImages.join('|');
  const [gameImages, setGameImages] = useState(savedGameImages);
  const [gameImageIndex, setGameImageIndex] = useState(0);
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setGameImages(savedGameImages);
    setGameImageIndex(0);

    if (savedGameImages.length > 0) {
      return () => {
        isCurrent = false;
      };
    }

    findGameImages(b.game)
      .then((images) => {
        if (isCurrent) setGameImages(images);
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [b.game, savedGameImagesKey]);

  const refreshGameImage = async (event) => {
    event.stopPropagation();
    if (isRefreshingImage) return;

    const nextIndex = gameImageIndex + 1;
    if (gameImages[nextIndex]) {
      setGameImageIndex(nextIndex);
      return;
    }

    setIsRefreshingImage(true);
    try {
      const images = await findGameImages(b.game, { refresh: true });
      setGameImages(images);
      if (images[nextIndex]) setGameImageIndex(nextIndex);
      else if (images.length > 1) setGameImageIndex(0);
    } catch {
      // Keep the current image when an external search is unavailable.
    } finally {
      setIsRefreshingImage(false);
    }
  };

  const getKSTDateString = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const kstOffset = 9 * 60;
    const kstDate = new Date(date.getTime() + (date.getTimezoneOffset() + kstOffset) * 60000);
    return `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
  };

  const cnt = 1 + (b.participants?.length || 0);
  const isFull = cnt >= parseInt(b.capacity);
  const hasWaitlist = cnt > parseInt(b.capacity);
  const isClosed = b.isClosed;
  const isActuallyClosed = isClosed || isFull;
  const isNew = (getKSTDateString(b.createdAt || 0) === currentDate) && !b.isBadgeHidden;

  const themes = {
    teal: { accent: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100", hoverBorder: "hover:border-teal-200", btn: "bg-[#008081]", title: "text-teal-900" },
    indigo: { accent: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", hoverBorder: "hover:border-indigo-200", btn: "bg-indigo-600", title: "text-indigo-900" },
    orange: { accent: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", hoverBorder: "hover:border-orange-300", btn: "bg-orange-500", title: "text-orange-900" },
    rose: { accent: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", hoverBorder: "hover:border-rose-300", btn: "bg-rose-500", title: "text-rose-900" }
  };

  let currentTheme = themes[theme];
  if (isClosed) currentTheme = themes.rose;
  else if (hasWaitlist || isFull) currentTheme = themes.orange;

  let statusText = '';
  if (isActuallyClosed) {
    if (b.isAlwaysOpen) {
      const baseTime = b.closedAt || b.createdAt || Date.now();
      const deleteDate = new Date(baseTime + 30 * 24 * 60 * 60 * 1000);
      statusText = b.isClosed ? `삭제 예정: ${deleteDate.getMonth() + 1}/${deleteDate.getDate()}` : `추가 모집중 (삭제: ${deleteDate.getMonth() + 1}/${deleteDate.getDate()})`;
    } else {
      let dateStr = "";
      if (b.date) {
        const parts = b.date.split('-');
        if(parts.length === 3) dateStr = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
      }
      statusText = b.isClosed ? '모집 종료' : (dateStr ? `추가 모집중 (하는날: ${dateStr})` : '추가 모집중');
    }
  } else {
    if (b.isAlwaysOpen) {
      const baseTime = b.closedAt || b.createdAt || Date.now();
      const deleteDate = new Date(baseTime + 30 * 24 * 60 * 60 * 1000);
      statusText = `상시 모집 중 (삭제: ${deleteDate.getMonth() + 1}/${deleteDate.getDate()})`;
    } else {
      statusText = `${b.date}${getDayOfWeek(b.date)} ${b.time}`;
    }
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onOpenDetail(b.id); }}
      className={`p-4 md:p-5 rounded-3xl border-2 shadow-sm relative group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md bg-white flex flex-col h-full select-none overflow-hidden isolate ${currentTheme.border} ${currentTheme.hoverBorder} ${isClosed ? 'opacity-90' : ''}`}
    >
      {gameImages[gameImageIndex] && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-25 grayscale-[10%] transition-[background-image] duration-500"
          style={{ backgroundImage: `url(${JSON.stringify(gameImages[gameImageIndex]).slice(1, -1)})` }}
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/30 via-white/20 to-white/50" />

      <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
        <button
          type="button"
          aria-label={`${b.game} 카카오톡 전달 문구 작성`}
          title="카카오톡 전달 문구 작성"
          onClick={(event) => {
            event.stopPropagation();
            onKakaoShare?.(b);
          }}
          className="rounded-full border border-slate-200 bg-white/95 p-1.5 text-teal-500 opacity-80 shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 focus:opacity-100"
        >
          <Share2 size={12} />
        </button>
        <button
          type="button"
          aria-label={`${b.game} 모집글 신고`}
          title="모집글 신고"
          onClick={(event) => {
            event.stopPropagation();
            onReport?.(b);
          }}
          className="rounded-full border border-slate-200 bg-white/95 p-1.5 text-slate-300 opacity-70 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100"
        >
          <Flag size={12} />
        </button>
      </div>
      <div className={`relative z-10 text-[10px] font-black mb-1.5 flex items-center gap-1 uppercase tracking-widest pr-14 ${isActuallyClosed ? currentTheme.accent : 'text-slate-400'}`}>
        {isActuallyClosed ? <Lock size={12}/> : (b.isAlwaysOpen ? <InfIcon size={12} className={`${currentTheme.accent} animate-pulse`}/> : <Clock size={12}/>)} 
        {statusText}
        {b.comments && b.comments.length > 0 && <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1"><MessageSquare size={10}/>{b.comments.length}</span>}
      </div>

      <span className={`relative z-10 font-black mb-3 min-w-0 text-lg ${currentTheme.title} group-hover:${currentTheme.accent} flex items-center gap-1.5`}>
        <span className="truncate">{b.game}</span>
        <button
          type="button"
          aria-label={`${b.game} 파티 카드 이미지 새로고침`}
          title="다른 게임 이미지 찾기"
          disabled={isRefreshingImage}
          onClick={refreshGameImage}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-400 shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600 disabled:cursor-wait disabled:opacity-60"
        >
          {isRefreshingImage ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
        </button>
        {isNew && (
          <span 
            onClick={(e) => {
              if (isAdmin) {
                e.stopPropagation();
                onHideBadge(b);
              }
            }}
            className={`bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black animate-pulse flex-shrink-0 shrink-0 tracking-tighter ${isAdmin ? 'cursor-pointer hover:bg-rose-600 hover:scale-105 transition-transform' : ''}`}
            title={isAdmin ? "관리자 권한: 뱃지 숨기기" : ""}
          >
            새 모집
          </span>
        )}
      </span>

      <div className="relative z-10 mb-4 flex min-w-0 flex-wrap items-center gap-1.5">
        <span className={`flex min-w-0 max-w-full items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black shadow-sm ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.border}`}>
          <Crown size={10} className="shrink-0" />
          <span className="truncate">{b.nickname}</span>
        </span>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase tracking-widest">
          <span className="text-slate-400">정원</span>
          <span className={currentTheme.accent}>{cnt} / {b.capacity}</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ease-out ${currentTheme.btn}`} style={{width: `${Math.min(100, (cnt/b.capacity)*100)}%`}}></div>
        </div>
      </div>
    </div>
  );
}
