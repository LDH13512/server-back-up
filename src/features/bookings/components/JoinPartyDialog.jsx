import React from 'react';
import { X } from 'lucide-react';
import { JoinScheduleCalendar } from './ScheduleCalendars';

export default function JoinPartyDialog({
  booking,
  joinSchedule,
  nickname,
  todayStr,
  viewDate,
  onClose,
  onDateToggle,
  onNicknameChange,
  onScheduleChange,
  onSubmit,
  onViewDateChange,
}) {
  if (!booking) return null;
  const collectsPreferredDates = Boolean(
    booking.isAlwaysOpen && booking.collectPreferredDates
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={20} />
        </button>
        <span className="text-2xl font-black mb-4 block">참가 신청</span>
        <input
          autoFocus
          className="w-full p-4 border-2 rounded-2xl mb-4 font-bold text-lg text-center"
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
        />

        {collectsPreferredDates ? (
          <div className="mt-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
            <div className="mb-3">
              <p className="text-sm font-black text-teal-800">가능한 날짜를 골라주세요</p>
              <p className="mt-1 text-[11px] font-medium leading-5 text-teal-700">선택한 날짜와 닉네임은 모집글 상세에 표시됩니다.</p>
            </div>
            <JoinScheduleCalendar
              selectedDates={joinSchedule.dates}
              todayStr={todayStr}
              viewDate={viewDate}
              onDateToggle={onDateToggle}
              onViewDateChange={onViewDateChange}
            />
          </div>
        ) : booking.isAlwaysOpen && (
          <div className="mt-2">
            <label className="flex items-center gap-2 mb-3 cursor-pointer font-bold text-xs text-slate-500">
              <input
                type="checkbox"
                checked={joinSchedule.enabled}
                onChange={(event) =>
                  onScheduleChange((previous) => ({
                    ...previous,
                    enabled: event.target.checked,
                  }))
                }
                className="accent-[#008081] w-4 h-4"
              />{' '}
              희망 일정 추가하기
            </label>

            {joinSchedule.enabled && (
              <div className="p-4 bg-slate-50 border rounded-2xl">
                <JoinScheduleCalendar
                  selectedDates={joinSchedule.dates}
                  todayStr={todayStr}
                  viewDate={viewDate}
                  onDateToggle={onDateToggle}
                  onViewDateChange={onViewDateChange}
                />
                <div className="flex gap-2 items-center border-t pt-4 mt-2">
                  <span className="text-[10px] font-black text-slate-400">
                    시간
                  </span>
                  <input
                    type="number"
                    className="w-16 p-2 border text-center font-bold rounded"
                    value={joinSchedule.hour}
                    onChange={(event) =>
                      onScheduleChange((previous) => ({
                        ...previous,
                        hour: event.target.value,
                      }))
                    }
                  />
                  <span>시</span>
                  <button
                    type="button"
                    onClick={() =>
                      onScheduleChange((previous) => ({
                        ...previous,
                        minute: previous.minute === '00' ? '30' : '00',
                      }))
                    }
                    className="p-2 border font-bold rounded bg-white"
                  >
                    {joinSchedule.minute}분
                  </button>
                  <label className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                    <input
                      type="checkbox"
                      checked={joinSchedule.isTimeUndecided}
                      onChange={(event) =>
                        onScheduleChange((previous) => ({
                          ...previous,
                          isTimeUndecided: event.target.checked,
                        }))
                      }
                    />
                    미정
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-slate-400 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-4 theme-bg text-white rounded-xl font-black shadow-xl"
          >
            신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
