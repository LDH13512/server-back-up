import { useEffect, useMemo, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  DEFAULT_PASSWORD,
  minigameApp,
  minigameDb,
} from '../config/firebase';
import {
  getGameForDayNumber,
  getKSTDayNumber,
  mergeGameRegistrations,
} from '../config/minigames';
import { getKSTDateString } from '../utils/helpers';

const EMPTY_ASSETS = () => Array(7).fill('');

export default function useArcadeRealtimeData(appId) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [registeredMinigames, setRegisteredMinigames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [masterPassword, setMasterPassword] = useState(DEFAULT_PASSWORD);
  const [customAssets, setCustomAssets] = useState(EMPTY_ASSETS);
  const [bgImage, setBgImage] = useState('');
  const minigames = useMemo(
    () => mergeGameRegistrations(registeredMinigames),
    [registeredMinigames]
  );

  const addLog = async (details, rollbackData = null) => {
    if (!user) return;

    try {
      const payload = {
        details,
        timestamp: Date.now(),
        uid: user.uid,
      };
      if (rollbackData) payload.rollbackData = rollbackData;
      await addDoc(collection(db, 'logs'), payload);
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;

    const authenticate = async () => {
      try {
        if (
          typeof __initial_auth_token !== 'undefined' &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch {}
    };

    authenticate();
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      if (!isMounted) return;
      setUser(authenticatedUser);
      setAuthReady(!!authenticatedUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !user) return undefined;

    const checkWeeklyReset = async () => {
      const now = new Date();
      const systemRef = doc(db, 'system', 'lastReset');

      try {
        const snapshot = await getDoc(systemRef);
        const lastResetTime = snapshot.exists()
          ? snapshot.data().timestamp
          : 0;
        const currentSunday = new Date(now);
        currentSunday.setDate(now.getDate() - now.getDay());
        currentSunday.setHours(0, 0, 0, 0);

        if (lastResetTime < currentSunday.getTime()) {
          const logsSnapshot = await getDocs(collection(db, 'logs'));
          const batch = writeBatch(db);
          logsSnapshot.docs.forEach((logDocument) =>
            batch.delete(logDocument.ref)
          );
          await batch.commit();
          await setDoc(systemRef, { timestamp: Date.now() });
          addLog('매주 일요일 정기 시스템 초기화가 수행되었습니다.');
        }
      } catch {}
    };

    const checkMinigameDailyReset = async (gameCatalog) => {
      const todayDayNumber = getKSTDayNumber();
      const todayGame = getGameForDayNumber(todayDayNumber, gameCatalog);
      const systemRef = doc(db, 'system', 'lastMinigameReset');

      try {
        const snapshot = await getDoc(systemRef);
        const resetData = snapshot.exists() ? snapshot.data() : {};
        const isTodayGameAlreadyReset =
          resetData.dayNumber === todayDayNumber &&
          resetData.gameId === todayGame.id;

        // 날짜뿐 아니라 게임 id까지 일치해야 완료로 인정합니다.
        // 과거처럼 예약 코드와 게시판 목록이 어긋나 잘못된 게임을 지운 경우,
        // 사이트 방문 시 오늘 게임의 리더보드를 다시 올바르게 초기화합니다.
        if (isTodayGameAlreadyReset) return;

        const minigameAuth = getAuth(minigameApp);
        if (!minigameAuth.currentUser) {
          await signInAnonymously(minigameAuth);
        }

        for (const rank of todayGame.ranks) {
          const rankingSnapshot = await getDocs(
            collection(minigameDb, ...rank.path)
          );
          if (!rankingSnapshot.empty) {
            const batch = writeBatch(minigameDb);
            rankingSnapshot.docs.forEach((rankingDocument) =>
              batch.delete(rankingDocument.ref)
            );
            await batch.commit();
          }
        }

        await setDoc(systemRef, {
          dayNumber: todayDayNumber,
          timestamp: Date.now(),
          gameId: todayGame.id,
          date: getKSTDateString(Date.now()),
        });
        addLog(`일일 미니게임 리더보드 초기화 완료: [${todayGame.name}]`);
      } catch (error) {
        console.error('미니게임 일일 리셋 에러: ', error);
      }
    };

    const cleanupExpiredParties = async (currentBookings) => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneMonth = 30 * oneDay;
      const expiredParties = currentBookings.filter((booking) => {
        if (booking.isAlwaysOpen) {
          const baseTime = booking.closedAt || booking.createdAt || now;
          const extraTime = (booking.extraDays || 0) * oneDay;
          return now - baseTime > oneMonth + extraTime;
        }

        const [year, month, day] = (
          booking.date || getKSTDateString(now)
        )
          .split('-')
          .map(Number);
        return new Date(year, month - 1, day + 1, 0, 0, 0).getTime() < now;
      });

      if (expiredParties.length === 0) return;

      const batch = writeBatch(db);
      expiredParties.forEach((booking) => {
        batch.delete(doc(db, 'bookings', booking.id));
        addLog(`${booking.game} 파티가 기한 만료로 삭제되었습니다.`, {
          type: 'delete',
          data: booking,
        });
      });
      await batch.commit();
    };

    checkWeeklyReset();

    const unsubscribeBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const sortedBookings = snapshot.docs
          .map((bookingDocument) => ({
            id: bookingDocument.id,
            ...bookingDocument.data(),
          }))
          .sort((a, b) => {
            if (a.isAlwaysOpen !== b.isAlwaysOpen) {
              return a.isAlwaysOpen ? -1 : 1;
            }
            if (a.date !== b.date) {
              return (a.date || '').localeCompare(b.date || '');
            }
            return (a.time || '').localeCompare(b.time || '');
          });

        setBookings(sortedBookings);
        cleanupExpiredParties(sortedBookings);
      }
    );

    const unsubscribeLogs = onSnapshot(
      collection(db, 'logs'),
      (snapshot) => {
        setLogs(
          snapshot.docs
            .map((logDocument) => ({
              id: logDocument.id,
              ...logDocument.data(),
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
        );
      }
    );

    const unsubscribeSuggestions = onSnapshot(
      collection(db, 'suggestions'),
      (snapshot) => {
        setSuggestions(
          snapshot.docs
            .map((suggestionDocument) => ({
              id: suggestionDocument.id,
              ...suggestionDocument.data(),
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
        );
      }
    );

    const unsubscribeReports = onSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        setReports(
          snapshot.docs
            .map((reportDocument) => ({
              id: reportDocument.id,
              ...reportDocument.data(),
            }))
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      }
    );

    const unsubscribeMinigames = onSnapshot(
      collection(db, 'minigames'),
      (snapshot) => {
        const registrations = snapshot.docs
          .map((gameDocument) => ({
            ...gameDocument.data(),
            id: gameDocument.id,
          }))
          .sort(
            (a, b) =>
              Number(a.createdAt || 0) - Number(b.createdAt || 0) ||
              String(a.id).localeCompare(String(b.id))
          );
        setRegisteredMinigames(registrations);
        void checkMinigameDailyReset(
          mergeGameRegistrations(registrations)
        );
      },
      (error) => {
        console.error('관리자 등록 미니게임 로드 실패: ', error);
      }
    );

    const unsubscribeConfig = onSnapshot(
      doc(db, 'system', 'config'),
      (snapshot) => {
        if (snapshot.exists() && snapshot.data().masterPassword) {
          setMasterPassword(snapshot.data().masterPassword);
        }
      }
    );

    const unsubscribeAssets = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'config', 'assets'),
      (snapshot) => {
        if (snapshot.exists() && snapshot.data().images) {
          const fetchedAssets = snapshot.data().images;
          setCustomAssets(
            EMPTY_ASSETS().map((_, index) => fetchedAssets[index] || '')
          );
        }
      }
    );

    const unsubscribeBackground = onSnapshot(
      doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'config',
        'background'
      ),
      (snapshot) => {
        if (snapshot.exists() && snapshot.data().bgImage) {
          setBgImage(snapshot.data().bgImage);
        }
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeLogs();
      unsubscribeMinigames();
      unsubscribeReports();
      unsubscribeSuggestions();
      unsubscribeConfig();
      unsubscribeAssets();
      unsubscribeBackground();
    };
  }, [appId, authReady, user]);

  return {
    addLog,
    authReady,
    bgImage,
    bookings,
    customAssets,
    logs,
    masterPassword,
    minigames,
    registeredMinigames,
    reports,
    setBgImage,
    setMasterPassword,
    suggestions,
    user,
  };
}
