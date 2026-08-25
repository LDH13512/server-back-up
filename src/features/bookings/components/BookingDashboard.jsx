import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Flame,
  Infinity as InfinityIcon,
  Lock,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import PartyCard from '../../../components/PartyCard';
import { getDayOfWeek } from '../../../utils/helpers';
import {
  isPartyFull,
  selectBookingDashboardData,
} from '../bookingSelectors';
import { MonthlyBookingCalendar } from './ScheduleCalendars';

export default function BookingDashboard({
  bookings,
  isAdmin,
  recommendedBookingId,
  todayStr,
  viewDate,
  onBookingSelect,
  onHideBadge,
  onKakaoShare,
  onReport,
  onViewDateChange,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [viewMode, setViewMode] = useState('card');
  const [isAdditionalExpanded, setIsAdditionalExpanded] = useState(false);
  const [isClosedExpanded, setIsClosedExpanded] = useState(false);
  const [isRecruitingExpanded, setIsRecruitingExpanded] = useState(true);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isRecommendedExpanded, setIsRecommendedExpanded] = useState(false);
  const [isTodaysExpanded, setIsTodaysExpanded] = useState(false);

  const {
    additionalRecruitingList,
    filteredBookings,
    fullyClosedList,
    groupedBookings,
    recommendedGame,
    recruitingList,
    scheduledList,
    todaysGames,
  } = selectBookingDashboardData({
    bookings,
    logs: [],
    logPage: 1,
    logsPerPage: 1,
    recommendedBookingId,
    searchQuery,
    todayStr,
  });

  const cardProps = {
    currentDate: todayStr,
    isAdmin,
    onHideBadge,
    onKakaoShare,
    onOpenDetail: onBookingSelect,
    onReport,
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-8 w-full mb-16 mt-6 items-start">
        {recommendedGame && (
          <RecommendedPanel
            booking={recommendedGame}
            expanded={isRecommendedExpanded}
            cardProps={cardProps}
            onBookingSelect={onBookingSelect}
            onToggle={() =>
              setIsRecommendedExpanded((previous) => !previous)
            }
          />
        )}

        {todaysGames.length > 0 && (
          <TodaysGamesPanel
            bookings={todaysGames}
            expanded={isTodaysExpanded}
            cardProps={cardProps}
            onBookingSelect={onBookingSelect}
            onToggle={() => setIsTodaysExpanded((previous) => !previous)}
          />
        )}

        <SearchPanel
          expanded={isSearchExpanded}
          query={searchQuery}
          viewMode={viewMode}
          onQueryChange={setSearchQuery}
          onToggle={() => setIsSearchExpanded((previous) => !previous)}
          onViewModeChange={setViewMode}
        />
      </div>

      {viewMode === 'card' ? (
        <>
          <ScheduleSection
            bookings={scheduledList}
            expanded={isScheduleExpanded}
            groupedBookings={groupedBookings}
            todayStr={todayStr}
            cardProps={cardProps}
            onBookingSelect={onBookingSelect}
            onToggle={() => setIsScheduleExpanded((previous) => !previous)}
          />

          <StatusSection
            title="모집 중"
            description="현재 참여 가능한 파티"
            bookings={recruitingList}
            expanded={isRecruitingExpanded}
            icon={<InfinityIcon className="text-indigo-500" />}
            titleClass="text-slate-800 group-hover/btn:theme-text"
            compactTheme={(booking) =>
              booking.isAlwaysOpen
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-teal-200 bg-teal-50 text-teal-700'
            }
            compactDateClass={(booking) =>
              booking.isAlwaysOpen ? 'text-indigo-600' : 'text-teal-600'
            }
            cardTheme={(booking) =>
              booking.isAlwaysOpen ? 'indigo' : 'teal'
            }
            emptyText="모집 중인 파티가 없습니다."
            cardProps={cardProps}
            onBookingSelect={onBookingSelect}
            onToggle={() =>
              setIsRecruitingExpanded((previous) => !previous)
            }
          />

          <StatusSection
            title="추가 모집중인 파티"
            description="인원이 가득 찼지만 파티장이 마감하지 않은 파티"
            bookings={additionalRecruitingList}
            expanded={isAdditionalExpanded}
            icon={<Users className="text-orange-500" />}
            titleClass="text-orange-600 group-hover/btn:text-orange-500"
            compactTheme={() =>
              'border-orange-200 bg-orange-50 text-orange-700 shadow-orange-100/50'
            }
            compactDateClass={() => 'text-orange-600'}
            cardTheme={() => 'orange'}
            emptyText="추가 모집중인 파티가 없습니다."
            cardProps={cardProps}
            onBookingSelect={onBookingSelect}
            onToggle={() =>
              setIsAdditionalExpanded((previous) => !previous)
            }
          />

          <StatusSection
            title="마감된 파티"
            description="파티장에 의해 마감된 파티"
            bookings={fullyClosedList}
            expanded={isClosedExpanded}
            icon={<Lock className="text-rose-600" />}
            titleClass="text-rose-800 group-hover/btn:text-rose-700"
            compactTheme={() =>
              'border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100/50'
            }
            compactDateClass={() => 'text-rose-600'}
            cardTheme={() => 'rose'}
            emptyText="마감된 파티가 없습니다."
            cardProps={cardProps}
            onBookingSelect={onBookingSelect}
            onToggle={() => setIsClosedExpanded((previous) => !previous)}
          />
        </>
      ) : (
        <CalendarView
          additionalRecruitingList={additionalRecruitingList}
          bookings={filteredBookings}
          fullyClosedList={fullyClosedList}
          recruitingList={recruitingList}
          todayStr={todayStr}
          viewDate={viewDate}
          onBookingSelect={onBookingSelect}
          onViewDateChange={onViewDateChange}
        />
      )}
    </>
  );
}

function RecommendedPanel({
  booking,
  cardProps,
  expanded,
  onBookingSelect,
  onToggle,
}) {
  return (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] p-4 sm:p-5 w-[262px] max-w-full flex flex-col shrink-0 transition-all duration-300 relative">
      <button
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
        className="flex items-center gap-4 w-full outline-none text-left cursor-pointer group/btn"
      >
        <span className="text-sm font-black text-indigo-600 flex items-center gap-1.5 w-fit bg-white/70 px-3 py-2 rounded-xl shadow-sm pointer-events-none transition-all group-hover/btn:bg-white">
          <Sparkles size={16} /> 랜덤 추천 파티
        </span>
        <div className="p-2 bg-white/70 text-indigo-500 rounded-xl shadow-sm shrink-0 pointer-events-none transition-all group-hover/btn:bg-white">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 flex flex-wrap gap-4 md:gap-6 w-full animate-in fade-in duration-300">
          <div className="party-card-container">
            <PartyCard {...cardProps} b={booking} theme="indigo" />
          </div>
        </div>
      ) : (
        <div className="mt-4 w-full flex justify-center items-center animate-in fade-in duration-300">
          <div
            onClick={(event) => {
              event.stopPropagation();
              onBookingSelect(booking.id);
            }}
            className="bg-white/90 border-2 border-indigo-100 text-indigo-700 px-4 py-3 rounded-2xl text-[13px] font-black shadow-sm cursor-pointer hover:bg-white hover:border-indigo-300 transition-all truncate w-full text-center flex items-center justify-center min-h-[48px]"
          >
            {booking.game}
          </div>
        </div>
      )}
    </div>
  );
}

function TodaysGamesPanel({
  bookings,
  cardProps,
  expanded,
  onBookingSelect,
  onToggle,
}) {
  return (
    <div className="bg-teal-500/10 border border-teal-500/20 rounded-[2rem] p-4 sm:p-5 w-fit max-w-full flex flex-col shrink-0 transition-all duration-300 relative">
      <button
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
        className="flex items-center gap-4 w-full outline-none text-left cursor-pointer group/btn pr-2"
      >
        <span className="text-sm font-black text-teal-600 flex items-center gap-1.5 w-fit bg-white/70 px-3 py-2 rounded-xl shadow-sm pointer-events-none transition-all group-hover/btn:bg-white">
          <Flame size={16} /> 오늘 할 게임
          <span className="text-[10px] bg-teal-200/60 text-teal-800 px-1.5 py-0.5 rounded-md ml-1">
            {bookings.length}
          </span>
        </span>
        <div className="p-2 bg-white/70 text-teal-500 rounded-xl shadow-sm shrink-0 pointer-events-none transition-all group-hover/btn:bg-white">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 flex flex-wrap gap-4 md:gap-6 w-fit max-w-full animate-in fade-in duration-300">
          {bookings.map((booking) => (
            <div key={booking.id} className="party-card-container">
              <PartyCard {...cardProps} b={booking} theme="teal" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 w-full flex flex-wrap gap-2 animate-in fade-in duration-300">
          {bookings.map((booking) => {
            const full = isPartyFull(booking);
            const boxTheme = booking.isClosed
              ? 'border-rose-100 text-rose-700 hover:bg-white'
              : full
                ? 'border-orange-100 text-orange-700 hover:bg-white'
                : 'border-teal-100 text-teal-700 hover:bg-white';
            const timeTheme = booking.isClosed
              ? 'text-rose-500/80'
              : full
                ? 'text-orange-500/80'
                : 'text-teal-500/80';

            return (
              <div
                key={booking.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onBookingSelect(booking.id);
                }}
                className={`bg-white/90 border-2 px-4 py-2.5 rounded-2xl text-[13px] font-black shadow-sm cursor-pointer transition-all flex items-center gap-1.5 truncate max-w-full sm:max-w-[250px] ${boxTheme}`}
              >
                <span className={timeTheme}>{booking.time}</span>
                <span className="truncate">{booking.game}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchPanel({
  expanded,
  query,
  viewMode,
  onQueryChange,
  onToggle,
  onViewModeChange,
}) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-4 sm:p-5 w-fit max-w-full flex flex-col shrink-0 transition-all duration-300 relative">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={(event) => {
            event.preventDefault();
            onToggle();
          }}
          className="flex items-center gap-1.5 bg-white px-4 py-2.5 rounded-2xl shadow-sm text-sm font-black text-amber-600 outline-none hover:bg-slate-50 transition-all select-none"
        >
          <Search size={14} className="text-amber-500" />
          <span>검색하기</span>
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            onToggle();
          }}
          className="p-2.5 bg-white text-amber-500 rounded-2xl shadow-sm outline-none hover:bg-slate-50 transition-all flex items-center justify-center select-none"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded && (
          <div className="flex bg-slate-200/60 p-0.5 rounded-xl select-none border-none shadow-inner items-center w-auto shrink-0 animate-in fade-in duration-200">
            <ViewModeButton
              active={viewMode === 'card'}
              label="카드"
              onClick={() => onViewModeChange('card')}
            />
            <ViewModeButton
              active={viewMode === 'calendar'}
              label="달력"
              onClick={() => onViewModeChange('calendar')}
            />
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 w-72 max-w-full animate-in fade-in duration-300">
          <form
            onSubmit={(event) => event.preventDefault()}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full p-2.5 pr-8 border-2 rounded-xl text-xs font-bold outline-none focus:border-amber-400 bg-white"
                placeholder="닉네임 입력 시 실시간 검색"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-all"
                  title="검색 초기화"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ViewModeButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-1.5 px-3 rounded-lg text-[11px] font-black whitespace-nowrap transition-all duration-200 ${
        active
          ? 'bg-amber-500 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

function ScheduleSection({
  bookings,
  cardProps,
  expanded,
  groupedBookings,
  todayStr,
  onBookingSelect,
  onToggle,
}) {
  return (
    <div className="w-full border-t border-slate-200 pt-8 mt-4">
      <SectionHeader
        expanded={expanded}
        icon={<CalendarDays className="theme-text" size={24} />}
        title="게임 일정"
        onToggle={onToggle}
      />

      {!expanded && (
        <div
          className="px-2 flex flex-wrap items-end gap-3 pb-4 animate-in fade-in duration-300 cursor-pointer"
          onClick={onToggle}
        >
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <CompactBooking
                key={booking.id}
                booking={booking}
                mode="schedule"
                onBookingSelect={onBookingSelect}
              />
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic font-bold pb-2">
              예정된 일정이 없습니다.
            </span>
          )}
        </div>
      )}

      {expanded && (
        <div className="flex flex-wrap gap-4 md:gap-6 w-full pb-10 animate-in slide-in-from-top-4 duration-300 items-start">
          {Object.keys(groupedBookings).length > 0 ? (
            Object.keys(groupedBookings)
              .sort()
              .map((date) => (
                <section key={date} className="flex flex-col w-full">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-teal-600 bg-teal-50 border-teal-100 shadow-sm w-fit">
                    <CalendarDays size={16} />{' '}
                    {date === todayStr ? '오늘' : date}
                  </h3>
                  <div className="flex flex-wrap gap-4 md:gap-6 w-full">
                    {groupedBookings[date].map((booking) => (
                      <div
                        key={booking.id}
                        className="party-card-container transition-all duration-500 animate-in fade-in zoom-in-95"
                      >
                        <PartyCard
                          {...cardProps}
                          b={booking}
                          theme="teal"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))
          ) : (
            <EmptyCards text="예정된 일정이 없습니다." />
          )}
        </div>
      )}
    </div>
  );
}

function StatusSection({
  bookings,
  cardProps,
  cardTheme,
  compactDateClass,
  compactTheme,
  description,
  emptyText,
  expanded,
  icon,
  title,
  titleClass,
  onBookingSelect,
  onToggle,
}) {
  return (
    <div className="w-full space-y-6 mt-10 border-t border-slate-200 pt-8">
      <SectionHeader
        description={description}
        expanded={expanded}
        icon={icon}
        title={title}
        titleClass={titleClass}
        onToggle={onToggle}
      />

      {!expanded && (
        <div
          className="px-2 flex flex-wrap items-end gap-3 pb-4 animate-in fade-in duration-300 cursor-pointer"
          onClick={onToggle}
        >
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <CompactBooking
                key={booking.id}
                booking={booking}
                badgeClass={compactTheme(booking)}
                dateClass={compactDateClass(booking)}
                onBookingSelect={onBookingSelect}
              />
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic font-bold pb-2">
              {emptyText}
            </span>
          )}
        </div>
      )}

      {expanded && (
        <div className="flex flex-wrap gap-4 md:gap-6 w-full pb-4 animate-in slide-in-from-top-4 duration-300 items-start">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="party-card-container transition-all duration-500 animate-in fade-in zoom-in-95"
              >
                <PartyCard
                  {...cardProps}
                  b={booking}
                  theme={cardTheme(booking)}
                />
              </div>
            ))
          ) : (
            <EmptyCards text={emptyText} />
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  description,
  expanded,
  icon,
  title,
  titleClass = 'text-slate-800 group-hover/btn:theme-text',
  onToggle,
}) {
  return (
    <button
      onClick={(event) => {
        event.preventDefault();
        onToggle();
      }}
      className="w-full px-2 flex items-center justify-between cursor-pointer group/btn outline-none text-left mb-6"
    >
      <div className="flex flex-col justify-center">
        <span
          className={`text-xl font-black flex items-center gap-2 transition-colors ${titleClass}`}
        >
          {icon} {title}
        </span>
        {description && (
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] font-black text-slate-500 transition-colors px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 shadow-sm shrink-0 pointer-events-none group-hover/btn:bg-slate-100 group-hover/btn:text-slate-700">
        {expanded ? (
          <>
            <span className="mr-1">접기</span>
            <ChevronUp size={14} className="text-slate-500" />
          </>
        ) : (
          <>
            <span className="mr-1">자세히보기</span>
            <ChevronDown size={14} className="theme-text" />
          </>
        )}
      </div>
    </button>
  );
}

function CompactBooking({
  badgeClass,
  booking,
  dateClass,
  mode,
  onBookingSelect,
}) {
  let resolvedBadgeClass = badgeClass;
  let resolvedDateClass = dateClass;

  if (mode === 'schedule') {
    const full = isPartyFull(booking);
    resolvedBadgeClass = booking.isClosed
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : full
        ? 'border-orange-200 bg-orange-50 text-orange-700'
        : 'border-teal-200 bg-teal-50 text-teal-700';
    resolvedDateClass = booking.isClosed
      ? 'text-rose-600'
      : full
        ? 'text-orange-600'
        : 'text-teal-600';
  }

  const dateLabel = booking.isAlwaysOpen
    ? '상시'
    : `${booking.date.substring(5).replace('-', '/')}${getDayOfWeek(
        booking.date
      )}`;

  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        onBookingSelect(booking.id);
      }}
      className="flex flex-col items-center gap-1.5 transform hover:scale-105 transition-transform"
    >
      <div
        className={`border text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm hover:brightness-95 ${resolvedBadgeClass}`}
      >
        <span className={resolvedDateClass}>{dateLabel}</span>
        <span className="truncate max-w-[120px]">{booking.game}</span>
      </div>
    </div>
  );
}

function EmptyCards({ text }) {
  return (
    <div className="py-16 text-center text-slate-300 font-black italic bg-white border-2 border-dashed rounded-[3rem] w-full">
      {text}
    </div>
  );
}

function CalendarView({
  additionalRecruitingList,
  bookings,
  fullyClosedList,
  recruitingList,
  todayStr,
  viewDate,
  onBookingSelect,
  onViewDateChange,
}) {
  return (
    <div className="w-full mt-6 space-y-8">
      <MonthlyBookingCalendar
        bookings={bookings}
        todayStr={todayStr}
        viewDate={viewDate}
        onBookingSelect={onBookingSelect}
        onViewDateChange={onViewDateChange}
      />
      <div className="bg-slate-100/60 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/60 space-y-6 mt-6 animate-in fade-in duration-500 w-full">
        <h3 className="text-sm font-black text-slate-700 border-b border-slate-200/80 pb-3 flex items-center gap-2">
          <InfinityIcon
            size={18}
            className="text-indigo-500 animate-pulse"
          />
          <span>상시 모집 파티 현황 (실시간 검색어 필터 연동)</span>
        </h3>
        <AlwaysOpenGroup
          label="모집 중"
          emptyText="조건에 맞는 상시 모집 파티가 없습니다."
          bookings={recruitingList}
          emoji="🎮"
          color="indigo"
          onBookingSelect={onBookingSelect}
        />
        <AlwaysOpenGroup
          label="추가 모집 중"
          emptyText="조건에 맞는 추가 상시 모집 파티가 없습니다."
          bookings={additionalRecruitingList}
          emoji="🔥"
          color="orange"
          bordered
          onBookingSelect={onBookingSelect}
        />
        <AlwaysOpenGroup
          label="마감된 파티"
          emptyText="조건에 맞는 마감된 상시 파티가 없습니다."
          bookings={fullyClosedList}
          emoji="🔒"
          color="rose"
          bordered
          onBookingSelect={onBookingSelect}
        />
      </div>
    </div>
  );
}

const ALWAYS_OPEN_COLORS = {
  indigo: {
    label: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    card: 'border-indigo-200 text-indigo-800',
  },
  orange: {
    label: 'text-orange-600 bg-orange-50 border-orange-100',
    card: 'border-orange-200 text-orange-800',
  },
  rose: {
    label: 'text-rose-600 bg-rose-50 border-rose-100',
    card: 'border-rose-200 text-rose-800',
  },
};

function AlwaysOpenGroup({
  bookings,
  bordered,
  color,
  emoji,
  emptyText,
  label,
  onBookingSelect,
}) {
  const alwaysOpenBookings = bookings.filter(
    (booking) => booking.isAlwaysOpen
  );
  const colors = ALWAYS_OPEN_COLORS[color];

  return (
    <div
      className={`space-y-2 ${
        bordered ? 'border-t border-slate-200/60 pt-4' : ''
      }`}
    >
      <span
        className={`text-[11px] font-black border px-2 py-0.5 rounded-md inline-block ${colors.label}`}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-3 pt-1">
        {alwaysOpenBookings.length > 0 ? (
          alwaysOpenBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => onBookingSelect(booking.id)}
              className={`border bg-white text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105 transition-transform ${colors.card}`}
            >
              <span>{emoji}</span>
              <span className="truncate max-w-[150px]">{booking.game}</span>
            </div>
          ))
        ) : (
          <span className="text-[11px] text-slate-400 italic pl-1">
            {emptyText}
          </span>
        )}
      </div>
    </div>
  );
}
