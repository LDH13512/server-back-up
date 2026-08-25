export const RHYTHM_KING_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const RHYTHM_KING_MIN_SONGS = 5;
export const RHYTHM_KING_COUNTED_SONGS = 5;

const numericValue = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizedNickname = (value) => String(value || '').trim().toLocaleLowerCase('ko-KR');

export function calculateRhythmKingStandings(songLeaderboards = []) {
  const players = new Map();

  songLeaderboards.forEach((records, songIndex) => {
    const bestByNickname = new Map();

    records.forEach((record) => {
      const name = String(record?.nickname || '').trim();
      const key = normalizedNickname(name);
      const score = numericValue(record?.score, Number.NaN);
      if (!key || !Number.isFinite(score)) return;

      const entry = {
        name,
        key,
        songIndex,
        score,
        accuracy: numericValue(record?.accuracy),
        maxCombo: numericValue(record?.maxCombo),
        timestamp: numericValue(record?.timestamp, Number.MAX_SAFE_INTEGER),
      };
      const current = bestByNickname.get(key);
      if (!current || score > current.score || (score === current.score && entry.timestamp < current.timestamp)) {
        bestByNickname.set(key, entry);
      }
    });

    [...bestByNickname.values()]
      .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp || a.key.localeCompare(b.key, 'ko-KR'))
      .forEach((entry, placementIndex) => {
        const player = players.get(entry.key) || { key: entry.key, name: entry.name, songs: [] };
        player.name = entry.name;
        player.songs.push({
          ...entry,
          placement: placementIndex + 1,
          points: RHYTHM_KING_POINTS[placementIndex] || 0,
        });
        players.set(entry.key, player);
      });
  });

  const candidates = [...players.values()]
    .filter((player) => player.songs.length >= RHYTHM_KING_MIN_SONGS)
    .map((player) => {
      const countedSongs = [...player.songs]
        .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.maxCombo - a.maxCombo || a.timestamp - b.timestamp)
        .slice(0, RHYTHM_KING_COUNTED_SONGS);
      return {
        ...player,
        totalPoints: countedSongs.reduce((total, song) => total + song.points, 0),
        firstPlaceCount: player.songs.filter((song) => song.placement === 1).length,
        averageAccuracy: countedSongs.reduce((total, song) => total + song.accuracy, 0) / countedSongs.length,
        comboTotal: countedSongs.reduce((total, song) => total + song.maxCombo, 0),
        achievedAt: Math.max(...countedSongs.map((song) => song.timestamp)),
        countedSongs,
      };
    })
    .sort((a, b) =>
      b.totalPoints - a.totalPoints ||
      b.firstPlaceCount - a.firstPlaceCount ||
      b.averageAccuracy - a.averageAccuracy ||
      b.comboTotal - a.comboTotal ||
      a.achievedAt - b.achievedAt ||
      a.key.localeCompare(b.key, 'ko-KR')
    );

  return candidates;
}

export function calculateRhythmKing(songLeaderboards = []) {
  return calculateRhythmKingStandings(songLeaderboards)[0] || null;
}
