import React, { useEffect, useState } from 'react';
import { Flag, Loader2, ShieldAlert, X } from 'lucide-react';
import { COMMUNITY_LIMITS } from '../../utils/contentModeration';

const REPORT_CATEGORIES = [
  ['inappropriate', '부적절한 표현'],
  ['personal-information', '개인정보 노출'],
  ['spam', '스팸 또는 광고'],
  ['copyright', '저작권·사칭'],
  ['dangerous', '위험하거나 불법적인 내용'],
  ['other', '기타'],
];

export default function ReportDialog({
  reportTarget,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [category, setCategory] = useState('inappropriate');
  const [reason, setReason] = useState('');
  const [reporterNickname, setReporterNickname] = useState('');

  useEffect(() => {
    if (!reportTarget) return undefined;

    setCategory('inappropriate');
    setReason('');
    setReporterNickname('');

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose, reportTarget]);

  if (!reportTarget) return null;

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
      onMouseDown={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="relative w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="신고 창 닫기"
          className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="pr-10">
          <p className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-rose-600">
            <ShieldAlert size={14} /> COMMUNITY SAFETY
          </p>
          <h2
            id="report-dialog-title"
            className="mt-1 text-2xl font-black text-slate-900"
          >
            콘텐츠 신고
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            신고 대상: <strong>{reportTarget.targetLabel}</strong>
          </p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ category, reason, reporterNickname });
          }}
        >
          <label className="block space-y-2">
            <span className="text-xs font-black text-slate-500">신고 유형</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-bold outline-none focus:border-rose-300"
            >
              {REPORT_CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-black text-slate-500">
              신고 내용
            </span>
            <textarea
              required
              maxLength={COMMUNITY_LIMITS.reportReason}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="운영자가 확인할 수 있도록 문제가 되는 부분을 적어주세요."
              className="h-32 w-full resize-y rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none focus:border-rose-300"
            />
            <span className="block text-right text-[10px] font-bold text-slate-400">
              {Array.from(reason).length}/{COMMUNITY_LIMITS.reportReason}
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-black text-slate-500">
              신고자 닉네임 (필수)
            </span>
            <input
              required
              maxLength={COMMUNITY_LIMITS.nickname}
              value={reporterNickname}
              onChange={(event) => setReporterNickname(event.target.value)}
              placeholder="신고자 닉네임을 입력해 주세요."
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-bold outline-none focus:border-rose-300"
            />
          </label>

          <div className="rounded-xl bg-slate-50 p-3 text-xs font-medium leading-5 text-slate-500">
            신고 대상 게임과 신고자 닉네임이 함께 운영진에게 전달됩니다. 신고만으로 즉시 삭제되지는 않습니다.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-black text-white shadow-lg transition-colors hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Flag size={17} />
            )}
            신고 접수
          </button>
        </form>
      </section>
    </div>
  );
}
