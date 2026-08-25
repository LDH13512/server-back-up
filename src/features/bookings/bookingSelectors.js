export const isPartyFull = (booking) =>
  (1 + (booking.participants?.length || 0)) >= parseInt(booking.capacity);

export const isActuallyClosed = (booking) =>
  booking.isClosed || isPartyFull(booking);

export const selectBookingDashboardData = ({
  bookings,
  logs = [],
  logPage = 1,
  logsPerPage = 10,
  recommendedBookingId,
  searchQuery,
  todayStr,
}) => {
  const cleanQuery = searchQuery.toLowerCase().trim();
  const filteredBookings = bookings.filter((booking) => {
    if (!cleanQuery) return true;

    return (
      booking.game?.toLowerCase().includes(cleanQuery) ||
      booking.nickname?.toLowerCase().includes(cleanQuery) ||
      booking.description?.toLowerCase().includes(cleanQuery) ||
      booking.participants?.some((participant) =>
        participant.toLowerCase().includes(cleanQuery)
      )
    );
  });

  const scheduledList = filteredBookings.filter(
    (booking) => !booking.isAlwaysOpen
  );

  const groupedBookings = scheduledList.reduce((groups, booking) => {
    if (!groups[booking.date]) groups[booking.date] = [];
    groups[booking.date].push(booking);
    return groups;
  }, {});

  const newestFirst = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);

  return {
    filteredBookings,
    recommendedGame: recommendedBookingId
      ? bookings.find((booking) => booking.id === recommendedBookingId)
      : null,
    groupedBookings,
    scheduledList,
    recruitingList: filteredBookings
      .filter((booking) => !isActuallyClosed(booking))
      .sort(newestFirst),
    additionalRecruitingList: filteredBookings
      .filter((booking) => !booking.isClosed && isPartyFull(booking))
      .sort(newestFirst),
    fullyClosedList: filteredBookings
      .filter((booking) => booking.isClosed)
      .sort(newestFirst),
    todaysGames: filteredBookings.filter(
      (booking) => !booking.isAlwaysOpen && booking.date === todayStr
    ),
    currentLogs: logs.slice(
      (logPage - 1) * logsPerPage,
      logPage * logsPerPage
    ),
    totalLogPages: Math.ceil(logs.length / logsPerPage),
  };
};
