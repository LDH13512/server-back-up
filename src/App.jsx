import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

// 🔹 모듈화 조건: 분리 배정된 Firebase 인스턴스 전용 모듈 연동
import { db, themeColor } from './config/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { MASTER_GAMES } from './config/minigames';

// 🔹 모듈화 조건: 외부 파일로 분리 정돈된 유틸리티 함수 전용 모듈 연동
import { getKSTDateString, callGeminiAPI } from './utils/helpers';
import {
  copyBookingForKakao,
  DEFAULT_KAKAO_SHARE_INTRO,
  getDefaultKakaoShareIntro,
  KAKAO_SHARE_INTRO_MAX_LENGTH,
  validateKakaoShareIntro,
} from './utils/kakaoShare';

// 🔹 모듈화 조건: 외부 파일로 모듈화된 서브 컴포넌트 유닛들 연동
import BookingForm from './components/BookingForm';
import MiniGameModal from './components/MiniGameModal';
import JoinPartyDialog from './features/bookings/components/JoinPartyDialog';
import EditBookingDialog from './features/bookings/components/EditBookingDialog';
import BookingDetailDialog from './features/bookings/components/BookingDetailDialog';
import AdminPanel from './features/admin/AdminPanel';
import BookingDashboard from './features/bookings/components/BookingDashboard';
import {
  isActuallyClosed,
} from './features/bookings/bookingSelectors';
import {
  CommentActionDialog,
  DeleteAllDataDialog,
  DestroyServerDialog,
  FallingItems,
  LeavePartyDialog,
  SecurityDialog,
  SuggestionDialog,
} from './components/dialogs/CommonDialogs';
import {
  AppHeader,
  AppStyles,
  BackgroundLayer,
  CreateBookingButton,
  LoadingScreen,
  NotificationToast,
  UserGuideButton,
} from './components/layout/AppChrome';
import useArcadeRealtimeData from './hooks/useArcadeRealtimeData';
import useEasterEgg from './hooks/useEasterEgg';
import useAdminTools from './features/admin/useAdminTools';
import { SiteFooter } from './components/layout/SiteInfo';
import SiteInformationDialog from './components/dialogs/SiteInformationDialog';
import KakaoShareDialog from './components/dialogs/KakaoShareDialog';
import UserGuideDialog from './components/dialogs/UserGuideDialog';
import ReportDialog from './features/reports/ReportDialog';
import { validateCommunityFields } from './utils/contentModeration';

const USER_GUIDE_DISMISSAL_KEY = 'arcade-user-guide-dismissed-v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMiniGameModalOpen, setIsMiniGameModalOpen] = useState(false);
  const [siteInformationPage, setSiteInformationPage] = useState(null);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [notification, setNotification] = useState(null);
  
  const [joiningBooking, setJoiningBooking] = useState(null);
  const [joinNickname, setJoinNickname] = useState("");
  
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const {
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
  } = useArcadeRealtimeData(appId);
  
  const [joinSchedule, setJoinSchedule] = useState({ 
    enabled: false, dates: [], hour: "12", minute: "00", isTimeUndecided: false 
  });
  const [calViewDate, setCalViewDate] = useState(new Date());

  const [leaveModal, setLeaveModal] = useState({ isOpen: false, targetBooking: null, targetParticipantIndex: null, inputNickname: "", error: "" });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });

  const [detailModalBookingId, setDetailModalBookingId] = useState(null);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [commentInput, setCommentInput] = useState({ author: '', content: '' });
  
  const [commentActionModal, setCommentActionModal] = useState({ isOpen: false, type: '', bookingId: '', commentId: '', authorInput: '', newContent: '', error: '' });
  
  const [suggestionModal, setSuggestionModal] = useState({ isOpen: false, text: '', nickname: '', isAnonymous: false });
  const [kakaoShareModal, setKakaoShareModal] = useState({
    isOpen: false,
    booking: null,
    intro: DEFAULT_KAKAO_SHARE_INTRO,
    isGenerating: false,
    error: '',
  });
  const [reportTarget, setReportTarget] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [recommendedData, setRecommendedData] = useState({ id: null, hour: null });
  
  const [isEditingTitleAI, setIsEditingTitleAI] = useState(false);
  const [isEditingDescAI, setIsEditingDescAI] = useState(false);

  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    try {
      if (window.localStorage.getItem(USER_GUIDE_DISMISSAL_KEY) !== 'true') {
        setIsUserGuideOpen(true);
      }
    } catch {
      setIsUserGuideOpen(true);
    }
  }, [authReady]);

  const todayStr = getKSTDateString(currentTimestamp);

  const [securityModal, setSecurityModal] = useState({ 
    isOpen: false, type: null, targetBooking: null, targetParticipantIndex: null, password: "", error: "" 
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const closeKakaoShareDialog = () => {
    setKakaoShareModal({
      isOpen: false,
      booking: null,
      intro: DEFAULT_KAKAO_SHARE_INTRO,
      isGenerating: false,
      error: '',
    });
  };

  const handleKakaoShare = (booking) => {
    setKakaoShareModal({
      isOpen: true,
      booking,
      intro: getDefaultKakaoShareIntro(booking),
      isGenerating: false,
      error: '',
    });
  };

  const handleKakaoIntroChange = (intro) => {
    setKakaoShareModal((previous) => ({
      ...previous,
      intro: Array.from(intro).slice(0, KAKAO_SHARE_INTRO_MAX_LENGTH).join(''),
      error: '',
    }));
  };

  const handleKakaoIntroGenerate = async () => {
    if (!kakaoShareModal.booking || kakaoShareModal.isGenerating) return;

    setKakaoShareModal((previous) => ({
      ...previous,
      isGenerating: true,
      error: '',
    }));

    let intro = DEFAULT_KAKAO_SHARE_INTRO;
    try {
      const generated = await callGeminiAPI('kakao-share-intro', {
        game: kakaoShareModal.booking.game,
      });
      const cleaned = Array.from(
        generated.replace(/['"]/g, '').replace(/[\r\n]+/g, ' ').trim()
      )
        .slice(0, 30)
        .join('');
      const validation = validateKakaoShareIntro(cleaned);
      intro = validation.ok ? validation.value : DEFAULT_KAKAO_SHARE_INTRO;
    } catch {
      intro = DEFAULT_KAKAO_SHARE_INTRO;
    }

    setKakaoShareModal((previous) =>
      previous.isOpen
        ? {
            ...previous,
            intro,
            isGenerating: false,
            error: '',
          }
        : previous
    );
  };

  const handleKakaoCopy = async (event) => {
    event.preventDefault();

    const validation = validateKakaoShareIntro(kakaoShareModal.intro);
    if (!validation.ok) {
      setKakaoShareModal((previous) => ({
        ...previous,
        error: validation.error,
      }));
      return;
    }

    const { copied } = await copyBookingForKakao(
      kakaoShareModal.booking,
      validation.value
    );

    if (!copied) {
      showNotification(
        '카드 정보 복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.',
        'error'
      );
      return;
    }

    closeKakaoShareDialog();
    showNotification(
      '카드 정보가 복사되었습니다. 원하는 카카오톡 대화방에 붙여넣어 주세요.'
    );
  };
  const {
    fallingItems,
    handleHeaderClick,
    isBackgroundActive: isBgActive,
  } = useEasterEgg({
    backgroundImage: bgImage,
    notify: showNotification,
  });
  const {
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
    parsedImportCount,
    passwordData: pwdChangeData,
    saveBgImage,
    saveCustomAssets,
    setAdminBgImage,
    setDeleteAllModal,
    setDestroyServerModal,
    setImportDataTxt,
    setIsMinigameResetConfirming,
    setIsResetConfirming,
    setLogPage,
    setPasswordData: setPwdChangeData,
    totalLogPages,
  } = useAdminTools({
    addLog,
    appId,
    backgroundImage: bgImage,
    bookings,
    customAssets,
    gameCatalog: minigames,
    logs,
    masterPassword,
    notify: showNotification,
    setBackgroundImage: setBgImage,
    setMasterPassword,
    todayStr,
  });

  const saveMinigameRegistration = async (game) => {
    const existingGame = registeredMinigames.find(
      (registeredGame) => registeredGame.id === game.id
    );
    try {
      await setDoc(doc(db, 'minigames', game.id), {
        id: game.id,
        name: game.name,
        label: game.label,
        createdAt: existingGame?.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
      addLog(
        `미니게임 ${existingGame ? '정보 수정' : '신규 등록'}: [${game.name}]`
      );
      showNotification(
        existingGame
          ? '미니게임 정보가 수정되었습니다.'
          : '새 미니게임이 게시판과 자동 초기화 목록에 등록되었습니다.'
      );
    } catch (error) {
      showNotification('미니게임 정보 저장에 실패했습니다.', 'error');
      throw error;
    }
  };

  const deleteMinigameRegistration = async (game) => {
    try {
      await deleteDoc(doc(db, 'minigames', game.id));
      addLog(`관리자 등록 미니게임 삭제: [${game.name}]`);
      showNotification(
        '게임 등록을 삭제했습니다. 게임 파일과 리더보드 기록은 유지됩니다.'
      );
    } catch (error) {
      showNotification('미니게임 등록 삭제에 실패했습니다.', 'error');
      throw error;
    }
  };

  const openSecurityModal = (modalData) => {
    setSecurityModal({
      isOpen: modalData.isOpen || false, type: modalData.type || null, targetBooking: modalData.targetBooking || null,
      targetParticipantIndex: modalData.targetParticipantIndex ?? null, password: "", error: ""
    });
  };

  const openLeaveModal = (targetBooking, targetParticipantIndex) => {
    setLeaveModal({ isOpen: true, targetBooking, targetParticipantIndex, inputNickname: "", error: "" });
  };

  const closeJoinModal = () => {
    setJoiningBooking(null);
    setJoinSchedule({
      enabled: false,
      dates: [],
      hour: "12",
      minute: "00",
      isTimeUndecided: false,
    });
    setJoinNickname("");
    setCalViewDate(new Date());
  };

  const openReport = (target) => {
    const normalized = target?.booking
      ? target
      : { targetType: 'booking', booking: target };
    const booking = normalized?.booking;
    if (!booking) return;

    const isComment = normalized.targetType === 'comment';
    setReportTarget({
      ...normalized,
      targetLabel: isComment
        ? `${booking.game} · 댓글`
        : `${booking.game} · 모집글`,
    });
  };

  const closeReport = () => {
    if (!isSubmittingReport) setReportTarget(null);
  };

  const submitReport = async ({ category, reason, reporterNickname }) => {
    if (!reportTarget?.booking || isSubmittingReport) return;

    const validation = validateCommunityFields([
      {
        key: 'reason',
        value: reason,
        label: '신고 내용',
        maxLength: 500,
      },
      {
        key: 'reporterNickname',
        value: reporterNickname,
        label: '신고자 닉네임',
        maxLength: 20,
      },
    ]);
    if (!validation.ok) {
      showNotification(validation.error, 'error');
      return;
    }

    const { booking, comment, targetType, targetLabel } = reportTarget;
    setIsSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        bookingId: booking.id,
        bookingTitle: booking.game,
        category,
        commentId: comment?.id || null,
        contentSnapshot:
          targetType === 'comment'
            ? comment?.content || ''
            : booking.description || '',
        reason: validation.values.reason,
        reporterNickname: validation.values.reporterNickname,
        status: 'pending',
        targetLabel,
        targetType: targetType || 'booking',
      });
      showNotification('신고가 접수되었습니다. 운영진이 확인 후 처리합니다.');
      setReportTarget(null);
    } catch (error) {
      showNotification('신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      showNotification('신고 상태를 변경했습니다.');
    } catch {
      showNotification('신고 상태 변경에 실패했습니다.', 'error');
    }
  };

  const removeReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      showNotification('신고 기록을 삭제했습니다.');
    } catch {
      showNotification('신고 기록 삭제에 실패했습니다.', 'error');
    }
  };

  const deleteReportedContent = async (report) => {
    try {
      if (report.targetType === 'comment') {
        const booking = bookings.find((item) => item.id === report.bookingId);
        if (!booking) throw new Error('BOOKING_NOT_FOUND');
        await updateDoc(doc(db, 'bookings', booking.id), {
          comments: (booking.comments || []).filter(
            (comment) => comment.id !== report.commentId
          ),
        });
      } else {
        await deleteDoc(doc(db, 'bookings', report.bookingId));
      }
      await updateReportStatus(report.id, 'resolved');
    } catch {
      showNotification('신고 대상 삭제에 실패했습니다.', 'error');
    }
  };

  const openCommentAction = (bookingId, commentId, type, content = "") => {
    setCommentActionModal({ isOpen: true, type, bookingId, commentId, authorInput: "", newContent: content, error: "" });
  };

  const closeDetailModal = () => {
    setDetailModalBookingId(null);
    setShowParticipantList(false);
  };

  const openJoinFromDetail = (booking) => {
    setDetailModalBookingId(null);
    setJoiningBooking(booking);
  };

  const openSecurityFromDetail = (type, booking) => {
    setDetailModalBookingId(null);
    openSecurityModal({
      isOpen: true,
      type,
      targetBooking: booking,
    });
  };

  // 🔹 랜덤 추천 파티 제어용 연산 로직
  useEffect(() => {
    if (bookings.length > 0 && !recommendedData.id) {
      const openGames = bookings.filter(b => !isActuallyClosed(b));
      if (openGames.length > 0) {
        const randGame = openGames[Math.floor(Math.random() * openGames.length)];
        setRecommendedData({ id: randGame.id, hour: new Date().getHours() });
      }
    }
  }, [bookings, recommendedData.id]);

  // 1. 관리자 비밀번호 검증 실행 핸들러
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminInput === masterPassword) {
      setIsAdminAuthenticated(true);
      setAdminInput("");
      showNotification("관리자 인증에 성공했습니다.");
    } else {
      showNotification("비밀번호가 일치하지 않습니다.", "error");
    }
  };

  // 2. 유저 파티 참가(합류) 신청 처리 핸들러
  const handleJoin = async () => {
    if (!joinNickname.trim()) return showNotification("닉네임을 입력하세요.", "error");
    if (!joiningBooking) return;
    const bookingToJoin = joiningBooking;
    const inputNickname = joinNickname.trim();
    
    try {
      const updatedParticipants = [...(bookingToJoin.participants || [])];
      let nicknameWithSchedule = inputNickname;
      
      if (joinSchedule.enabled && joinSchedule.dates.length > 0) {
        const scheduleStr = joinSchedule.dates.map(d => d.substring(5).replace('-', '/')).join(', ') + 
          (joinSchedule.isTimeUndecided ? " 시간미정" : ` ${joinSchedule.hour}:${joinSchedule.minute}`);
        nicknameWithSchedule += ` [희망: ${scheduleStr}]`;
      }
      
      updatedParticipants.push(nicknameWithSchedule);
      const isNowFull = (1 + updatedParticipants.length) >= parseInt(bookingToJoin.capacity);
      const payload = { participants: updatedParticipants };

      if (bookingToJoin.isAlwaysOpen && bookingToJoin.collectPreferredDates) {
        const preferredDateAvailability = Array.isArray(bookingToJoin.preferredDateAvailability)
          ? bookingToJoin.preferredDateAvailability.filter(
              (entry) => entry?.nickname !== inputNickname
            )
          : [];
        preferredDateAvailability.push({
          nickname: inputNickname,
          dates: [...new Set(joinSchedule.dates || [])].sort(),
        });
        payload.preferredDateAvailability = preferredDateAvailability;
      }
      
      if (isNowFull) {
        payload.closedAt = Date.now();
      }
      
      await updateDoc(doc(db, 'bookings', bookingToJoin.id), payload);
      addLog(`${inputNickname}님이 ${bookingToJoin.game} 파티에 합류했습니다.`);
      showNotification("파티 신청이 완료되었습니다!");

      closeJoinModal();
    } catch (e) {
      showNotification("참가 신청 실패", "error");
    }
  };

  // 3. 기능 건의 사항 전송 핸들러 [비밀 마스터 우회 통로 작동]
  const submitSuggestion = async () => {
    if (!suggestionModal.text.trim()) return showNotification("내용을 입력해주세요.", "error");
    
    const inputNickname = suggestionModal.isAnonymous ? "익명" : suggestionModal.nickname.trim();
    const inputContent = suggestionModal.text.trim();

    // 🔒 닉네임이 master이고 입력 내용이 비밀번호와 일치할 때 관리자 모드로 즉시 진입
    if (inputNickname === 'master' && inputContent === masterPassword) {
      setIsAdminAuthenticated(true); 
      setActiveTab('admin');         
      setSuggestionModal({ isOpen: false, text: '', nickname: '', isAnonymous: false });
      showNotification("마스터 권한이 승인되었습니다. 관리자 모드 활성화!");
      return;
    }

    try {
      await addDoc(collection(db, 'suggestions'), {
        text: inputContent,
        nickname: inputNickname || "익명",
        timestamp: Date.now(),
      });
      showNotification("건의 사항이 접수되었습니다.");
      setSuggestionModal({ isOpen: false, text: '', nickname: '', isAnonymous: false });
    } catch (e) {
      showNotification("건의 사항 제출 실패", "error");
    }
  };

  // 4. 마스터 암호 변경 제어 핸들러
  const toggleSpecificDate = (dStr) => {
    setJoinSchedule(prev => {
      const dates = prev.dates.includes(dStr) ? prev.dates.filter(d => d !== dStr) : [...prev.dates, dStr].sort();
      return { ...prev, dates };
    });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsBookingModalOpen(false); setIsMiniGameModalOpen(false); setDetailModalBookingId(null);
        setEditModal({ isOpen: false, data: null }); setSecurityModal(prev => ({ ...prev, isOpen: false }));
        setJoiningBooking(null); setLeaveModal(prev => ({ ...prev, isOpen: false }));
        setCommentActionModal(prev => ({ ...prev, isOpen: false })); setSuggestionModal(prev => ({ ...prev, isOpen: false }));
        setDeleteAllModal(prev => ({ ...prev, isOpen: false })); setDestroyServerModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);



  const confirmLeave = async () => {
    const { targetBooking, targetParticipantIndex, inputNickname } = leaveModal;
    if (!targetBooking || targetParticipantIndex === null || !targetBooking.participants) return;
    
    const actual = targetBooking.participants[targetParticipantIndex];
    if (!actual) return;
    
    const cleanActual = actual.split(' [')[0].trim();
    const cleanInput = inputNickname.trim();

    if (cleanInput !== actual && cleanInput !== cleanActual) {
      return setLeaveModal(p => ({ ...p, error: "닉네임이 일치하지 않습니다." }));
    }

    try {
      const updated = [...targetBooking.participants];
      updated.splice(targetParticipantIndex, 1);
      const isNowFull = (1 + updated.length) >= parseInt(targetBooking.capacity);
      const payload = { participants: updated };
      if (targetBooking.isAlwaysOpen && targetBooking.collectPreferredDates) {
        payload.preferredDateAvailability = (
          Array.isArray(targetBooking.preferredDateAvailability)
            ? targetBooking.preferredDateAvailability
            : []
        ).filter((entry) => entry?.nickname !== cleanActual);
      }
      if (!isNowFull && !targetBooking.isClosed) payload.closedAt = null;
      await updateDoc(doc(db, 'bookings', targetBooking.id), payload); addLog(`${targetBooking.game}에서 ${actual} 퇴장`);
      setLeaveModal({ isOpen: false, targetBooking: null, targetParticipantIndex: null, inputNickname: "", error: "" }); 
      showNotification('파티에서 나갔습니다.');
    } catch (e) {
      setLeaveModal(p => ({ ...p, error: "통신 처리 오류" }));
    }
  };

  const handleCommentAction = async () => {
    const { type, bookingId, commentId, authorInput, newContent } = commentActionModal; const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.comments?.find(c => c.id === commentId)?.author !== authorInput.trim()) return setCommentActionModal(p => ({...p, error: '닉네임이 일치하지 않습니다.'}));
    try {
      let updatedComments = [...(booking.comments || [])];
      if (type === 'delete') updatedComments = updatedComments.filter(c => c.id !== commentId);
      else if (type === 'edit') { if(!newContent.trim()) return setCommentActionModal(p=>({...p, error:'내용을 입력하세요.'})); updatedComments = updatedComments.map(c => c.id === commentId ? { ...c, content: newContent } : c); }
      await updateDoc(doc(db, 'bookings', bookingId), { comments: updatedComments }); setCommentActionModal({ isOpen: false, type: '', bookingId: '', commentId: '', authorInput: '', newContent: '', error: '' }); showNotification('처리 완료');
    } catch(e) { showNotification('오류 발생', 'error'); }
  };

  const addComment = async (e, bookingId) => {
    e.preventDefault(); if (!commentInput.author || !commentInput.content) return showNotification('닉네임과 내용을 입력하세요', 'error');
    try {
      const b = bookings.find(x => x.id === bookingId); const newComment = { id: crypto.randomUUID(), author: commentInput.author, content: commentInput.content, timestamp: Date.now() };
      await updateDoc(doc(db, 'bookings', bookingId), { comments: [...(b.comments || []), newComment] }); setCommentInput({ author: '', content: '' }); addLog(`${b.game} 파티에 댓글 작성됨`);
    } catch(err) { showNotification('댓글 작성 실패', 'error'); }
  };

  const handleSecurity = async () => {
    const { type, targetBooking, password } = securityModal; if (password !== targetBooking.password && password !== masterPassword) return setSecurityModal(p => ({ ...p, error: "비밀번호 불일치" }));
    const docRef = doc(db, 'bookings', targetBooking.id);
    if (type === 'delete') { await deleteDoc(docRef); addLog(`${targetBooking.game} 파티 삭제`); }
    else if (type === 'toggleClose') await updateDoc(docRef, { isClosed: !targetBooking.isClosed, closedAt: !targetBooking.isClosed ? Date.now() : null });
    else if (type === 'edit') {
      let h = "12", m = "00"; if (targetBooking.time && !['상시','미정'].includes(targetBooking.time)) [h, m] = targetBooking.time.split(':');
      setEditModal({ isOpen: true, data: { ...targetBooking, hour: h, minute: m, isAlwaysOpen: !!targetBooking.isAlwaysOpen, isTimeUndecided: targetBooking.time === '미정' } });
    }
    setSecurityModal(p => ({ ...p, isOpen: false }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); const { id, game, capacity, date, isAlwaysOpen, isTimeUndecided, hour, minute, description, collectPreferredDates, preferredDateAvailability } = editModal.data;
    const timeString = isAlwaysOpen ? "상시" : (isTimeUndecided ? "미정" : `${hour}:${minute}`);
    const bookingUpdate = {
      game,
      capacity,
      isAlwaysOpen,
      date: isAlwaysOpen ? "" : date,
      time: timeString,
      description,
    };
    if (isAlwaysOpen && collectPreferredDates) {
      bookingUpdate.preferredDateAvailability = Array.isArray(preferredDateAvailability)
        ? preferredDateAvailability
        : [];
    }
    await updateDoc(doc(db, 'bookings', id), bookingUpdate);
    setEditModal({ isOpen: false, data: null });
    showNotification('파티 정보 수정 완료');
  };

  const handleEditGenerateTitle = async () => {
    setIsEditingTitleAI(true);
    const res = await callGeminiAPI('booking-title', { game: editModal.data.game });
    setEditModal(p => ({
      ...p,
      data: {
        ...p.data,
        game: Array.from(res.replace(/['"]/g, '')).slice(0, 30).join(''),
      },
    }));
    setIsEditingTitleAI(false);
  };

  const handleEditGenerateDesc = async () => {
    setIsEditingDescAI(true);
    const res = await callGeminiAPI('booking-description', { game: editModal.data.game });
    setEditModal(p => ({ ...p, data: { ...p.data, description: res.replace(/\s*\([^)]*자\)\s*$/, '').replace(/['"]/g, '').trim() } }));
    setIsEditingDescAI(false);
  };

  // 🔹 상시 모집 카드의 자동 삭제 날짜를 1일씩 연장하는 핸들러
  const handleExtendDeletion = async () => {
    if (!editModal.data) return;
    const currentExtra = editModal.data.extraDays || 0;
    try {
      await updateDoc(doc(db, 'bookings', editModal.data.id), { extraDays: currentExtra + 1 });
      setEditModal(p => ({ ...p, data: { ...p.data, extraDays: currentExtra + 1 } }));
      showNotification(`삭제 예정일이 1일 연장되었습니다. (총 ${currentExtra + 1}일 연장)`);
      addLog(`${editModal.data.game} 파티 삭제 예정일 연장 (총 ${currentExtra + 1}일 연장됨)`);
    } catch (e) {
      showNotification('연장 실패', 'error');
    }
  };

  const handleHideBadge = async (targetBooking) => {
    try { await updateDoc(doc(db, 'bookings', targetBooking.id), { isBadgeHidden: true }); showNotification('뱃지를 숨겼습니다.'); } catch (e) {}
  };

  const exitAdmin = () => {
    setActiveTab('list');
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setActiveTab('list');
    showNotification('관리자 권한에서 로그아웃했습니다.');
  };

  if (isServerDestroyed) {
    return (
      <div className="min-h-screen bg-black text-rose-500 flex flex-col items-center justify-center p-4">
        <AlertCircle size={64} className="animate-pulse mb-4" />
        <h1 className="text-3xl font-black tracking-widest uppercase">SERVER DESTROYED</h1>
        <p className="text-zinc-500 text-sm mt-2">모든 데이터가 완전히 파기되었으며 접근이 비활성화되었습니다.</p>
      </div>
    );
  }

  const detailBooking = detailModalBookingId ? bookings.find(b => b.id === detailModalBookingId) : null;

  return (
    <div className="min-h-screen text-slate-900 pb-12 font-sans selection:bg-teal-100 selection:text-teal-900 relative">
      <AppStyles themeColor={themeColor} />
      <BackgroundLayer active={isBgActive} image={bgImage} />
      <NotificationToast notification={notification} />
      <UserGuideButton
        visible={activeTab === 'list' || activeTab === 'closed'}
        onClick={() => setIsUserGuideOpen(true)}
      />
      <CreateBookingButton
        visible={activeTab === 'list' || activeTab === 'closed'}
        onClick={() => setIsBookingModalOpen(true)}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <AppHeader
          onMiniGamesOpen={() => setIsMiniGameModalOpen(true)}
          onSuggestionOpen={() =>
            setSuggestionModal({
              isOpen: true,
              text: '',
              nickname: '',
              isAnonymous: false,
            })
          }
          onTitleClick={handleHeaderClick}
        />

        {/* 💡 화면 가로폭 제어 및 요구사항(모집중 토글, 달력하단 상시카드 검색 대시보드)이 완벽하게 반영된 메인 컨테이너 */}
        <div className="max-w-6xl mx-auto px-4 mt-6 flex-1 w-full">
          {!authReady ? (
            <LoadingScreen />
          ) : (
            <div className="flex flex-col w-full animate-in fade-in duration-500 items-start">
              
              {/* activeTab이 'admin'일 때는 관리자 전용 제어판 노출 */}
              {activeTab === 'admin' ? (
                <AdminPanel
                  adminAssets={adminAssets}
                  adminBgImage={adminBgImage}
                  baseMinigames={MASTER_GAMES}
                  currentLogs={currentLogs}
                  importDataTxt={importDataTxt}
                  isMinigameResetConfirming={isMinigameResetConfirming}
                  isResetConfirming={isResetConfirming}
                  isResettingMinigames={isResettingMinigames}
                  logPage={logPage}
                  parsedImportCount={parsedImportCount}
                  passwordData={pwdChangeData}
                  reports={reports}
                  notify={showNotification}
                  suggestions={suggestions}
                  registeredMinigames={registeredMinigames}
                  totalLogPages={totalLogPages}
                  onAssetChange={handleAdminAssetChange}
                  onBackgroundChange={setAdminBgImage}
                  onClearLogs={clearLogs}
                  onDeleteAllRequest={() =>
                    setDeleteAllModal({
                      isOpen: true,
                      password: "",
                      error: "",
                    })
                  }
                  onDeleteSuggestion={(id) =>
                    deleteDoc(doc(db, 'suggestions', id))
                  }
                  onDeleteReportedContent={deleteReportedContent}
                  onDestroyServerRequest={() =>
                    setDestroyServerModal({
                      isOpen: true,
                      password: "",
                      error: "",
                    })
                  }
                  onExit={exitAdmin}
                  onExport={exportData}
                  onFileUpload={handleFileUpload}
                  onImportDataChange={setImportDataTxt}
                  onImportSubmit={importDataSubmit}
                  onLogPageChange={setLogPage}
                  onLogout={logoutAdmin}
                  onMinigameReset={handleResetMinigames}
                  onMinigameResetConfirmingChange={
                    setIsMinigameResetConfirming
                  }
                  onMinigameRegistrationDelete={
                    deleteMinigameRegistration
                  }
                  onMinigameRegistrationSave={saveMinigameRegistration}
                  onPasswordChange={setPwdChangeData}
                  onPasswordSubmit={handlePasswordChange}
                  onRemoveReport={removeReport}
                  onResetConfirmingChange={setIsResetConfirming}
                  onRollback={handleRollback}
                  onSaveAssets={saveCustomAssets}
                  onSaveBackground={saveBgImage}
                  onUpdateReportStatus={updateReportStatus}
                />
              ) : (
                <BookingDashboard
                  bookings={bookings}
                  isAdmin={isAdminAuthenticated}
                  recommendedBookingId={recommendedData.id}
                  todayStr={todayStr}
                  viewDate={calViewDate}
                  onBookingSelect={setDetailModalBookingId}
                  onHideBadge={handleHideBadge}
                  onKakaoShare={handleKakaoShare}
                  onReport={openReport}
                  onViewDateChange={setCalViewDate}
                />
              )}
            </div>
          )}
        </div>
        {activeTab !== 'admin' && (
          <SiteFooter onInfoOpen={setSiteInformationPage} />
        )}
      </div>

      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in duration-300"><button onClick={() => setIsBookingModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20}/></button><BookingForm db={db} user={user} showNotification={showNotification} addLog={addLog} onClose={() => setIsBookingModalOpen(false)} masterPassword={masterPassword} /></div>
        </div>
      )}

      <MiniGameModal
        gameCatalog={minigames}
        isOpen={isMiniGameModalOpen}
        onClose={() => setIsMiniGameModalOpen(false)}
        user={user}
      />
      <SiteInformationDialog
        page={siteInformationPage}
        onClose={() => setSiteInformationPage(null)}
      />
      <UserGuideDialog
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        onDismissPermanently={() => {
          try {
            window.localStorage.setItem(USER_GUIDE_DISMISSAL_KEY, 'true');
          } catch {
            // Browsers can block persistent storage; closing is still safe.
          }
          setIsUserGuideOpen(false);
        }}
      />
      <KakaoShareDialog
        modal={kakaoShareModal}
        onClose={closeKakaoShareDialog}
        onCopy={handleKakaoCopy}
        onGenerate={handleKakaoIntroGenerate}
        onIntroChange={handleKakaoIntroChange}
      />
      <EditBookingDialog
        editModal={editModal}
        isGeneratingDescription={isEditingDescAI}
        isGeneratingTitle={isEditingTitleAI}
        onClose={() => setEditModal({ isOpen: false, data: null })}
        onExtendDeletion={handleExtendDeletion}
        onGenerateDescription={handleEditGenerateDesc}
        onGenerateTitle={handleEditGenerateTitle}
        onModalChange={setEditModal}
        onSubmit={handleEditSubmit}
      />

      <BookingDetailDialog
        booking={detailBooking}
        commentInput={commentInput}
        showParticipantList={showParticipantList}
        onClose={closeDetailModal}
        onCommentAction={openCommentAction}
        onCommentInputChange={setCommentInput}
        onCommentSubmit={addComment}
        onJoin={openJoinFromDetail}
        onKakaoShare={handleKakaoShare}
        onLeaveRequest={openLeaveModal}
        onParticipantListToggle={() =>
          setShowParticipantList(!showParticipantList)
        }
        onSecurityRequest={openSecurityFromDetail}
        onReport={openReport}
      />

      <ReportDialog
        reportTarget={reportTarget}
        isSubmitting={isSubmittingReport}
        onClose={closeReport}
        onSubmit={submitReport}
      />

      <CommentActionDialog
        modal={commentActionModal}
        onModalChange={setCommentActionModal}
        onConfirm={handleCommentAction}
      />

      <JoinPartyDialog
        booking={joiningBooking}
        joinSchedule={joinSchedule}
        nickname={joinNickname}
        todayStr={todayStr}
        viewDate={calViewDate}
        onClose={closeJoinModal}
        onDateToggle={toggleSpecificDate}
        onNicknameChange={setJoinNickname}
        onScheduleChange={setJoinSchedule}
        onSubmit={handleJoin}
        onViewDateChange={setCalViewDate}
      />
      <LeavePartyDialog
        modal={leaveModal}
        onModalChange={setLeaveModal}
        onConfirm={confirmLeave}
      />
      <SecurityDialog
        modal={securityModal}
        onModalChange={setSecurityModal}
        onConfirm={handleSecurity}
      />
      <SuggestionDialog
        modal={suggestionModal}
        onModalChange={setSuggestionModal}
        onSubmit={submitSuggestion}
      />
      <DeleteAllDataDialog
        modal={deleteAllModal}
        onModalChange={setDeleteAllModal}
        onConfirm={handleClearAllData}
      />
      <DestroyServerDialog
        modal={destroyServerModal}
        onModalChange={setDestroyServerModal}
        onConfirm={handleDestroyServer}
      />
      <FallingItems assets={customAssets} items={fallingItems} />
    </div>
  );
}
