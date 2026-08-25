import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleSlash2,
  Flag,
  MessageSquare,
  Trash2,
} from 'lucide-react';

const CATEGORY_LABELS = {
  inappropriate: '부적절한 표현',
  'personal-information': '개인정보 노출',
  spam: '스팸 또는 광고',
  copyright: '저작권·사칭',
  dangerous: '위험하거나 불법적인 내용',
  other: '기타',
};

export default function ReportManager({
  reports,
  onDeleteContent,
  onRemoveReport,
  onUpdateStatus,
}) {
  const [statusFilter, setStatusFilter] = useState('pending');

  const visibleReports = useMemo(
    () =>
      reports.filter(
        (report) => statusFilter === 'all' || report.status === statusFilter
      ),
    [reports, statusFilter]
  );

  const pendingCount = reports.filter(
    (report) => report.status === 'pending'
  ).length;

  return (
    <section className="rounded-[2rem] border bg-white p-5 shadow-sm sm:p-7">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Flag className="text-rose-600" size={21} />
            콘텐츠 신고 관리
            <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] text-rose-600">
              대기 {pendingCount}
            </span>
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            모집글과 댓글 신고를 검토하고 콘텐츠 또는 신고 상태를 처리합니다.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600"
        >
          <option value="pending">처리 대기</option>
          <option value="resolved">처리 완료</option>
          <option value="dismissed">문제 없음</option>
          <option value="all">전체</option>
        </select>
      </header>

      <div className="mt-5 space-y-4">
        {visibleReports.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed py-12 text-center text-xs font-bold text-slate-400">
            선택한 상태의 신고가 없습니다.
          </p>
        ) : (
          visibleReports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-rose-600 shadow-sm">
                      {CATEGORY_LABELS[report.category] || '기타'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      {report.targetType === 'comment' ? (
                        <MessageSquare size={11} />
                      ) : (
                        <Flag size={11} />
                      )}
                      {report.targetType === 'comment' ? '댓글' : '모집글'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="mt-2 break-words text-sm font-black text-slate-800">
                    {report.targetLabel || report.bookingTitle || '삭제된 콘텐츠'}
                  </h3>
                  {report.bookingTitle && (
                    <p className="mt-1 text-xs font-bold text-teal-700">
                      게임: {report.bookingTitle}
                    </p>
                  )}
                  {report.contentSnapshot && (
                    <p className="mt-2 rounded-xl bg-white p-3 text-xs font-medium leading-5 text-slate-600">
                      {report.contentSnapshot}
                    </p>
                  )}
                  <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                    {report.reason}
                  </p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400">
                    신고자: {report.reporterNickname || '익명'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    report.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : report.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {report.status === 'pending'
                    ? '처리 대기'
                    : report.status === 'resolved'
                      ? '처리 완료'
                      : '문제 없음'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                {report.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(report.id, 'resolved')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white"
                    >
                      <CheckCircle2 size={13} /> 처리 완료
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(report.id, 'dismissed')}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-2 text-[11px] font-black text-slate-600"
                    >
                      <CircleSlash2 size={13} /> 문제 없음
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        '신고된 원본 콘텐츠를 삭제할까요? 이 작업은 되돌릴 수 없습니다.'
                      )
                    ) {
                      onDeleteContent(report);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700"
                >
                  <Trash2 size={13} /> 원본 콘텐츠 삭제
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('이 신고 기록을 삭제할까요?')) {
                      onRemoveReport(report.id);
                    }
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black text-slate-400 hover:bg-white hover:text-rose-600"
                >
                  신고 기록 삭제
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
