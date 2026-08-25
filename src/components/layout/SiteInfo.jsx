import React from 'react';
import { Gamepad2, Mail } from 'lucide-react';
import {
  INQUIRY_MAILTO,
  SITE_INFORMATION,
} from '../dialogs/SiteInformationDialog';

const INFO_LINKS = [
  { key: 'guide', ...SITE_INFORMATION.guide },
  { key: 'about', ...SITE_INFORMATION.about },
  { key: 'guidelines', ...SITE_INFORMATION.guidelines },
  { key: 'privacy', ...SITE_INFORMATION.privacy },
  { key: 'terms', ...SITE_INFORMATION.terms },
];

export function SiteFooter({ onInfoOpen }) {
  return (
    <footer className="relative z-10 mt-12 border-t border-slate-200 bg-white/90">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <Gamepad2 className="text-teal-600" size={18} />
            게시판
          </div>
          <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-slate-500">
            지인 커뮤니티의 게임 모집과 일정을 편리하게 정리하기 위한
            서비스입니다. 게시물에 개인정보나 민감한 정보를 입력하지 마세요.
          </p>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            © 2026 게시판. 서비스 내 게시물의 권리는 각 작성자에게
            있습니다.
          </p>
        </div>
        <nav
          aria-label="서비스 정보"
          className="flex max-w-xl flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-500 sm:justify-end"
        >
          {INFO_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(event) => {
                if (!onInfoOpen) return;
                event.preventDefault();
                onInfoOpen(link.key);
              }}
              className="transition-colors hover:text-teal-700"
            >
              {link.title}
            </a>
          ))}
          <a
            href={INQUIRY_MAILTO}
            className="inline-flex items-center gap-1 transition-colors hover:text-teal-700"
          >
            <Mail size={12} /> 문의
          </a>
        </nav>
      </div>
    </footer>
  );
}

export { INFO_LINKS };
