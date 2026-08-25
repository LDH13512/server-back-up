import React, { useEffect, useState } from 'react';
import { Gamepad2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { JoinScheduleCalendar } from '../features/bookings/components/ScheduleCalendars';
import { validateFutureDateTime, callGeminiAPI, getKSTDateString } from '../utils/helpers';
import {
  COMMUNITY_LIMITS,
  validateCommunityFields,
} from '../utils/contentModeration';
import { findGameImages } from '../utils/gameImages';

export default function BookingForm({
  db,
  user,
  showNotification,
  addLog,
  onClose,
  masterPassword,
}) {
  const [formData, setFormData] = useState({
    game: "", nickname: "", password: "", capacity: "4", isAlwaysOpen: false, collectPreferredDates: false,
    date: getKSTDateString(Date.now()), isTimeUndecided: false, hour: "12", minute: "00", description: ""
  });
  const [hostAvailableDates, setHostAvailableDates] = useState([]);
  const [availabilityViewDate, setAvailabilityViewDate] = useState(new Date());
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingNickname, setIsGeneratingNickname] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prefetchedGameImages, setPrefetchedGameImages] = useState({
    game: '',
    images: [],
  });

  useEffect(() => {
    const game = formData.game.trim();
    if (game.length < 2) {
      setPrefetchedGameImages({ game: '', images: [] });
      return undefined;
    }

    let isCurrent = true;
    const timer = setTimeout(() => {
      findGameImages(game)
        .then((images) => {
          if (isCurrent) {
            setPrefetchedGameImages({ game, images: images.slice(0, 12) });
          }
        })
        .catch(() => {});
    }, 700);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [formData.game]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'isAlwaysOpen' && !checked
        ? { collectPreferredDates: false }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!user) return showNotification('로그인이 필요합니다.', 'error');
    if (!formData.password.trim()) {
      return showNotification('방 비밀번호를 입력하세요.', 'error');
    }

    const validation = validateCommunityFields([
      {
        key: 'game',
        value: formData.game,
        label: '게임 이름',
        maxLength: COMMUNITY_LIMITS.title,
      },
      {
        key: 'nickname',
        value: formData.nickname,
        label: '닉네임',
        maxLength: COMMUNITY_LIMITS.nickname,
      },
      {
        key: 'description',
        value: formData.description,
        label: '게임 설명',
        maxLength: COMMUNITY_LIMITS.description,
        required: false,
      },
    ]);
    if (!validation.ok) {
      return showNotification(validation.error, 'error');
    }
    
    const isDateEmpty = !formData.date;
    const isAlwaysOpen = formData.isAlwaysOpen || isDateEmpty;

    if (!isAlwaysOpen && !validateFutureDateTime(formData.date, formData.isTimeUndecided, formData.hour, formData.minute)) {
      return showNotification('현재 시간 이후로 작성해 주세요.', 'error');
    }

    setIsSubmitting(true);
    try {
      let gameImages = prefetchedGameImages.game === validation.values.game
        ? prefetchedGameImages.images
        : [];
      if (gameImages.length === 0) {
        try {
          gameImages = await findGameImages(validation.values.game);
        } catch {
          gameImages = [];
        }
      }
      let timeString = isAlwaysOpen ? "상시" : (formData.isTimeUndecided ? "미정" : `${formData.hour}:${formData.minute}`);
      const preferredDateAvailability = formData.collectPreferredDates && isAlwaysOpen
        ? [{ nickname: validation.values.nickname, dates: hostAvailableDates }]
        : [];
      const bookingPayload = {
        game: validation.values.game, nickname: validation.values.nickname, password: formData.password.trim() || masterPassword,
        capacity: formData.capacity || "4", isAlwaysOpen, date: isAlwaysOpen ? "" : formData.date, time: timeString,
        description: validation.values.description, participants: [], isClosed: false, createdAt: Date.now(), comments: [],
        gameImages: gameImages.slice(0, 12),
        collectPreferredDates: Boolean(formData.collectPreferredDates && isAlwaysOpen),
        preferredDateAvailability,
      };
      await addDoc(
        collection(db, 'bookings'),
        bookingPayload
      );
      addLog(`${formData.nickname}님이 ${formData.game} 파티를 생성했습니다.`);
      showNotification('파티가 성공적으로 생성되었습니다!');
      onClose();
    } catch (error) {
      showNotification('파티 생성 실패', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!formData.game) return showNotification('게임 이름을 먼저 입력하세요.', 'error');
    setIsGeneratingTitle(true);
    try {
      const res = await callGeminiAPI('booking-title', { game: formData.game });
      setFormData(p => ({ ...p, game: Array.from(res.replace(/['"]/g, '')).slice(0, 30).join('') }));
    } catch (e) {}
    setIsGeneratingTitle(false);
  };

  const handleGenerateDesc = async () => {
    if (!formData.game) return showNotification('게임 이름을 먼저 입력하세요.', 'error');
    setIsGeneratingDesc(true);
    try {
      const res = await callGeminiAPI('booking-description', { game: formData.game });
      const cleanRes = res.replace(/\s*\([^)]*자\)\s*$/, '').replace(/['"]/g, '').trim();
      setFormData(p => ({
        ...p,
        description: Array.from(cleanRes)
          .slice(0, COMMUNITY_LIMITS.description)
          .join(''),
      }));
    } catch (e) {}
    setIsGeneratingDesc(false);
  };

  const handleGenerateNickname = async () => {
    setIsGeneratingNickname(true);
    try {
      const res = await callGeminiAPI('nickname');
      setFormData(p => ({ ...p, nickname: res.replace(/['"]/g, '').slice(0, 10) }));
    } catch (e) {}
    setIsGeneratingNickname(false);
  };

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center mb-8 pr-10">
        <span className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
          <Gamepad2 className="theme-text" size={24}/> 새 파티 모집
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" name="isAlwaysOpen" checked={formData.isAlwaysOpen} onChange={handleChange} className="w-5 h-5 accent-[#008081] rounded border-slate-300" />
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">상시 모집</span>
          </label>
          {formData.isAlwaysOpen && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name="collectPreferredDates" checked={formData.collectPreferredDates} onChange={handleChange} className="w-5 h-5 accent-[#008081] rounded border-slate-300" />
              <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
              희망 날짜 받기
              </span>
            </label>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
         {!formData.isAlwaysOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <div className="h-6 flex items-center ml-1"><span className="text-xs font-bold text-slate-400">날짜 선택</span></div>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-bold bg-slate-50 outline-none focus:theme-border focus:bg-white transition-all text-slate-700 h-[56px] cursor-pointer shadow-sm" />
              </div>
              <div className="space-y-2">
                <div className="h-6 flex justify-between items-center ml-1">
                  <span className="text-xs font-bold text-slate-400">시간 설정</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" name="isTimeUndecided" checked={formData.isTimeUndecided} onChange={handleChange} className="w-3.5 h-3.5 accent-[#008081] rounded-sm" /> 
                    <span className="text-[11px] font-bold text-slate-400 italic">미정</span>
                  </label>
                </div>
                <div className={`flex gap-2 h-[56px] ${formData.isTimeUndecided ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="relative flex-1 h-full border-2 border-slate-200 rounded-2xl bg-slate-50 focus-within:theme-border focus-within:bg-white transition-all overflow-hidden shadow-sm">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">시</span>
                    <input type="number" name="hour" value={formData.hour} onChange={e => setFormData(p => ({...p, hour: e.target.value.slice(0,2)}))} className="w-full h-full text-center font-bold outline-none bg-transparent text-slate-700 text-lg" placeholder="12" min="0" max="23" />
                  </div>
                  <div className="relative flex-1 h-full border-2 border-slate-200 rounded-2xl bg-slate-50 focus-within:theme-border focus-within:bg-white transition-all overflow-hidden cursor-pointer hover:bg-slate-100 group shadow-sm" onClick={() => setFormData(p => ({...p, minute: p.minute === "00" ? "30" : "00"}))}>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">분</span>
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 text-lg select-none">{formData.minute}</div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                      <ChevronUp size={12} className="text-slate-500"/><ChevronDown size={12} className="text-slate-500"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
         )}
         
         <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <span className="text-xs font-bold text-slate-400">게임 이름 / 모집 제목(30글자 이내) (필수)</span>
              <button type="button" onClick={handleGenerateTitle} className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-all flex items-center gap-1 shadow-sm">
                {isGeneratingTitle ? <Loader2 size={12} className="animate-spin"/> : '✨ AI 생성'}
              </button>
            </div>
            <input name="game" value={formData.game} onChange={handleChange} maxLength={30} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:theme-border focus:bg-white bg-slate-50 transition-all text-slate-700 placeholder:text-slate-400/60 shadow-sm" placeholder="롤, 오버워치, 쥐스토랑 등" />
         </div>
         
         <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <span className="text-xs font-bold text-slate-400">게임 설명 / 링크 (선택)</span>
              <button type="button" onClick={handleGenerateDesc} className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-all flex items-center gap-1 shadow-sm">
                {isGeneratingDesc ? <Loader2 size={12} className="animate-spin"/> : '✨ AI 생성'}
              </button>
            </div>
            <textarea name="description" value={formData.description} onChange={handleChange} maxLength={COMMUNITY_LIMITS.description} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-medium outline-none focus:theme-border focus:bg-white bg-slate-50 transition-all text-slate-700 placeholder:text-slate-400/60 h-28 resize-y text-sm shadow-sm" placeholder="예: 스팀 링크, 게임 특징 등..." />
            <span className="block text-right text-[10px] font-bold text-slate-400">
              {Array.from(formData.description).length}/{COMMUNITY_LIMITS.description}
            </span>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-2">
             <div className="flex justify-between items-center ml-1">
               <span className="text-xs font-bold text-slate-400">내 닉네임 (필수)</span>
               <button type="button" onClick={handleGenerateNickname} className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-all flex items-center gap-1 shadow-sm">
                 {isGeneratingNickname ? <Loader2 size={12} className="animate-spin"/> : '✨ AI 생성'}
               </button>
             </div>
             <input name="nickname" value={formData.nickname} onChange={handleChange} maxLength={COMMUNITY_LIMITS.nickname} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:theme-border focus:bg-white bg-slate-50 transition-all text-slate-700 placeholder:text-slate-400/60 shadow-sm" placeholder="잼민이테이머" />
           </div>
           <div className="space-y-2 flex flex-col justify-end">
             <span className="text-xs font-bold text-slate-400 ml-1 block mb-1">최대 정원 (필수)</span>
             <input name="capacity" type="number" value={formData.capacity} onChange={handleChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:theme-border focus:bg-white bg-slate-50 transition-all text-slate-700 h-[58px] shadow-sm" min="2" max="100"/>
           </div>
         </div>

         <div className="space-y-2 pt-2">
           <span className="text-xs font-bold text-slate-400 ml-1">방 비밀번호 (필수)</span>
           <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:theme-border focus:bg-white bg-slate-50 transition-all text-slate-700 placeholder:text-slate-400/60 shadow-sm" placeholder="삭제 및 수정용 비밀번호" />
         </div>

         {formData.isAlwaysOpen && formData.collectPreferredDates && (
           <div className="space-y-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
             <div>
               <span className="text-xs font-black text-teal-800">내가 가능한 날짜 (선택)</span>
               <p className="mt-1 text-[11px] font-medium leading-5 text-teal-700">참가자도 같은 방식으로 가능한 날짜를 고릅니다. 날짜별 희망 인원은 모집글 상세에서 확인할 수 있어요.</p>
             </div>
             <JoinScheduleCalendar
               selectedDates={hostAvailableDates}
               todayStr={getKSTDateString(Date.now())}
               viewDate={availabilityViewDate}
               onDateToggle={(date) => setHostAvailableDates((dates) => (
                 dates.includes(date)
                   ? dates.filter((item) => item !== date)
                   : [...dates, date].sort()
               ))}
               onViewDateChange={setAvailabilityViewDate}
             />
           </div>
         )}
         
         <div className="pt-6">
            <button type="submit" disabled={isSubmitting} className="w-full py-4 theme-bg text-white rounded-2xl font-black text-lg shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70">
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? '게임 이미지 준비 중...' : '파티 모집하기'}
            </button>
         </div>
      </form>
    </div>
  );
}
