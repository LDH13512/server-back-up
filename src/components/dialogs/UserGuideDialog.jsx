import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HelpCircle,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';

const GUIDE_OPTIONS = [
  {
    id: 'short',
    label: '단기 컨텐츠',
    detail: '하루 미만',
    icon: Clock3,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 'member',
    label: '장기 컨텐츠',
    detail: '일반 회원',
    icon: UsersRound,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];

const GUIDE_CONTENT = {
  short: {
    title: '단기 컨텐츠 안내',
    subtitle: '하루 안에 함께 즐기는 게임을 위한 빠른 초대 방법입니다.',
    steps: [
      {
        title: '게시판 주소를 공유하세요',
        text: '함께할 사람에게 전시용 게시판 주소를 공유하고 모집글의 일정과 참여 방법을 안내해 주세요.',
      },
      {
        title: '약속 시간에 게임을 시작하세요',
        text: '정해진 시간에 함께 게임을 즐기고, 일정이 바뀌면 모집글도 함께 수정해 주세요.',
      },
    ],
    note: '단기 콘텐츠는 예상 플레이 타임이 하루 미만입니다. 그 이상이 되면 장기 콘텐츠로 이용해 주세요.',
  },
  member: {
    title: '장기 컨텐츠 · 일반 회원 안내',
    subtitle: '게스트와 함께하는 장기 게임을 모집하고 안내하는 방법입니다.',
    steps: [
      {
        title: '게스트가 사용할 닉네임을 정하세요',
        text: '참가자를 알아볼 수 있으면서 개인정보를 포함하지 않는 전시용 닉네임을 사용해 주세요.',
      },
      {
        title: '게시판에서 같은 이름으로 파티에 등록하세요',
        text: '모집 카드를 열어 파티 합류하기를 누른 뒤, 앞에서 정한 게스트 닉네임을 입력합니다.',
      },
      {
        title: '참가 일정을 확인하세요',
        text: '참가자 목록과 희망 날짜를 확인하고 함께 플레이할 시간을 정하세요.',
      },
      {
        title: '정해진 시간에 함께 즐기세요',
        text: '일정이 확정되면 모집글을 최신 상태로 유지하고 정해진 시간에 게임을 시작하세요.',
      },
    ],
    note: '게시판에는 실제 이름, 연락처, 계정 정보 같은 개인정보를 입력하지 마세요.',
  },
};

export default function UserGuideDialog({
  isOpen,
  onClose,
  onDismissPermanently,
}) {
  const [step, setStep] = useState('welcome');
  const [selectedGuide, setSelectedGuide] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('welcome');
    setSelectedGuide(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && step !== 'welcome') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, step]);

  if (!isOpen) return null;

  const content = selectedGuide ? GUIDE_CONTENT[selectedGuide] : null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-guide-title"
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl animate-in zoom-in duration-200"
      >
        {step !== 'welcome' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="이용방법 닫기"
            className="absolute right-5 top-5 z-10 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        )}

        {step === 'welcome' && (
          <div className="p-7 text-center sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-600">
              <HelpCircle size={34} />
            </div>
            <p className="mt-5 text-xs font-black tracking-[0.18em] text-teal-600">
              ARCADE BOARD GUIDE
            </p>
            <h2 id="user-guide-title" className="mt-2 text-2xl font-black text-slate-900">
              처음 오셨다면 설명해드릴까요?
            </h2>
            <p className="mt-3 whitespace-nowrap text-[10px] font-medium leading-6 tracking-[-0.04em] text-slate-500 sm:text-sm">
              게임 기간과 역할에 맞는 이용 방법을 쉽게 안내해 드릴게요.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="rounded-2xl bg-teal-600 px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-teal-700"
              >
                네, 설명 볼게요
              </button>
              <button
                type="button"
                onClick={onDismissPermanently}
                className="rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
              >
                아니요
              </button>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div className="p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition hover:text-teal-700"
            >
              <ArrowLeft size={15} /> 처음으로
            </button>
            <h2 id="user-guide-title" className="mt-5 pr-8 text-2xl font-black text-slate-900">
              어떤 설명을 해드릴까요?
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              단기 콘텐츠는 하루 미만, 장기 콘텐츠는 하루 이상 플레이가 예상되는 게임입니다.
            </p>
            <div className="mt-6 space-y-3">
              {GUIDE_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedGuide(option.id);
                      setStep('content');
                    }}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${option.color}`}
                  >
                    <span className="rounded-xl bg-white/80 p-2.5 shadow-sm"><Icon size={21} /></span>
                    <span>
                      <span className="block text-base font-black">{option.label}</span>
                      <span className="mt-0.5 block text-xs font-bold opacity-75">{option.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'content' && content && (
          <div className="flex max-h-[90vh] flex-col">
            <header className="border-b border-slate-100 px-6 py-6 pr-16 sm:px-8">
              <p className="text-xs font-black tracking-[0.16em] text-teal-600">STEP-BY-STEP GUIDE</p>
              <h2 id="user-guide-title" className="mt-2 text-2xl font-black text-slate-900">{content.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{content.subtitle}</p>
            </header>
            <div className="overflow-y-auto px-6 py-6 sm:px-8">
              <ol className="space-y-5">
                {content.steps.map((item, index) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-black text-white">{index + 1}</span>
                    <div>
                      <h3 className="font-black text-slate-800">{item.title}</h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {content.note && (
                <div className="mt-6 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                  <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                  {content.note}
                </div>
              )}
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="inline-flex items-center gap-1 text-xs font-black text-slate-600 transition hover:text-teal-700"
              >
                <ArrowLeft size={15} /> 다른 안내 보기
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-teal-700"
              >
                <CheckCircle2 size={15} /> 확인했어요
              </button>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}
