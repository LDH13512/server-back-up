import { useRef, useState } from 'react';

const DEFAULT_EMOJIS = ['🧽', '🦆', '🌟', '🐥', '🥰', '🤗', '🌊'];

export default function useEasterEgg({ backgroundImage, notify }) {
  const [fallingItems, setFallingItems] = useState([]);
  const [isBackgroundActive, setIsBackgroundActive] = useState(
    () => localStorage.getItem('bg_active') === 'true'
  );
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const triggerCharacterRain = () => {
    if (fallingItems.length > 0) return;

    const items = Array.from({ length: 40 }).map((_, index) => {
      const slotIndex = Math.floor(Math.random() * DEFAULT_EMOJIS.length);
      return {
        id: index,
        left: Math.random() * 95,
        delay: Math.random() * 0.3,
        size: Math.random() * 100 + 120,
        slotIndex,
        emoji: DEFAULT_EMOJIS[slotIndex],
        spin: Math.random() > 0.5 ? 360 : -360,
      };
    });

    setFallingItems(items);
    setTimeout(() => setFallingItems([]), 1500);
  };

  const toggleBackground = () => {
    if (!backgroundImage) {
      notify('설정된 이스터에그 배경화면이 없습니다.', 'error');
      return;
    }

    setIsBackgroundActive((previous) => {
      const next = !previous;
      localStorage.setItem('bg_active', String(next));
      notify(`배경화면이 ${next ? '활성화' : '비활성화'} 되었습니다.`);
      return next;
    });
  };

  const handleHeaderClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      const clickCount = clickCountRef.current;
      clickCountRef.current = 0;
      clickTimerRef.current = null;

      if (clickCount === 1) window.location.reload();
      else if (clickCount === 2) triggerCharacterRain();
      else if (clickCount >= 3) toggleBackground();
    }, 280);
  };

  return {
    fallingItems,
    handleHeaderClick,
    isBackgroundActive,
  };
}
