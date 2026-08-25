import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Crown,
  Flag,
  MessageSquare,
  Pencil,
  RefreshCcw,
  Share2,
  Sparkles,
  Trash2,
  UserMinus,
  X,
} from 'lucide-react';
import { getDayOfWeek, linkify } from '../../../utils/helpers';

export default function BookingDetailDialog({
  booking,
  commentInput,
  showParticipantList,
  onClose,
  onCommentAction,
  onCommentInputChange,
  onCommentSubmit,
  onJoin,
  onKakaoShare,
  onLeaveRequest,
  onParticipantListToggle,
  onReport,
  onSecurityRequest,
}) {
  const [preferredDateView, setPreferredDateView] = useState('calendar');

  useEffect(() => {
    setPreferredDateView('calendar');
  }, [booking?.id]);

  if (!booking) return null;
  const isPreferredDateCalendar = Boolean(
    booking.isAlwaysOpen &&
      booking.collectPreferredDates &&
      preferredDateView === 'calendar'
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 md:p-8 rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <span className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="theme-text" /> {booking.game}
          </span>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border mb-6 space-y-3">
          {!isPreferredDateCalendar && (
            <>
          <div className="flex justify-between items-center text-sm font-bold border-b pb-3 border-slate-200">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CalendarIcon size={14} /> 모집 일정
            </span>
            <span className="text-slate-800">
              {booking.isAlwaysOpen
                ? '상시 모집'
                : `${booking.date}${getDayOfWeek(booking.date)} ${booking.time}`}
            </span>
          </div>

          <div
            onClick={onParticipantListToggle}
            className={`flex justify-between items-center text-sm font-bold border-b pb-3 border-slate-200 cursor-pointer hover:bg-white p-2 -mx-2 rounded-xl transition-all group ${
              showParticipantList
                ? 'bg-white border-teal-200 ring-2 ring-teal-100'
                : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Crown size={14} className="text-amber-500" />
              <span className="text-slate-500">현재 인원</span>
              <ChevronDown
                size={14}
                className={`text-slate-300 transition-transform ${
                  showParticipantList ? 'rotate-180' : ''
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-800">
                {1 + (booking.participants?.length || 0)} / {booking.capacity}
              </span>
            </div>
          </div>

          {showParticipantList ? (
            <ParticipantList
              booking={booking}
              onLeaveRequest={onLeaveRequest}
            />
          ) : (
            <div className="pt-2">
              <span className="block text-[11px] font-black text-slate-400 uppercase mb-2">
                게임 설명 / 링크
              </span>
              <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap break-words bg-white p-4 rounded-xl border border-slate-100 min-h-[60px]">
                {booking.description ? (
                  linkify(booking.description)
                ) : (
                  <span className="text-slate-400 italic">
                    등록된 설명이 없습니다.
                  </span>
                )}
              </div>
            </div>
          )}
            </>
          )}

          <PreferredDateAvailability
            booking={booking}
            view={preferredDateView}
            onViewChange={setPreferredDateView}
          />
        </div>

        <div className="pb-4">
          <button
            disabled={booking.isClosed}
            onClick={() => onJoin(booking)}
            className="w-full py-4 theme-bg text-white text-base font-black rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
          >
            {booking.isClosed ? '마감됨' : '파티 합류하기'}
          </button>
          <button
            type="button"
            onClick={() => onKakaoShare?.(booking)}
            className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-black text-amber-700 transition-all hover:border-amber-300 hover:bg-amber-100 hover:text-amber-800 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Share2 size={16} /> 카카오톡으로 전달
          </button>
          <p className="mt-1.5 text-center text-[10px] font-medium text-slate-400">
            추천 문구를 작성한 뒤 카드 정보를 복사합니다.
          </p>
          <button
            type="button"
            onClick={() => onReport?.({ targetType: 'booking', booking })}
            className="ml-auto mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-black text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Flag size={13} /> 이 모집글 신고
          </button>
        </div>

        <div className="border-t pt-6 flex flex-col mb-4">
          <span className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="theme-text" /> 댓글 (
            {booking.comments?.length || 0})
          </span>
          <CommentList
            booking={booking}
            onCommentAction={onCommentAction}
            onReport={onReport}
          />

          <form
            onSubmit={(event) => onCommentSubmit(event, booking.id)}
            className="bg-white p-2 rounded-2xl border flex flex-col sm:flex-row gap-2 shadow-sm mb-6"
          >
            <input
              maxLength={20}
              className="w-full sm:w-1/4 p-3 border-2 rounded-xl text-sm font-bold outline-none focus:theme-border bg-slate-50"
              placeholder="닉네임"
              value={commentInput.author}
              onChange={(event) =>
                onCommentInputChange((previous) => ({
                  ...previous,
                  author: event.target.value,
                }))
              }
            />
            <div className="flex gap-2 w-full sm:w-3/4">
              <input
                maxLength={300}
                className="flex-1 p-3 border-2 rounded-xl text-sm outline-none focus:theme-border font-medium bg-slate-50"
                placeholder="댓글 내용을 입력하세요"
                value={commentInput.content}
                onChange={(event) =>
                  onCommentInputChange((previous) => ({
                    ...previous,
                    content: event.target.value,
                  }))
                }
              />
              <button
                type="submit"
                className="theme-bg text-white px-6 font-black rounded-xl hover:brightness-105 whitespace-nowrap shadow-md"
              >
                등록
              </button>
            </div>
          </form>

          <div className="grid grid-cols-3 gap-3 w-full">
            <button
              onClick={() => onSecurityRequest('edit', booking)}
              className="py-3.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500 text-xs font-black rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-1.5"
            >
              <Pencil size={16} /> 수정하기
            </button>
            <button
              onClick={() => onSecurityRequest('toggleClose', booking)}
              className="py-3.5 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-xs font-black rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-1.5"
            >
              {booking.isClosed ? (
                <RefreshCcw size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}{' '}
              마감하기
            </button>
            <button
              onClick={() => onSecurityRequest('delete', booking)}
              className="py-3.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-xs font-black rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-1.5"
            >
              <Trash2 size={16} /> 삭제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferredDateAvailability({ booking, view, onViewChange }) {
  if (!booking.isAlwaysOpen || !booking.collectPreferredDates) return null;

  const peopleByDate = new Map();
  (Array.isArray(booking.preferredDateAvailability)
    ? booking.preferredDateAvailability
    : []
  ).forEach((entry) => {
    const nickname = String(entry?.nickname || '').trim();
    if (!nickname || !Array.isArray(entry?.dates)) return;

    entry.dates.forEach((date) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      if (!peopleByDate.has(date)) peopleByDate.set(date, new Set());
      peopleByDate.get(date).add(nickname);
    });
  });

  const dateGroups = [...peopleByDate.entries()].sort(
    ([leftDate, leftPeople], [rightDate, rightPeople]) =>
      rightPeople.size - leftPeople.size || leftDate.localeCompare(rightDate)
  );

  return (
    <div className="border-t border-teal-100 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="block text-[11px] font-black text-teal-700">희망 날짜 현황</span>
          <span className="mt-0.5 block text-[10px] font-bold text-slate-400">참가자가 신청할 때 선택한 결과예요</span>
        </div>
        <div className="flex rounded-lg border border-teal-100 bg-white p-1 text-[11px] font-black">
          <button
            type="button"
            onClick={() => onViewChange('calendar')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              view === 'calendar'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >
            달력
          </button>
          <button
            type="button"
            onClick={() => onViewChange('table')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              view === 'table'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >
            표
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <PreferredDateCalendar dateGroups={dateGroups} />
      ) : dateGroups.length ? (
        <div className="space-y-2">
          {dateGroups.map(([date, nicknames]) => {
            const isMostSelected = nicknames.size === dateGroups[0][1].size;
            return (
              <div
                key={date}
                className={`rounded-xl px-3 py-2.5 ${
                  isMostSelected
                    ? 'border-2 border-lime-500 bg-lime-100'
                    : 'border border-teal-100 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-black text-teal-800">
                    {date.slice(5).replace('-', '/')} {getDayOfWeek(date)}
                  </span>
                  <span className="text-xs font-black text-teal-600">
                    {nicknames.size}명 가능
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-600 break-words">
                  {[...nicknames].sort().join(', ')}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl bg-white px-3 py-3 text-xs font-medium text-slate-400">
          아직 가능한 날짜를 선택한 사람이 없습니다.
        </p>
      )}
    </div>
  );
}

function PreferredDateCalendar({ dateGroups }) {
  const firstAvailableDate = dateGroups
    .map(([date]) => date)
    .sort()[0];
  const initialDate = firstAvailableDate
    ? new Date(`${firstAvailableDate}T00:00:00`)
    : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(firstAvailableDate || '');
  const peopleByDate = new Map(dateGroups);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const selectedPeople = peopleByDate.get(selectedDate);
  const highestSelectionCount = Math.max(
    0,
    ...dateGroups.map(([, people]) => people.size)
  );

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-lg px-2 py-1 text-lg font-black text-slate-500 transition-colors hover:bg-slate-100"
        >
          ‹
        </button>
        <span className="text-sm font-black text-slate-700">{year}년 {month + 1}월</span>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-lg px-2 py-1 text-lg font-black text-slate-500 transition-colors hover:bg-slate-100"
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-black">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <span key={day} className={index === 0 ? 'text-rose-500' : index === 6 ? 'text-blue-500' : 'text-slate-400'}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="min-h-12" />;
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const people = peopleByDate.get(date);
          const isSelected = date === selectedDate;
          const isMostSelected = Boolean(
            people && people.size === highestSelectionCount
          );

          return (
            <button
              key={date}
              type="button"
              onClick={() => people && setSelectedDate(date)}
              disabled={!people}
              className={`min-h-12 rounded-lg px-1 py-1 text-center transition-all ${
                people
                  ? isMostSelected
                    ? 'border-2 border-lime-500 bg-lime-100 text-lime-900 shadow-sm hover:bg-lime-200'
                    : `border border-lime-200 bg-transparent text-lime-800 hover:bg-lime-50 ${
                        isSelected ? 'ring-1 ring-lime-300' : ''
                      }`
                  : 'cursor-default text-slate-300'
              }`}
            >
              <span className="block text-xs font-black">{day}</span>
              {people && <span className="mt-0.5 block text-[9px] font-bold">{people.size}명</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 rounded-xl bg-teal-50 px-3 py-3">
        {selectedPeople ? (
          <>
            <p className="text-xs font-black text-teal-800">
              {selectedDate.slice(5).replace('-', '/')} {getDayOfWeek(selectedDate)} · {selectedPeople.size}명 가능
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-teal-700 break-words">
              {[...selectedPeople].sort().join(', ')}
            </p>
          </>
        ) : (
          <p className="text-xs font-medium text-slate-500">가능한 날짜를 선택하면 참여자 닉네임이 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}

function ParticipantList({ booking, onLeaveRequest }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-teal-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
      <div className="text-[10px] font-black text-slate-400 uppercase">
        <span>참가자 명단</span>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
          <Crown size={12} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-600 truncate flex-1">
            {booking.nickname}
          </span>
        </div>

        {booking.participants?.map((participant, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm group/row justify-between"
          >
            <span className="text-xs font-bold text-slate-800 truncate flex-1">
              {participant}
            </span>
            {!booking.isClosed && (
              <button
                onClick={() => onLeaveRequest(booking, index)}
                className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all flex-shrink-0"
                title="파티 나가기"
              >
                <UserMinus size={14} />
              </button>
            )}
          </div>
        ))}

        {(!booking.participants || booking.participants.length === 0) && (
          <div className="col-span-2 text-center text-[10px] text-slate-300 py-2">
            참가자가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function CommentList({ booking, onCommentAction, onReport }) {
  return (
    <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
      {!booking.comments || booking.comments.length === 0 ? (
        <p className="text-center text-slate-400 text-xs py-8 font-bold italic border-2 border-dashed rounded-2xl flex items-center justify-center">
          첫 댓글을 남겨보세요!
        </p>
      ) : (
        booking.comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white p-4 rounded-2xl border shadow-sm flex gap-3 group"
          >
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-black text-slate-800">
                  {comment.author}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap font-medium">
                {comment.content}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() =>
                  onReport?.({
                    targetType: 'comment',
                    booking,
                    comment,
                  })
                }
                aria-label="댓글 신고"
                title="댓글 신고"
                className="rounded-lg border bg-slate-50 p-1.5 text-slate-400 transition-colors hover:text-rose-500"
              >
                <Flag size={12} />
              </button>
              <button
                onClick={() =>
                  onCommentAction(
                    booking.id,
                    comment.id,
                    'edit',
                    comment.content
                  )
                }
                className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg bg-slate-50 border transition-colors"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() =>
                  onCommentAction(booking.id, comment.id, 'delete')
                }
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg bg-slate-50 border transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
