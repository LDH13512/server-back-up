import React, { useEffect } from 'react';
import { ExternalLink, Mail, ShieldCheck, X } from 'lucide-react';

export const SITE_INFORMATION = {
  guide: {
    eyebrow: 'GETTING STARTED',
    title: '이용 안내',
    href: '/guide/',
    summary:
      '모집글을 만들고 파티에 참가하며 게임 일정을 확인하는 방법을 안내합니다.',
  },
  about: {
    eyebrow: 'ABOUT ARCADE BOARD',
    title: '서비스 소개',
    href: '/about/',
    summary:
      '게시판이 만들어진 이유와 제공하는 기능, 운영 원칙을 소개합니다.',
  },
  guidelines: {
    eyebrow: 'COMMUNITY GUIDELINES',
    title: '운영 정책',
    href: '/community-guidelines/',
    summary:
      '누구나 안전하게 게임 약속을 만들기 위한 작성 기준과 신고 절차입니다.',
  },
  privacy: {
    eyebrow: 'PRIVACY POLICY',
    title: '개인정보처리방침',
    href: '/privacy/',
    summary:
      '서비스에서 처리하는 정보, 외부 서비스와 이용자의 권리를 안내합니다.',
  },
  terms: {
    eyebrow: 'TERMS OF USE',
    title: '이용약관',
    href: '/terms/',
    summary:
      '게시판을 이용할 때 적용되는 기본 조건과 이용자의 책임을 안내합니다.',
  },
};

export const INQUIRY_EMAIL = 'admin@example.com';
export const INQUIRY_MAILTO =
  `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(
    '[게시판] 문의드립니다'
  )}&body=${encodeURIComponent(
    '문의 유형: 오류 제보 / 기능 제안 / 게시물 신고 / 개인정보 문의\n\n관련 게시물 또는 화면:\n\n문의 내용:\n\n※ 비밀번호, API 키, 개인 연락처 등 민감한 정보는 작성하지 마세요.'
  )}`;

export default function SiteInformationDialog({ page, onClose }) {
  const information = page ? SITE_INFORMATION[page] : null;

  useEffect(() => {
    if (!information) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [information, onClose]);

  if (!information) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-information-title"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-slate-100 px-5 py-5 pr-16 sm:px-8 sm:py-7">
          <p className="text-[10px] font-black tracking-[0.18em] text-teal-600 sm:text-xs">
            {information.eyebrow}
          </p>
          <h2
            id="site-information-title"
            className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl"
          >
            {information.title}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {information.summary}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={`${information.title} 닫기`}
            className="absolute right-5 top-5 rounded-full bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
          <InformationContent page={page} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-8">
          <a
            href={information.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-teal-900"
          >
            전체 문서 새 창에서 보기 <ExternalLink size={13} />
          </a>
          <a
            href={INQUIRY_MAILTO}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white hover:bg-teal-700"
          >
            <Mail size={14} /> 이메일 문의
          </a>
        </footer>
      </section>
    </div>
  );
}

function InformationContent({ page }) {
  if (page === 'guide') return <GuideContent />;
  if (page === 'about') return <AboutContent />;
  if (page === 'guidelines') return <GuidelinesContent />;
  if (page === 'privacy') return <PrivacyContent />;
  return <TermsContent />;
}

function Section({ title, children }) {
  return (
    <section className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0 [&+&]:pt-6">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <div className="mt-2 space-y-3 text-sm font-medium leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function GuideContent() {
  return (
    <>
      <Section title="1. 현재 모집을 둘러보세요">
        <p>
          메인 화면은 모집 중, 추가 모집 중, 마감된 파티를 상태별로 보여줍니다.
          검색창에 게임 이름이나 닉네임을 입력하면 필요한 모집을 빠르게 찾을 수
          있고, 카드 보기와 달력 보기를 전환할 수 있습니다.
        </p>
      </Section>
      <Section title="2. 새로운 파티를 모집하세요">
        <p>
          화면 오른쪽 아래의 + 버튼을 누르고 게임 이름, 날짜와 시간, 닉네임,
          최대 정원, 수정용 비밀번호를 입력합니다. 날짜를 아직 정하지 않았다면
          상시 모집을, 시간만 미정이라면 시간 미정을 선택할 수 있습니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>설명에는 플레이 방식과 필요한 준비 사항을 적어주세요.</li>
          <li>수정용 비밀번호는 다른 사람에게 공유하지 마세요.</li>
          <li>전화번호, 실명, 주소 등 개인정보는 작성하지 마세요.</li>
        </ul>
      </Section>
      <Section title="3. 파티에 참가하고 일정을 확인하세요">
        <p>
          모집 카드를 선택하면 상세 정보와 참가자를 확인할 수 있습니다. 참가
          버튼에서 닉네임과 가능한 일정을 입력하고, 오늘의 게임 또는 달력
          화면에서 다가오는 약속을 확인하세요.
        </p>
      </Section>
      <Section title="4. 미니게임을 즐기세요">
        <p>
          상단 미니게임 메뉴에서는 요일별 추천 게임과 현재 기록을 볼 수
          있습니다. 기록용 닉네임에도 타인의 개인정보나 불쾌감을 주는 표현을
          사용하지 마세요.
        </p>
      </Section>
    </>
  );
}

function AboutContent() {
  return (
    <>
      <Section title="같이할 게임을 더 쉽게 약속하는 공간">
        <p>
          단체 채팅방에서 게임 약속을 잡다 보면 참가 의사가 여러 메시지에
          흩어지고 최종 인원을 다시 확인하기 어렵습니다. 게시판은 게임,
          일정, 모집 인원과 참가자를 하나의 카드에 정리하기 위해 만들었습니다.
        </p>
      </Section>
      <Section title="주요 기능">
        <ul className="list-disc space-y-1 pl-5">
          <li>날짜와 시간을 지정한 모집 및 상시 모집</li>
          <li>닉네임 기반의 간편한 참가자 관리</li>
          <li>카드·달력 화면을 이용한 일정 확인</li>
          <li>요일별 미니게임과 친구들의 기록</li>
        </ul>
      </Section>
      <Section title="운영 원칙">
        <p>
          필요한 정보만 입력받고, 개인정보 게시를 권장하지 않으며, 타인의
          권리나 커뮤니티 안전을 해치는 콘텐츠는 운영 정책에 따라 조치합니다.
        </p>
      </Section>
    </>
  );
}

function GuidelinesContent() {
  return (
    <>
      <Section title="좋은 모집글의 기준">
        <p>
          게임 이름, 일정, 모집 인원과 플레이 방식을 알아보기 쉽게 작성하고,
          일정이 바뀌거나 모집이 끝나면 글을 수정하거나 마감해 주세요. 의견이
          다르더라도 상대를 존중하는 표현을 사용해야 합니다.
        </p>
      </Section>
      <Section title="게시할 수 없는 콘텐츠">
        <ul className="list-disc space-y-1 pl-5">
          <li>불법 행위, 계정 탈취, 악성 프로그램 또는 현실의 위해를 조장하는 내용</li>
          <li>괴롭힘, 혐오 표현, 노골적인 성적·충격적 콘텐츠</li>
          <li>타인의 개인정보 공개, 저작권 침해 또는 사칭</li>
          <li>반복 광고, 스팸, 기록 조작과 과도한 자동 요청</li>
        </ul>
      </Section>
      <Section title="신고와 조치">
        <p>
          부적절한 콘텐츠는 건의 사항 또는 이메일로 제목, 닉네임과 문제 내용을
          알려주세요. 운영자는 실제 콘텐츠와 정책을 확인한 후 수정 요청,
          게시물 삭제 또는 기능 제한 등의 조치를 할 수 있습니다.
        </p>
      </Section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <Section title="처리하는 정보와 목적">
        <p>
          게시판 닉네임, 모집 제목과 설명, 일정, 참가 정보, 댓글과 건의 내용이
          서비스 제공을 위해 저장될 수 있습니다. Firebase 익명 사용자 식별자와
          요청 기록도 데이터 접근 제어와 보안 목적으로 처리될 수 있습니다.
        </p>
      </Section>
      <Section title="외부 서비스">
        <p>
          Firebase는 익명 인증과 데이터 저장에, Vercel은 웹사이트 호스팅에
          사용됩니다.
        </p>
      </Section>
      <Section title="이용자의 권리와 문의">
        <p>
          작성 비밀번호로 모집글을 수정·삭제하고 참가 정보를 취소할 수
          있습니다. 직접 처리하기 어려운 정보의 확인, 정정 또는 삭제는 이메일
          문의를 이용해 주세요. 비밀번호나 API 키 같은 민감한 정보는 보내지
          마세요.
        </p>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Section title="서비스 이용 조건">
        <p>
          게시판은 게임 모집, 일정, 댓글, 미니게임과 관련 기능을
          제공합니다. 기능은 운영 또는 기술 상황에 따라 추가·변경될 수
          있습니다.
        </p>
      </Section>
      <Section title="이용자의 책임">
        <ul className="list-disc space-y-1 pl-5">
          <li>모집과 참가 정보는 실제 의사에 따라 정확하게 작성합니다.</li>
          <li>수정용 비밀번호를 안전하게 관리합니다.</li>
          <li>타인의 개인정보와 저작권을 침해하지 않습니다.</li>
          <li>시스템 공격, 스팸, 사칭과 운영 방해를 하지 않습니다.</li>
        </ul>
      </Section>
      <Section title="게시물 관리">
        <p>
          게시물의 권리와 책임은 작성자에게 있으며 정책 위반 게시물은 숨김
          또는 삭제될 수 있습니다.
        </p>
      </Section>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-teal-50 p-4 text-sm font-bold leading-6 text-teal-900">
        <ShieldCheck className="mt-0.5 shrink-0" size={18} />
        중요한 게임 약속은 참가자와 별도로 확인하고, 공개 게시판에는 개인정보를
        올리지 마세요.
      </div>
    </>
  );
}
