import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const getCalendarDays = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  return Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, index) => index + 1)
  );
};

const getDateString = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const WeekdayHeader = ({ className }) => (
  <div className={className}>
    {WEEKDAYS.map((day) => (
      <div
        key={day}
        className={`font-black ${
          day === '일'
            ? 'text-rose-500'
            : day === '토'
              ? 'text-blue-500'
              : 'text-slate-400'
        }`}
      >
        {day}
      </div>
    ))}
  </div>
);

export function JoinScheduleCalendar({
  selectedDates,
  todayStr,
  viewDate,
  onDateToggle,
  onViewDateChange,
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getCalendarDays(year, month);

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2 select-none">
      <div className="flex justify-between items-center mb-3">
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-black text-slate-700 tracking-wider">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <WeekdayHeader className="grid grid-cols-7 gap-1 text-center mb-2 text-[11px]" />

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-8" />;
          }

          const dateString = getDateString(year, month, day);
          const isSelected = selectedDates.includes(dateString);
          const isToday = dateString === todayStr;

          return (
            <button
              key={dateString}
              type="button"
              onClick={() => onDateToggle(dateString)}
              className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-teal-500 text-white shadow-md scale-105'
                  : 'text-slate-600 hover:bg-slate-100'
              } ${
                !isSelected && isToday
                  ? 'border-2 border-teal-500 text-teal-600'
                  : ''
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthlyBookingCalendar({
  bookings,
  todayStr,
  viewDate,
  onBookingSelect,
  onViewDateChange,
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getCalendarDays(year, month);

  return (
    <div className="w-full bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm mb-2 select-none animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(year, month - 1, 1))}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 border border-slate-200 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-black text-slate-700 tracking-wider">
          {year}년 {month + 1}월 모집 일정
        </span>
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(year, month + 1, 1))}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 border border-slate-200 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <WeekdayHeader className="grid grid-cols-7 gap-2 text-center mb-3 border-b border-slate-100 pb-2 text-xs" />

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`main-empty-${index}`}
                className="bg-slate-50/40 min-h-[100px] rounded-2xl border border-dashed border-slate-100"
              />
            );
          }

          const dateString = getDateString(year, month, day);
          const isToday = dateString === todayStr;
          const dayGames = bookings.filter(
            (booking) =>
              !booking.isAlwaysOpen && booking.date === dateString
          );

          return (
            <div
              key={dateString}
              className={`min-h-[110px] p-2 rounded-2xl border flex flex-col transition-all bg-white relative ${
                isToday
                  ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/10'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <span
                className={`text-xs font-bold mb-1.5 ${
                  isToday
                    ? 'text-teal-600 font-black'
                    : 'text-slate-500'
                }`}
              >
                {day}
              </span>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] pr-0.5">
                {dayGames.map((booking) => {
                  const isFull =
                    (1 + (booking.participants?.length || 0)) >=
                    parseInt(booking.capacity);
                  const badgeTheme = booking.isClosed
                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                    : isFull
                      ? 'bg-orange-50 text-orange-700 border-orange-100'
                      : 'bg-teal-50 text-teal-700 border-teal-100';

                  return (
                    <div
                      key={booking.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onBookingSelect(booking.id);
                      }}
                      className={`border text-[9px] font-black px-1.5 py-0.5 rounded-lg truncate shadow-xs cursor-pointer hover:brightness-95 transition-all ${badgeTheme}`}
                      title={booking.game}
                    >
                      {booking.game}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
