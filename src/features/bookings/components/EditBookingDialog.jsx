import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { JoinScheduleCalendar } from './ScheduleCalendars';
import { getKSTDateString } from '../../../utils/helpers';

export default function EditBookingDialog({
  editModal,
  isGeneratingDescription,
  isGeneratingTitle,
  onClose,
  onExtendDeletion,
  onGenerateDescription,
  onGenerateTitle,
  onModalChange,
  onSubmit,
}) {
  const [availabilityViewDate, setAvailabilityViewDate] = useState(new Date());

  useEffect(() => {
    const hostDates = getHostPreferredDates(editModal.data);
    const firstDate = hostDates[0];
    if (firstDate) {
      setAvailabilityViewDate(new Date(`${firstDate}T00:00:00`));
    } else {
      setAvailabilityViewDate(new Date());
    }
  }, [editModal.data?.id]);

  if (!editModal.isOpen || !editModal.data) return null;

  const updateData = (changes) => {
    onModalChange((previous) => ({
      ...previous,
      data: { ...previous.data, ...changes },
    }));
  };
  const hostPreferredDates = getHostPreferredDates(editModal.data);
  const canEditHostPreferredDates = Boolean(
    editModal.data.isAlwaysOpen && editModal.data.collectPreferredDates
  );

  const toggleHostPreferredDate = (date) => {
    const nextDates = hostPreferredDates.includes(date)
      ? hostPreferredDates.filter((item) => item !== date)
      : [...hostPreferredDates, date].sort();
    const otherAvailability = (Array.isArray(editModal.data.preferredDateAvailability)
      ? editModal.data.preferredDateAvailability
      : []
    ).filter((entry) => entry?.nickname !== editModal.data.nickname);

    updateData({
      preferredDateAvailability: [
        ...otherAvailability,
        { nickname: editModal.data.nickname, dates: nextDates },
      ],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={20} />
        </button>
        <span className="text-xl font-black mb-6 block">
          📝 파티 정보 수정
        </span>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-end ml-1">
              <span className="text-[10px] font-black text-slate-400 uppercase">
                게임 이름
              </span>
              <button
                type="button"
                onClick={onGenerateTitle}
                className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                {isGeneratingTitle ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  '✨ AI 생성'
                )}
              </button>
            </div>
            <input
              className="w-full p-4 border-2 rounded-2xl font-bold bg-slate-50"
              value={editModal.data.game}
              maxLength={30}
              onChange={(event) => updateData({ game: event.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border mb-2">
            <span className="text-[11px] font-black text-slate-500">
              상시 모집 설정
            </span>
            <input
              type="checkbox"
              className="w-5 h-5 accent-[#008081]"
              checked={editModal.data.isAlwaysOpen}
              onChange={(event) =>
                updateData({ isAlwaysOpen: event.target.checked })
              }
            />
          </div>

          {!editModal.data.isAlwaysOpen && (
            <div className="space-y-3">
              <input
                type="date"
                className="w-full p-3 border-2 rounded-2xl font-bold bg-slate-50 h-[48px]"
                value={editModal.data.date || ''}
                onChange={(event) => updateData({ date: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  className="p-3 border-2 rounded-2xl font-bold text-center bg-slate-50 h-[48px] disabled:opacity-40 disabled:cursor-not-allowed"
                  value={
                    editModal.data.isTimeUndecided
                      ? ''
                      : editModal.data.hour || ''
                  }
                  onChange={(event) => updateData({ hour: event.target.value })}
                  placeholder="시"
                  disabled={!!editModal.data.isTimeUndecided}
                />
                <input
                  type="text"
                  className="p-3 border-2 rounded-2xl font-bold text-center bg-slate-50 h-[48px] disabled:opacity-40 disabled:cursor-not-allowed"
                  value={
                    editModal.data.isTimeUndecided
                      ? ''
                      : editModal.data.minute || ''
                  }
                  onChange={(event) =>
                    updateData({ minute: event.target.value })
                  }
                  placeholder="분"
                  disabled={!!editModal.data.isTimeUndecided}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none pl-1">
                <input
                  type="checkbox"
                  className="accent-[#008081] w-4 h-4"
                  checked={!!editModal.data.isTimeUndecided}
                  onChange={(event) =>
                    updateData({ isTimeUndecided: event.target.checked })
                  }
                />
                <span className="text-xs font-black text-slate-400">
                  시간 미정
                </span>
              </label>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">
              최대 정원
            </span>
            <input
              type="number"
              min="2"
              max="100"
              className="w-full p-3 border-2 rounded-2xl font-bold bg-slate-50 h-[48px]"
              value={editModal.data.capacity || '4'}
              onChange={(event) => updateData({ capacity: event.target.value })}
            />
          </div>

          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400">
              설명 / 링크
            </span>
            <button
              type="button"
              onClick={onGenerateDescription}
              className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all flex items-center gap-1"
            >
              {isGeneratingDescription ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                '✨ AI 생성'
              )}
            </button>
          </div>
          <textarea
            className="w-full p-4 border-2 rounded-2xl h-24 bg-slate-50 text-sm"
            value={editModal.data.description || ''}
            onChange={(event) =>
              updateData({ description: event.target.value })
            }
          />

          {canEditHostPreferredDates && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
              <div className="mb-3">
                <span className="text-sm font-black text-teal-800">내가 선택한 날짜 변경하기</span>
                <p className="mt-1 text-[11px] font-medium leading-5 text-teal-700">
                  저장하면 희망 날짜 현황의 내 일정이 바로 변경됩니다.
                </p>
              </div>
              <JoinScheduleCalendar
                selectedDates={hostPreferredDates}
                todayStr={getKSTDateString(Date.now())}
                viewDate={availabilityViewDate}
                onDateToggle={toggleHostPreferredDate}
                onViewDateChange={setAvailabilityViewDate}
              />
            </div>
          )}


          {editModal.data.isAlwaysOpen && (
            <DeletionSchedule
              booking={editModal.data}
              onExtend={onExtendDeletion}
            />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-4 theme-bg text-white rounded-2xl font-black shadow-xl"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getHostPreferredDates(booking) {
  if (!booking?.nickname || !Array.isArray(booking.preferredDateAvailability)) {
    return [];
  }

  const hostEntry = booking.preferredDateAvailability.find(
    (entry) => entry?.nickname === booking.nickname
  );
  return Array.isArray(hostEntry?.dates) ? hostEntry.dates : [];
}

function DeletionSchedule({ booking, onExtend }) {
  const oneDay = 24 * 60 * 60 * 1000;
  const baseTime = booking.closedAt || booking.createdAt || Date.now();
  const extraDays = booking.extraDays || 0;
  const deletionTime = baseTime + 30 * oneDay + extraDays * oneDay;
  const deletionDate = new Date(deletionTime).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const daysLeft = Math.ceil((deletionTime - Date.now()) / oneDay);

  return (
    <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl space-y-2.5">
      <div className="flex items-center gap-1.5">
        <CalendarIcon size={13} className="text-rose-400" />
        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
          자동 삭제 예정일
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-black text-rose-700">
            {deletionDate}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[10px] font-bold ${
                daysLeft <= 3 ? 'text-rose-500' : 'text-slate-400'
              }`}
            >
              {daysLeft > 0 ? `D-${daysLeft}` : '삭제 예정'}
            </span>
            {extraDays > 0 && (
              <span className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md">
                +{extraDays}일 연장됨
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onExtend}
          className="px-3 py-2 bg-teal-500 text-white text-[11px] font-black rounded-xl hover:bg-teal-600 active:scale-95 transition-all flex items-center gap-1 shadow-sm shrink-0"
        >
          <Plus size={13} /> 1일 연장
        </button>
      </div>
    </div>
  );
}
