import React from 'react';

export const getKSTDateString = (timestamp) => {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(timestamp));
  } catch(e) {
    const date = new Date(timestamp);
    const kstOffset = 9 * 60;
    const kstDate = new Date(date.getTime() + (date.getTimezoneOffset() + kstOffset) * 60000);
    return `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
  }
};

export const getDayOfWeek = (dateStr) => {
  if (!dateStr) return "";
  try {
    const week = ['일', '월', '화', '수', '목', '금', '토'];
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIdx = dateObj.getDay();
    return isNaN(dayIdx) ? "" : `(${week[dayIdx]})`;
  } catch (e) { return ""; }
};

export const validateFutureDateTime = (dateStr, isTimeUndecided, hourStr, minuteStr) => {
  if (!dateStr) return false;
  const now = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isTimeUndecided) {
    return dateStr >= getKSTDateString(now.getTime());
  } else {
    const selectedDate = new Date(year, month - 1, day, Number(hourStr || 0), Number(minuteStr || 0), 0);
    return selectedDate.getTime() >= now.getTime();
  }
};

export const resizeAndConvertBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120; const MAX_HEIGHT = 120;
        let width = img.width; let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const resizeBackground = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280; const MAX_HEIGHT = 800;
        let width = img.width; let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const linkify = (text) => {
  if(!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if(part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline" onClick={(e)=>e.stopPropagation()}>{part}</a>;
    }
    return part;
  });
};

export const callGeminiAPI = async (kind, input = {}) => {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, input })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || typeof data.data?.text !== 'string') throw new Error(data?.error?.code || 'AI_FAILED');
    return data.data.text;
  } catch (e) {
    if (kind === 'booking-title') return '즐겁게 한 판 함께하실 분을 모집합니다!';
    if (kind === 'booking-description') return '실력과 상관없이 편하게 웃고 즐기며 함께 게임하실 분을 기다립니다!';
    if (kind === 'kakao-share-intro') return '같이 하실분 급구 합니다!';
    if (kind === 'nickname') return '게임하는고양이';
    return '즐겁게 같이 게임하실 분을 모집합니다!';
  }
};
