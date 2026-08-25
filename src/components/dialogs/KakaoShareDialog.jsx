import React from 'react';
import { ClipboardCopy, Loader2, MessageCircle, Sparkles, X } from 'lucide-react';
import { KAKAO_SHARE_INTRO_MAX_LENGTH } from '../../utils/kakaoShare';

export default function KakaoShareDialog({
  modal,
  onClose,
  onCopy,
  onGenerate,
  onIntroChange,
}) {
  if (!modal.isOpen || !modal.booking) return null;

  const introLength = Array.from(modal.intro).length;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[2rem] border bg-white p-6 shadow-2xl animate-in zoom-in duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="카카오톡 전달 문구 창 닫기"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200"
        >
          <X size={18} />
        </button>

        <div className="mb-5 pr-10">
          <span className="flex items-center gap-2 text-xl font-black text-slate-800">
            <MessageCircle className="text-amber-500" size={22} />
            카카오톡 전달 문구
          </span>
          <p className="mt-1.5 text-xs font-bold text-slate-400">
            {modal.booking.game}
          </p>
        </div>

        <form onSubmit={onCopy}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="kakao-share-intro"
              className="text-sm font-black text-slate-700"
            >
              무슨 내용으로 사람들에게 추천할까요?
            </label>
            <button
              type="button"
              disabled={modal.isGenerating}
              onClick={onGenerate}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-600 shadow-sm transition-all hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
            >
              {modal.isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> 작성 중
                </>
              ) : (
                <>
                  <Sparkles size={12} /> AI 작성
                </>
              )}
            </button>
          </div>

          <textarea
            id="kakao-share-intro"
            autoFocus
            maxLength={KAKAO_SHARE_INTRO_MAX_LENGTH}
            value={modal.intro}
            onChange={(event) => onIntroChange(event.target.value)}
            placeholder="예: 같이 하실분 급구 합니다!"
            className="h-24 w-full resize-none rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-amber-400 focus:bg-white"
          />
          <div className="mt-1.5 flex min-h-5 items-start justify-between gap-3">
            <p className="text-[10px] font-bold text-rose-500">
              {modal.error}
            </p>
            <span className="shrink-0 text-[10px] font-black text-slate-400">
              {introLength}/{KAKAO_SHARE_INTRO_MAX_LENGTH}
            </span>
          </div>

          <p className="mb-5 mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-slate-500">
            이 문구와 게임 이름, 일시, 참여자, 모집 현황이 함께
            클립보드에 복사됩니다.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-black text-slate-500 transition-colors hover:bg-slate-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={modal.isGenerating}
              className="theme-bg flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              <ClipboardCopy size={16} /> 복사하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
