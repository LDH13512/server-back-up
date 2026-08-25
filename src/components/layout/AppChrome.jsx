import React from 'react';
import {
  Gamepad2,
  HelpCircle,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCcw,
} from 'lucide-react';

export function AppStyles({ themeColor }) {
  return (
    <style>{`
      .theme-bg { background-color: ${themeColor}; }
      .theme-text { color: ${themeColor}; }
      .theme-border { border-color: ${themeColor}; }
      .party-card-container { width: 100%; flex-shrink: 0; }
      @media (min-width: 640px) { .party-card-container { width: calc((100vw - 3rem) / 2); } }
      @media (min-width: 768px) { .party-card-container { width: calc((100vw - 4rem) / 3); } }
      @media (min-width: 1024px) { .party-card-container { width: calc((100vw - 6.5rem) / 4); } }
      @media (min-width: 1152px) { .party-card-container { width: 262px; } }
      @media (min-width: 1280px) { .party-card-container { width: 204.8px; } }
      @keyframes fall {
        0% { transform: translateY(-240px) rotate(0deg); opacity: 0; }
        15% { opacity: 1; }
        100% { transform: translateY(105vh) rotate(var(--spin-deg, 360deg)); opacity: 0; }
      }
      .falling-character {
        position: fixed;
        top: -240px;
        z-index: 9999;
        pointer-events: none;
        animation: fall 1.2s linear forwards;
      }
    `}</style>
  );
}

export function BackgroundLayer({ active, image }) {
  if (!active || !image) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none bg-cover bg-center transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `url(${image})`,
        zIndex: 0,
        opacity: 0.35,
      }}
    />
  );
}

export function NotificationToast({ notification }) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-full text-white font-bold shadow-xl animate-bounce text-sm ${
        notification.type === 'error' ? 'bg-orange-500' : 'bg-teal-600'
      }`}
    >
      {notification.message}
    </div>
  );
}

export function CreateBookingButton({ visible, onClick }) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      aria-label="새 파티 모집"
      title="새 파티 모집"
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[80] w-16 h-16 theme-bg text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-[0.98] transition-all"
    >
      <Plus size={32} />
    </button>
  );
}

export function UserGuideButton({ visible, onClick }) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="이용방법 안내"
      title="이용방법 안내"
      className="fixed bottom-24 right-6 z-[80] flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-200 bg-white text-teal-700 shadow-2xl transition-all hover:scale-110 hover:bg-teal-50 active:scale-[0.98] md:bottom-28 md:right-10"
    >
      <HelpCircle size={32} />
    </button>
  );
}

export function AppHeader({
  onMiniGamesOpen,
  onSuggestionOpen,
  onTitleClick,
}) {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full p-4">
        <div
          onClick={onTitleClick}
          className="flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
        >
          <Gamepad2 className="theme-text group-hover:rotate-12 transition-transform duration-300" />
          <h1 className="text-xl font-black theme-text uppercase tracking-tighter select-none">
            게시판
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              window.open(
                '/minigame/sketchbook/index.html',
                '_blank'
              )
            }
            className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-200 text-indigo-800 px-5 py-2 rounded-2xl hover:bg-indigo-100 hover:scale-105 active:scale-[0.98] transition-all shadow-md text-sm sm:text-base font-black uppercase tracking-tighter select-none"
          >
            <Pencil
              className="text-indigo-500 animate-pulse"
              size={18}
            />
            <span>스케치북 🎨</span>
          </button>
          <button
            onClick={onMiniGamesOpen}
            className="flex items-center gap-2 bg-teal-50 border-2 border-teal-200 text-teal-800 px-5 py-2 rounded-2xl hover:bg-teal-100 hover:scale-105 active:scale-[0.98] transition-all shadow-md text-sm sm:text-base font-black uppercase tracking-tighter select-none"
          >
            <Gamepad2 className="theme-text animate-pulse" size={18} />
            <span>미니게임 🎲</span>
          </button>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">
              version 5.5.3
            </span>
            <button
              onClick={onSuggestionOpen}
              className="flex items-center gap-1 text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md shadow-sm hover:bg-teal-100 transition-all"
            >
              <Lightbulb size={12} /> 건의 사항
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

//
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
      <RefreshCcw className="animate-spin theme-text" size={40} />
      <p className="font-black text-sm tracking-widest uppercase animate-pulse">
        보안 연결 중...
      </p>
    </div>
  );
}
