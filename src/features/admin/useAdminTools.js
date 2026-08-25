import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, minigameDb } from '../../config/firebase';
import { getMinigamePaths } from '../../config/minigames';

const EMPTY_PASSWORD_DATA = {
  current: '',
  new: '',
  confirm: '',
  error: '',
};

const EMPTY_CONFIRM_MODAL = {
  isOpen: false,
  password: '',
  error: '',
};

export default function useAdminTools({
  addLog,
  appId,
  backgroundImage,
  bookings,
  customAssets,
  gameCatalog,
  logs,
  masterPassword,
  notify,
  setBackgroundImage,
  setMasterPassword,
  todayStr,
}) {
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD_DATA);
  const [adminAssets, setAdminAssets] = useState(Array(7).fill(''));
  const [adminBgImage, setAdminBgImage] = useState('');
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [isMinigameResetConfirming, setIsMinigameResetConfirming] =
    useState(false);
  const [isResettingMinigames, setIsResettingMinigames] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [importDataTxt, setImportDataTxt] = useState('');
  const [parsedImportData, setParsedImportData] = useState([]);
  const [deleteAllModal, setDeleteAllModal] = useState(EMPTY_CONFIRM_MODAL);
  const [destroyServerModal, setDestroyServerModal] =
    useState(EMPTY_CONFIRM_MODAL);
  const [isServerDestroyed, setIsServerDestroyed] = useState(false);

  const logsPerPage = 10;
  const currentLogs = logs.slice(
    (logPage - 1) * logsPerPage,
    logPage * logsPerPage
  );
  const totalLogPages = Math.ceil(logs.length / logsPerPage);

  useEffect(() => {
    setAdminAssets(customAssets);
  }, [customAssets]);

  useEffect(() => {
    setAdminBgImage(backgroundImage);
  }, [backgroundImage]);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (passwordData.current !== masterPassword) {
      notify('현재 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    if (!passwordData.new.trim()) {
      notify('새 비밀번호를 입력하세요.', 'error');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      notify('새 비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    try {
      const nextPassword = passwordData.new.trim();
      await setDoc(
        doc(db, 'system', 'config'),
        { masterPassword: nextPassword },
        { merge: true }
      );
      setMasterPassword(nextPassword);
      setPasswordData(EMPTY_PASSWORD_DATA);
      notify('마스터 비밀번호가 변경되었습니다.');
    } catch {
      notify('비밀번호 변경 실패', 'error');
    }
  };

  const saveCustomAssets = async () => {
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'config', 'assets'),
        { images: adminAssets },
        { merge: true }
      );
      notify('캐릭터 이미지가 저장되었습니다.');
    } catch {
      notify('이미지 저장 실패', 'error');
    }
  };

  const saveBgImage = async () => {
    try {
      await setDoc(
        doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'config',
          'background'
        ),
        { bgImage: adminBgImage },
        { merge: true }
      );
      setBackgroundImage(adminBgImage);
      notify('배경화면이 저장되었습니다.');
    } catch {
      notify('배경화면 저장 실패', 'error');
    }
  };

  const clearLogs = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'logs'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((logDocument) =>
        batch.delete(logDocument.ref)
      );
      await batch.commit();
      setIsResetConfirming(false);
      notify('활동 로그가 초기화되었습니다.');
    } catch {
      notify('로그 초기화 실패', 'error');
    }
  };

  const handleRollback = async (logId, rollbackData) => {
    if (!rollbackData || rollbackData.restored) return;

    try {
      if (rollbackData.type === 'delete') {
        const booking = rollbackData.data;
        await setDoc(doc(db, 'bookings', booking.id), {
          game: booking.game,
          nickname: booking.nickname,
          password: booking.password,
          capacity: booking.capacity,
          isAlwaysOpen: booking.isAlwaysOpen,
          date: booking.date,
          time: booking.time,
          description: booking.description,
          participants: booking.participants || [],
          isClosed: booking.isClosed || false,
          createdAt: booking.createdAt || Date.now(),
          comments: booking.comments || [],
        });
      }
      await updateDoc(doc(db, 'logs', logId), {
        'rollbackData.restored': true,
      });
      notify('성공적으로 복원되었습니다!');
    } catch {
      notify('복원 실패', 'error');
    }
  };

  const clearCollections = async () => {
    for (const collectionName of ['bookings', 'logs', 'suggestions']) {
      const snapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      snapshot.docs.forEach((dataDocument) =>
        batch.delete(dataDocument.ref)
      );
      await batch.commit();
    }
  };

  const handleClearAllData = async (event) => {
    event.preventDefault();
    if (deleteAllModal.password !== masterPassword) {
      setDeleteAllModal((previous) => ({
        ...previous,
        error: '비밀번호가 일치하지 않습니다.',
      }));
      return;
    }

    try {
      await clearCollections();
      setDeleteAllModal(EMPTY_CONFIRM_MODAL);
      notify('모든 데이터가 완전히 초기화되었습니다.');
    } catch {
      notify('데이터 초기화 실패', 'error');
    }
  };

  const handleResetMinigames = async () => {
    setIsResettingMinigames(true);
    try {
      for (const path of getMinigamePaths(gameCatalog)) {
        const snapshot = await getDocs(collection(minigameDb, ...path));
        const batch = writeBatch(minigameDb);
        snapshot.docs.forEach((rankingDocument) =>
          batch.delete(rankingDocument.ref)
        );
        await batch.commit();
      }
      notify('모든 미니게임의 랭킹 데이터가 완벽히 초기화되었습니다!');
      setIsMinigameResetConfirming(false);
    } catch (error) {
      console.error('미니게임 리셋 에러: ', error);
      notify('미니게임 데이터 초기화 실패', 'error');
    }
    setIsResettingMinigames(false);
  };

  const handleDestroyServer = async (event) => {
    event.preventDefault();
    if (destroyServerModal.password !== masterPassword) {
      setDestroyServerModal((previous) => ({
        ...previous,
        error: '비밀번호가 일치하지 않습니다.',
      }));
      return;
    }

    try {
      await clearCollections();
      setIsServerDestroyed(true);
      setDestroyServerModal(EMPTY_CONFIRM_MODAL);
      notify('서버가 영구적으로 파괴되었습니다.', 'error');
    } catch {
      notify('서버 파괴 실패', 'error');
    }
  };

  const parseCSVText = (text) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length <= 1) {
      setParsedImportData([]);
      return;
    }

    const results = [];
    for (let index = 1; index < lines.length; index += 1) {
      const parts = lines[index]
        .split(',')
        .map((part) => part.replace(/^["']|["']$/g, '').trim());
      if (parts.length >= 2) {
        results.push({
          game: parts[0],
          nickname: parts[1],
          capacity: parts[2] || '4',
          date: parts[3] || '',
          time: parts[4] || '상시',
          password: parts[5] || masterPassword,
          description: parts[6] || '',
          participants: parts[7]
            ? parts[7]
                .split('|')
                .map((participant) => participant.trim())
                .filter((participant) => participant.length > 0)
            : [],
          comments: [],
        });
      }
    }
    setParsedImportData(results);
  };

  useEffect(() => {
    if (importDataTxt.trim()) parseCSVText(importDataTxt);
    else setParsedImportData([]);
  }, [importDataTxt, masterPassword]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const text = readerEvent.target.result;
      setImportDataTxt(text);
      parseCSVText(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const importDataSubmit = async () => {
    if (parsedImportData.length === 0) return;

    try {
      const batch = writeBatch(db);
      parsedImportData.forEach((booking) => {
        const newDocument = doc(collection(db, 'bookings'));
        batch.set(newDocument, {
          game: booking.game,
          nickname: booking.nickname,
          capacity: booking.capacity,
          isAlwaysOpen: booking.time === '상시' || !booking.date,
          date: booking.time === '상시' ? '' : booking.date,
          time: booking.time,
          password: booking.password,
          description: booking.description,
          participants: booking.participants,
          isClosed: false,
          createdAt: Date.now(),
          comments: [],
        });
      });
      await batch.commit();
      addLog(
        `관리자가 CSV 데이터를 통해 파티 ${parsedImportData.length}개를 일괄 추가했습니다.`
      );
      notify(
        `파티 ${parsedImportData.length}개가 성공적으로 추가되었습니다!`
      );
      setImportDataTxt('');
      setParsedImportData([]);
    } catch {
      notify('일괄 추가 실패', 'error');
    }
  };

  const exportData = () => {
    const rows = [
      [
        '게임',
        '파티장닉네임',
        '최대정원',
        '날짜',
        '시간',
        '비밀번호',
        '설명',
        '참가자',
        '댓글',
      ].join(','),
    ];

    bookings.forEach((booking) => {
      const time = booking.isAlwaysOpen
        ? '상시'
        : booking.isTimeUndecided
          ? '미정'
          : booking.time;
      rows.push(
        [
          `"${booking.game || ''}"`,
          `"${booking.nickname || ''}"`,
          `"${booking.capacity || '4'}"`,
          `"${booking.date || ''}"`,
          `"${time || ''}"`,
          `"${booking.password || masterPassword}"`,
          `"${(booking.description || '').replace(/\n/g, ' ')}"`,
          `"${(booking.participants || []).join(' | ')}"`,
          `"${
            booking.comments
              ?.map((comment) => `${comment.author}:${comment.content}`)
              .join(' | ') || ''
          }"`,
        ].join(',')
      );
    });

    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rows.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings_export_${todayStr}.csv`;
    link.click();
  };

  const handleAdminAssetChange = (index, image) => {
    setAdminAssets((previous) => {
      const next = [...previous];
      next[index] = image;
      return next;
    });
  };

  return {
    adminAssets,
    adminBgImage,
    clearLogs,
    currentLogs,
    deleteAllModal,
    destroyServerModal,
    exportData,
    handleAdminAssetChange,
    handleClearAllData,
    handleDestroyServer,
    handleFileUpload,
    handlePasswordChange,
    handleResetMinigames,
    handleRollback,
    importDataSubmit,
    importDataTxt,
    isMinigameResetConfirming,
    isResetConfirming,
    isResettingMinigames,
    isServerDestroyed,
    logPage,
    parsedImportCount: parsedImportData.length,
    passwordData,
    saveBgImage,
    saveCustomAssets,
    setAdminBgImage,
    setDeleteAllModal,
    setDestroyServerModal,
    setImportDataTxt,
    setIsMinigameResetConfirming,
    setIsResetConfirming,
    setLogPage,
    setPasswordData,
    totalLogPages,
  };
}
