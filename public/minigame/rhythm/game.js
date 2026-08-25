import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { addDoc, collection, doc, getDocs, getFirestore, updateDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const CC_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const INCOMPETECH_BASE = 'https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=';
const LANE_KEYS = ['d', 'f', 'j', 'k'];
const LANE_LABELS = ['D', 'F', 'J', 'K'];
const LANE_COLORS = ['#ff4fd8', '#8667ff', '#43e8ff', '#65f6a6'];
const BASE_TRAVEL_TIME = 1.75;
const MIN_NOTE_SPEED = 0.5;
const PERFECT_WINDOW = 0.08;
const GREAT_WINDOW = 0.14;
const GOOD_WINDOW = 0.22;
const MISS_WINDOW = 0.24;
const RHYTHM_KING_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const RHYTHM_KING_MIN_SONGS = 5;
const RHYTHM_KING_COUNTED_SONGS = 5;

const SONGS = [
  {
    id: 'neon-sprint',
    title: 'Neon Sprint',
    artist: '오락실 Original',
    bpm: 132,
    chartBpm: 132,
    difficulty: 3,
    color: '#43e8ff',
    duration: 66,
    original: true,
    synth: 'neon',
    seed: 13201,
    description: '밝은 신스 리드와 단단한 킥이 달리는 입문용 오리지널 트랙입니다.',
  },
  {
    id: 'starlight-drive',
    title: 'Starlight Drive',
    artist: '오락실 Original',
    bpm: 156,
    chartBpm: 156,
    difficulty: 6,
    color: '#ff4fd8',
    duration: 66,
    original: true,
    synth: 'starlight',
    seed: 15602,
    description: '빠른 아르페지오와 묵직한 베이스가 교차하는 도전적인 오리지널 트랙입니다.',
  },
  {
    id: 'bit-quest', title: 'Bit Quest', artist: 'Kevin MacLeod', bpm: 100, chartBpm: 100,
    difficulty: 2, color: '#ffe66d', duration: 66, seed: 1500073, beatOffset: 0.29, audio: './audio/bit-quest-web.mp3',
    isrc: 'USUAN1500073', description: '경쾌한 8비트 모험 분위기로 박자를 익히기 좋은 트랙입니다.',
  },
  {
    id: 'exit-the-premises', title: 'Exit the Premises', artist: 'Kevin MacLeod', bpm: 128, chartBpm: 128,
    difficulty: 7, color: '#ff668c', duration: 66, seed: 1500029, beatOffset: 0.2, audio: './audio/exit-the-premises-web.mp3',
    isrc: 'USUAN1500029', description: '큰 드럼과 강한 신스가 밀어붙이는 고난도 일렉트로닉 트랙입니다.',
  },
  {
    id: 'pixelland', title: 'Pixelland', artist: 'Kevin MacLeod', bpm: 230, chartBpm: 115,
    difficulty: 5, color: '#65f6a6', duration: 66, seed: 1500076, beatOffset: 0.21, audio: './audio/pixelland-web.mp3',
    isrc: 'USUAN1500076', description: '딕시랜드 감성과 8비트 사운드가 만난 유쾌하고 빠른 트랙입니다.',
  },
  {
    id: 'dungeon-level', title: '8bit Dungeon Level', artist: 'Kevin MacLeod', bpm: 106, chartBpm: 106,
    difficulty: 4, color: '#a98cff', duration: 66, seed: 1200066, beatOffset: 0.23, audio: './audio/8bit-dungeon-level-web.mp3',
    isrc: 'USUAN1200066', description: '스윙하는 사각파 신스가 지하 던전을 탐험하는 듯한 트랙입니다.',
  },
  {
    id: 'blip-stream', title: 'Blip Stream', artist: 'Kevin MacLeod', bpm: 150, chartBpm: 150,
    difficulty: 8, color: '#54a8ff', duration: 66, seed: 1500056, beatOffset: 0, audio: './audio/blip-stream-web.mp3',
    isrc: 'USUAN1500056', description: '빠르게 흐르는 칩튠 펄스를 따라가는 최상급 난도의 트랙입니다.',
  },
  {
    id: 'edm-detection', title: 'EDM Detection Mode', artist: 'Kevin MacLeod', bpm: 128, chartBpm: 128,
    difficulty: 6, color: '#ff9f43', duration: 66, seed: 1500026, beatOffset: 0.01, audio: './audio/edm-detection-mode-web.mp3',
    isrc: 'USUAN1500026', description: '두꺼운 백비트와 베이스가 중심을 잡는 정통 EDM 구간입니다.',
  },
  {
    id: 'salty-ditty', title: 'Salty Ditty', artist: 'Kevin MacLeod', bpm: 90, chartBpm: 90,
    difficulty: 3, color: '#37d6c0', duration: 66, seed: 1600053, beatOffset: 0.12, audio: './audio/salty-ditty-web.mp3',
    isrc: 'USUAN1600053', description: '해적 모험을 떠올리게 하는 통통 튀는 8비트 셔플 트랙입니다.',
  },
  {
    id: 'electrodoodle', title: 'Electrodoodle', artist: 'Kevin MacLeod', bpm: 120, chartBpm: 120,
    difficulty: 4, color: '#b8f45d', duration: 66, seed: 1200079, beatOffset: 0.2, audio: './audio/electrodoodle-web.mp3',
    isrc: 'USUAN1200079', description: '단순하고 선명한 리듬 위에 행복한 신스가 뛰노는 트랙입니다.',
  },
].map((song, index) => ({
  ...song,
  index,
  license: song.original ? 'ORIGINAL' : 'CC BY 4.0',
  sourcePage: song.isrc ? `${INCOMPETECH_BASE}${song.isrc}` : '',
  leaderboardPath: ['artifacts', 'rhythm', 'public', 'data', `leaderboard_${song.id.replaceAll('-', '_')}`],
}));

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canvas = $('#gameCanvas');
const ctx = canvas.getContext('2d');

const elements = {
  selectView: $('#selectView'), gameView: $('#gameView'), resultView: $('#resultView'), songGrid: $('#songGrid'),
  songDetail: $('#songDetail'), detailArt: $('#detailArt'), detailIndex: $('#detailIndex'), detailLicense: $('#detailLicense'),
  detailDifficulty: $('#detailDifficulty'), detailKicker: $('#detailKicker'), detailTitle: $('#detailTitle'),
  detailArtist: $('#detailArtist'), detailDescription: $('#detailDescription'), detailBpm: $('#detailBpm'),
  detailLength: $('#detailLength'), detailBest: $('#detailBest'), detailCredit: $('#detailCredit'),
  detailSpeedRange: $('#detailSpeedRange'), detailSpeedValue: $('#detailSpeedValue'),
  detailSpeedDown: $('#detailSpeedDown'), detailSpeedUp: $('#detailSpeedUp'),
  playButton: $('#playButton'), leaderboardButton: $('#leaderboardButton'), creditsButton: $('#creditsButton'),
  creditsDialog: $('#creditsDialog'), creditsList: $('#creditsList'), leaderboardDialog: $('#leaderboardDialog'),
  leaderboardTitle: $('#leaderboardTitle'), leaderboardList: $('#leaderboardList'), connectionStatus: $('#connectionStatus'),
  overallLeaderboardList: $('#overallLeaderboardList'),
  quitButton: $('#quitButton'), playingIndex: $('#playingIndex'), playingTitle: $('#playingTitle'),
  playingArtist: $('#playingArtist'), scoreValue: $('#scoreValue'), comboValue: $('#comboValue'),
  gameSpeedRange: $('#gameSpeedRange'), gameSpeedValue: $('#gameSpeedValue'),
  gameSpeedDown: $('#gameSpeedDown'), gameSpeedUp: $('#gameSpeedUp'),
  judgementValue: $('#judgementValue'), perfectValue: $('#perfectValue'), greatValue: $('#greatValue'),
  goodValue: $('#goodValue'), missValue: $('#missValue'), accuracyValue: $('#accuracyValue'), songProgress: $('#songProgress'),
  loadingOverlay: $('#loadingOverlay'), loadingTitle: $('#loadingTitle'), loadingMessage: $('#loadingMessage'),
  countdownOverlay: $('#countdownOverlay'), countdownValue: $('#countdownValue'), resultGrade: $('#resultGrade'),
  resultTitle: $('#resultTitle'), resultSubtitle: $('#resultSubtitle'), resultScore: $('#resultScore'),
  resultAccuracy: $('#resultAccuracy'), resultCombo: $('#resultCombo'), resultPerfect: $('#resultPerfect'),
  resultMiss: $('#resultMiss'), nicknameInput: $('#nicknameInput'), submitScoreButton: $('#submitScoreButton'),
  submitHint: $('#submitHint'), retryButton: $('#retryButton'), resultLeaderboardButton: $('#resultLeaderboardButton'),
  selectButton: $('#selectButton'), toast: $('#toast'),
};

let selectedSong = SONGS[0];
let noteSpeed = 1;
try {
  const savedSpeedValue = localStorage.getItem('rhythm_note_speed');
  const savedSpeed = Number(savedSpeedValue);
  if (savedSpeedValue !== null && Number.isFinite(savedSpeed)) {
    noteSpeed = Math.min(3, Math.max(0.5, Math.round(savedSpeed * 10) / 10));
  }
} catch { /* Private browsing can block storage. */ }
let audioContext = null;
let sfxGain = null;
let noiseBuffer = null;
let firebaseDb = null;
let firebaseUser = null;
let audioBufferSource = null;
let sessionGain = null;
let animationId = 0;
let sessionToken = 0;
let toastTimer = 0;
const audioBufferCache = new Map();
const lanePressed = [false, false, false, false];
const particles = [];

const game = {
  phase: 'idle',
  startAt: 0,
  duration: 0,
  beatOffset: 0,
  notes: [],
  missCursor: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  counts: { perfect: 0, great: 0, good: 0, miss: 0 },
  lastJudgement: 'READY',
  lastJudgementAt: 0,
};

function difficultyLabel(value) {
  if (value <= 2) return 'EASY';
  if (value <= 4) return 'NORMAL';
  if (value <= 6) return 'HARD';
  return 'EXPERT';
}

function getLocalBest(songId) {
  try { return Number(localStorage.getItem(`rhythm_best_${songId}`) || 0); }
  catch { return 0; }
}

function setLocalBest(songId, score) {
  try { localStorage.setItem(`rhythm_best_${songId}`, String(score)); }
  catch { /* Private browsing can block storage. */ }
}

function currentTravelTime() {
  return BASE_TRAVEL_TIME / noteSpeed;
}

function setNoteSpeed(value, persist = true) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return;
  noteSpeed = Math.min(3, Math.max(0.5, Math.round(numeric * 10) / 10));
  const formatted = `${noteSpeed.toFixed(1)}x`;
  elements.detailSpeedRange.value = String(noteSpeed);
  elements.gameSpeedRange.value = String(noteSpeed);
  elements.detailSpeedValue.textContent = formatted;
  elements.gameSpeedValue.textContent = formatted;
  if (persist) {
    try { localStorage.setItem('rhythm_note_speed', String(noteSpeed)); } catch { /* No-op. */ }
  }
  if (game.phase === 'preparing' && game.notes.length) {
    game.notes = generateChart(selectedSong, game.duration, game.beatOffset);
  }
  if (game.phase !== 'playing') drawGame(0);
}

function adjustNoteSpeed(delta) {
  setNoteSpeed(noteSpeed + delta);
}

function renderSongGrid() {
  elements.songGrid.replaceChildren();
  SONGS.forEach((song) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `song-card${song.id === selectedSong.id ? ' active' : ''}`;
    card.style.setProperty('--song-color', song.color);
    card.dataset.songId = song.id;
    card.setAttribute('aria-pressed', song.id === selectedSong.id ? 'true' : 'false');

    const art = document.createElement('span');
    art.className = 'track-art';
    art.textContent = String(song.index + 1).padStart(2, '0');

    const copy = document.createElement('span');
    copy.className = 'song-card-copy';
    const type = document.createElement('small');
    type.textContent = song.original ? 'ORIGINAL TRACK' : 'LICENSED TRACK';
    const title = document.createElement('strong');
    title.textContent = song.title;
    const meta = document.createElement('span');
    meta.textContent = `${song.artist} · ${song.bpm} BPM`;
    const dots = document.createElement('span');
    dots.className = 'level-dots';
    for (let dotIndex = 0; dotIndex < 8; dotIndex += 1) {
      const dot = document.createElement('i');
      if (dotIndex < song.difficulty) dot.className = 'on';
      dots.append(dot);
    }
    copy.append(type, title, meta, dots);
    card.append(art, copy);
    card.addEventListener('click', () => selectSong(song.id));
    elements.songGrid.append(card);
  });
}

function renderCredits() {
  elements.creditsList.replaceChildren();
  SONGS.filter((song) => !song.original).forEach((song) => {
    const row = document.createElement('div');
    row.className = 'credit-row';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = song.title;
    const detail = document.createElement('span');
    detail.textContent = 'Kevin MacLeod · incompetech.com · CC BY 4.0';
    const link = document.createElement('a');
    link.href = song.sourcePage;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '원본·라이선스 ↗';
    copy.append(title, detail);
    row.append(copy, link);
    elements.creditsList.append(row);
  });
}

function selectSong(songId) {
  selectedSong = SONGS.find((song) => song.id === songId) || SONGS[0];
  $$('.song-card').forEach((card) => {
    const active = card.dataset.songId === selectedSong.id;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const song = selectedSong;
  elements.songDetail.style.setProperty('--detail-color', song.color);
  elements.detailArt.style.setProperty('--detail-color', song.color);
  elements.detailIndex.textContent = String(song.index + 1).padStart(2, '0');
  elements.detailLicense.textContent = song.license;
  elements.detailDifficulty.textContent = `${difficultyLabel(song.difficulty)} · LV.${song.difficulty}`;
  elements.detailKicker.textContent = song.original ? 'ORIGINAL TRACK' : 'LICENSED TRACK';
  elements.detailTitle.textContent = song.title;
  elements.detailArtist.textContent = song.artist;
  elements.detailDescription.textContent = song.description;
  elements.detailBpm.textContent = song.bpm;
  elements.detailLength.textContent = `약 ${song.duration}초`;
  elements.detailBest.textContent = getLocalBest(song.id).toLocaleString('ko-KR');
  elements.detailCredit.textContent = song.original
    ? '이 게임을 위해 Web Audio로 직접 구성한 오리지널 곡입니다.'
    : `“${song.title}” Kevin MacLeod (incompetech.com), CC BY 4.0`;
}

function showView(name) {
  elements.selectView.classList.toggle('hidden', name !== 'select');
  elements.gameView.classList.toggle('hidden', name !== 'game');
  elements.resultView.classList.toggle('hidden', name !== 'result');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, kind = '') {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${kind}`.trim();
  toastTimer = window.setTimeout(() => { elements.toast.className = 'toast'; }, 2800);
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    sfxGain = audioContext.createGain();
    sfxGain.gain.value = 0.22;
    sfxGain.connect(audioContext.destination);
    noiseBuffer = createNoiseBuffer();
  }
  if (audioContext.state === 'suspended') await audioContext.resume();
}

function createNoiseBuffer() {
  const length = Math.floor(audioContext.sampleRate * 0.35);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.72 + white * 0.28;
    data[i] = last;
  }
  return buffer;
}

async function loadSongBuffer(song, token) {
  if (song.original) return null;
  if (audioBufferCache.has(song.id)) return audioBufferCache.get(song.id);
  elements.loadingTitle.textContent = `${song.title} 로딩 중`;
  elements.loadingMessage.textContent = '선택한 음원 하나만 내려받고 있습니다.';
  const response = await fetch(song.audio);
  if (!response.ok) throw new Error(`음원 응답 오류 (${response.status})`);
  const arrayBuffer = await response.arrayBuffer();
  if (token !== sessionToken) throw new Error('재생 준비가 취소되었습니다.');
  elements.loadingMessage.textContent = '박자 회로를 분석하고 있습니다.';
  const decoded = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache.set(song.id, decoded);
  return decoded;
}

function estimateBeatOffset(buffer, bpm, startOffset = 0) {
  if (!buffer) return 0;
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const bucketSeconds = 0.01;
  const bucketSize = Math.max(1, Math.floor(sampleRate * bucketSeconds));
  const analysisSeconds = Math.min(14, buffer.duration - startOffset - 0.5);
  const bucketCount = Math.max(1, Math.floor(analysisSeconds / bucketSeconds));
  const envelope = new Float32Array(bucketCount);
  const startSample = Math.floor(startOffset * sampleRate);

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const from = startSample + bucket * bucketSize;
    const to = Math.min(data.length, from + bucketSize);
    let peak = 0;
    for (let sample = from; sample < to; sample += 4) peak = Math.max(peak, Math.abs(data[sample]));
    envelope[bucket] = peak;
  }

  const beat = 60 / bpm;
  let bestPhase = 0;
  let bestScore = -Infinity;
  for (let phase = 0; phase < beat; phase += bucketSeconds) {
    let score = 0;
    let count = 0;
    for (let time = phase; time < analysisSeconds; time += beat) {
      const index = Math.round(time / bucketSeconds);
      const hit = envelope[index] || 0;
      const before = envelope[Math.max(0, index - 3)] || 0;
      score += hit * 1.4 + Math.max(0, hit - before) * 1.8;
      count += 1;
    }
    score /= Math.max(1, count);
    if (score > bestScore) { bestScore = score; bestPhase = phase; }
  }
  return bestPhase;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function generateChart(song, duration, beatOffset) {
  const random = seededRandom(song.seed);
  const beat = 60 / song.chartBpm;
  const step = beat / 2;
  const chartIntro = beatOffset + beat * 4;
  const earliestVisibleTime = BASE_TRAVEL_TIME / MIN_NOTE_SPEED + 0.3;
  const skippedSteps = Math.max(0, Math.ceil((earliestVisibleTime - chartIntro) / step));
  const start = chartIntro + skippedSteps * step;
  const notes = [];
  let previousLane = Math.floor(random() * 4);
  let stepIndex = 0;

  for (let time = start; time < duration - 0.6; time += step) {
    const isOffbeat = stepIndex % 2 === 1;
    let include = true;
    if (song.difficulty <= 2 && isOffbeat) include = random() < 0.14;
    else if (song.difficulty <= 4 && isOffbeat) include = random() < 0.58;
    else if (song.difficulty <= 6 && isOffbeat) include = random() < 0.83;
    else if (stepIndex % 8 === 7) include = random() < 0.82;

    if (include) {
      let lane;
      if (stepIndex % 8 === 0) lane = Math.floor((stepIndex / 8) % 4);
      else if (stepIndex % 8 === 4) lane = 3 - previousLane;
      else lane = (previousLane + 1 + Math.floor(random() * 3)) % 4;
      notes.push({ time, lane, judged: false, result: '' });
      previousLane = lane;

      if (song.difficulty >= 7 && stepIndex % 16 === 12) {
        const chordLane = (lane + 2) % 4;
        notes.push({ time, lane: chordLane, judged: false, result: '' });
      }
    }
    stepIndex += 1;
  }
  return notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
}

function stopAudio() {
  if (audioBufferSource) {
    try { audioBufferSource.stop(); } catch { /* Already stopped. */ }
    audioBufferSource = null;
  }
  if (sessionGain && audioContext) {
    const now = audioContext.currentTime;
    sessionGain.gain.cancelScheduledValues(now);
    sessionGain.gain.setValueAtTime(Math.max(0.0001, sessionGain.gain.value), now);
    sessionGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    const oldGain = sessionGain;
    window.setTimeout(() => { try { oldGain.disconnect(); } catch { /* No-op. */ } }, 140);
    sessionGain = null;
  }
}

function scheduleTone(destination, frequency, time, duration, options = {}) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = options.wave || 'square';
  oscillator.frequency.setValueAtTime(frequency, time);
  if (options.slideTo) oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, time + duration);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(options.gain || 0.04, time + Math.min(0.015, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.03);
}

function scheduleNoise(destination, time, duration, gainValue = 0.04, highpass = 1000) {
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  gain.gain.setValueAtTime(gainValue, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
  source.stop(time + duration + 0.02);
}

function scheduleKick(destination, time, strong = false) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(strong ? 150 : 125, time);
  oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.12);
  gain.gain.setValueAtTime(strong ? 0.26 : 0.19, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.2);
}

function scheduleOriginalTrack(song, startAt, duration, destination) {
  const beat = 60 / song.chartBpm;
  const neon = song.synth === 'neon';
  const roots = neon ? [48, 44, 41, 43] : [45, 41, 48, 43];
  const leadScale = neon ? [0, 4, 7, 11, 12, 7, 4, 2] : [0, 3, 7, 10, 12, 15, 10, 7];
  const leadPattern = neon ? [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 6, 5, 4, 2, 1, 3] : [0, 4, 2, 5, 7, 5, 3, 2, 0, 2, 4, 7, 6, 4, 3, 1];
  const midiToHz = (note) => 440 * (2 ** ((note - 69) / 12));

  for (let beatIndex = 0; beatIndex * beat < duration; beatIndex += 1) {
    const time = startAt + beatIndex * beat;
    const barBeat = beatIndex % 4;
    const root = roots[Math.floor(beatIndex / 8) % roots.length];
    scheduleKick(destination, time, barBeat === 0);
    if (barBeat === 1 || barBeat === 3) {
      scheduleNoise(destination, time, 0.13, neon ? 0.05 : 0.065, 650);
      scheduleTone(destination, 185, time, 0.11, { wave: 'triangle', gain: 0.025 });
    }
    scheduleTone(destination, midiToHz(root - 12), time, beat * 0.72, { wave: neon ? 'sawtooth' : 'square', gain: 0.045 });
    scheduleNoise(destination, time + beat / 2, 0.035, 0.024, 4200);

    if (barBeat === 0) {
      [0, 4, 7].forEach((interval) => {
        scheduleTone(destination, midiToHz(root + interval), time, beat * 3.7, { wave: 'sine', gain: 0.012 });
      });
    }
  }

  const eighth = beat / 2;
  for (let step = 0; step * eighth < duration; step += 1) {
    const time = startAt + step * eighth;
    const root = roots[Math.floor(step / 16) % roots.length];
    const melody = root + 12 + leadScale[leadPattern[step % leadPattern.length] % leadScale.length];
    const active = neon ? step % 4 !== 3 || step % 16 === 15 : step % 8 !== 6;
    if (active) scheduleTone(destination, midiToHz(melody), time, eighth * 0.64, { wave: neon ? 'square' : 'sawtooth', gain: neon ? 0.025 : 0.021 });
    if (!neon && step % 2 === 1) scheduleNoise(destination, time, 0.025, 0.014, 5200);
  }
}

function playHitSound(result) {
  if (!audioContext || !sfxGain || result === 'miss') return;
  const now = audioContext.currentTime;
  const frequency = result === 'perfect' ? 1046 : result === 'great' ? 880 : 659;
  scheduleTone(sfxGain, frequency, now, 0.055, { wave: 'sine', gain: result === 'perfect' ? 0.12 : 0.08 });
}

async function prepareGame() {
  const token = ++sessionToken;
  cancelAnimationFrame(animationId);
  stopAudio();
  showView('game');
  elements.loadingOverlay.classList.remove('hidden');
  elements.countdownOverlay.classList.add('hidden');
  elements.loadingTitle.textContent = '오디오 회로를 깨우고 있습니다';
  elements.loadingMessage.textContent = '잠시만 기다려 주세요.';
  setPlayingHeader();
  resetGameState();
  drawGame(0);

  try {
    await ensureAudioContext();
    const buffer = await loadSongBuffer(selectedSong, token);
    if (token !== sessionToken) return;
    const previewStart = selectedSong.previewStart || 0;
    game.duration = buffer
      ? Math.min(selectedSong.duration, Math.max(10, buffer.duration - previewStart - 0.3))
      : selectedSong.duration;
    game.beatOffset = buffer
      ? (Number.isFinite(selectedSong.beatOffset)
        ? selectedSong.beatOffset
        : estimateBeatOffset(buffer, selectedSong.chartBpm, previewStart))
      : 0;
    game.notes = generateChart(selectedSong, game.duration, game.beatOffset);
    await runCountdown(token);
    if (token !== sessionToken) return;
    startPlayback(buffer, previewStart);
  } catch (error) {
    console.error('Game preparation failed:', error);
    elements.loadingTitle.textContent = '음원을 불러오지 못했습니다';
    elements.loadingMessage.textContent = '네트워크를 확인한 뒤 다시 시도해 주세요.';
    showToast('게임 준비 중 오류가 발생했습니다.', 'error');
  }
}

async function runCountdown(token) {
  elements.loadingOverlay.classList.add('hidden');
  elements.countdownOverlay.classList.remove('hidden');
  for (const value of ['3', '2', '1']) {
    if (token !== sessionToken) return;
    elements.countdownValue.textContent = value;
    elements.countdownValue.style.animation = 'none';
    void elements.countdownValue.offsetWidth;
    elements.countdownValue.style.animation = '';
    await wait(650);
  }
  elements.countdownValue.textContent = 'GO';
  await wait(350);
}

function startPlayback(buffer, previewStart) {
  sessionGain = audioContext.createGain();
  sessionGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  sessionGain.gain.exponentialRampToValueAtTime(0.62, audioContext.currentTime + 0.06);
  sessionGain.connect(audioContext.destination);
  game.startAt = audioContext.currentTime + 0.12;

  if (buffer) {
    audioBufferSource = audioContext.createBufferSource();
    audioBufferSource.buffer = buffer;
    audioBufferSource.connect(sessionGain);
    audioBufferSource.start(game.startAt, previewStart, game.duration + 0.1);
  } else {
    scheduleOriginalTrack(selectedSong, game.startAt, game.duration, sessionGain);
  }

  game.phase = 'playing';
  elements.countdownOverlay.classList.add('hidden');
  animationId = requestAnimationFrame(gameLoop);
}

function resetGameState() {
  game.phase = 'preparing';
  game.startAt = 0;
  game.duration = selectedSong.duration;
  game.beatOffset = 0;
  game.notes = [];
  game.missCursor = 0;
  game.score = 0;
  game.combo = 0;
  game.maxCombo = 0;
  game.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
  game.lastJudgement = 'READY';
  game.lastJudgementAt = 0;
  particles.length = 0;
  lanePressed.fill(false);
  updateHud();
  elements.songProgress.style.width = '0%';
}

function setPlayingHeader() {
  elements.playingIndex.textContent = String(selectedSong.index + 1).padStart(2, '0');
  elements.playingIndex.style.background = selectedSong.color;
  elements.playingTitle.textContent = selectedSong.title;
  elements.playingArtist.textContent = selectedSong.artist;
}

function currentSongTime() {
  if (!audioContext) return 0;
  if (typeof audioContext.getOutputTimestamp === 'function') {
    const timestamp = audioContext.getOutputTimestamp();
    if (timestamp?.contextTime > 0 && timestamp?.performanceTime > 0) {
      const elapsedSinceOutput = Math.min(0.25, Math.max(0, (performance.now() - timestamp.performanceTime) / 1000));
      return timestamp.contextTime + elapsedSinceOutput - game.startAt;
    }
  }
  const outputLatency = Number(audioContext.outputLatency) || Number(audioContext.baseLatency) || 0;
  return audioContext.currentTime - outputLatency - game.startAt;
}

function gameLoop() {
  if (game.phase !== 'playing') return;
  const time = currentSongTime();
  updateMisses(time);
  updateParticles();
  drawGame(time);
  elements.songProgress.style.width = `${Math.min(100, Math.max(0, time / game.duration * 100))}%`;
  if (time >= game.duration) {
    finishGame();
    return;
  }
  animationId = requestAnimationFrame(gameLoop);
}

function updateMisses(time) {
  while (game.missCursor < game.notes.length && game.notes[game.missCursor].time < time - MISS_WINDOW) {
    const note = game.notes[game.missCursor];
    if (!note.judged) applyJudgement(note, 'miss', 0);
    game.missCursor += 1;
  }
}

function judgeLane(lane) {
  if (game.phase !== 'playing') return;
  const time = currentSongTime();
  let candidate = null;
  let smallestDifference = Infinity;
  for (let index = Math.max(0, game.missCursor - 2); index < game.notes.length; index += 1) {
    const note = game.notes[index];
    if (note.time > time + GOOD_WINDOW) break;
    if (!note.judged && note.lane === lane) {
      const difference = Math.abs(note.time - time);
      if (difference < smallestDifference) { candidate = note; smallestDifference = difference; }
    }
  }
  if (!candidate || smallestDifference > GOOD_WINDOW) return;
  const result = smallestDifference <= PERFECT_WINDOW ? 'perfect' : smallestDifference <= GREAT_WINDOW ? 'great' : 'good';
  applyJudgement(candidate, result, smallestDifference);
}

function applyJudgement(note, result, difference) {
  note.judged = true;
  note.result = result;
  game.counts[result] += 1;
  if (result === 'miss') {
    game.combo = 0;
  } else {
    game.combo += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    const base = result === 'perfect' ? 1000 : result === 'great' ? 700 : 400;
    const comboBonus = 1 + Math.min(0.5, Math.floor(game.combo / 10) * 0.05);
    game.score += Math.round(base * comboBonus);
    createHitParticles(note.lane, result);
    playHitSound(result);
  }
  game.lastJudgement = result.toUpperCase();
  game.lastJudgementAt = performance.now();
  if (result !== 'miss') game.lastJudgement += ` · ${Math.round(difference * 1000)}ms`;
  updateHud();
}

function getAccuracy() {
  const judged = Object.values(game.counts).reduce((total, value) => total + value, 0);
  if (!judged) return 100;
  const weighted = game.counts.perfect + game.counts.great * 0.75 + game.counts.good * 0.45;
  return weighted / judged * 100;
}

function updateHud() {
  elements.scoreValue.textContent = game.score.toLocaleString('ko-KR');
  elements.comboValue.textContent = game.combo;
  elements.judgementValue.textContent = game.lastJudgement;
  elements.judgementValue.style.color = game.lastJudgement.startsWith('MISS') ? '#ff668c'
    : game.lastJudgement.startsWith('GOOD') ? '#ffe66d'
      : game.lastJudgement.startsWith('GREAT') ? '#65f6a6' : '#43e8ff';
  elements.perfectValue.textContent = game.counts.perfect;
  elements.greatValue.textContent = game.counts.great;
  elements.goodValue.textContent = game.counts.good;
  elements.missValue.textContent = game.counts.miss;
  elements.accuracyValue.textContent = `${getAccuracy().toFixed(1)}%`;
}

function createHitParticles(lane, result) {
  const laneWidth = canvas.width / 4;
  const x = lane * laneWidth + laneWidth / 2;
  const color = result === 'perfect' ? '#ffffff' : LANE_COLORS[lane];
  for (let index = 0; index < 12; index += 1) {
    const angle = Math.PI * (1.05 + Math.random() * 0.9);
    const speed = 2 + Math.random() * 5;
    particles.push({ x, y: 650, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
  }
}

function updateParticles() {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.16;
    particle.life -= 0.035;
    if (particle.life <= 0) particles.splice(index, 1);
  }
}

const stars = Array.from({ length: 45 }, (_, index) => ({
  x: (index * 173) % canvas.width,
  y: (index * 97) % 620,
  size: 0.7 + (index % 4) * 0.35,
  alpha: 0.16 + (index % 5) * 0.07,
}));

function drawGame(time = 0) {
  const width = canvas.width;
  const height = canvas.height;
  const laneWidth = width / 4;
  const judgeY = 650;
  const topY = 34;
  const beat = 60 / selectedSong.chartBpm;
  const travelTime = currentTravelTime();
  const pulse = 0.5 + Math.sin(Math.max(0, time - game.beatOffset) / beat * Math.PI * 2) * 0.5;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0d0925');
  gradient.addColorStop(0.65, '#100a29');
  gradient.addColorStop(1, '#080512');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha + pulse * 0.12;
    ctx.fillStyle = '#bdefff';
    ctx.beginPath();
    ctx.arc(star.x, (star.y + time * 12) % 620, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  for (let lane = 0; lane < 4; lane += 1) {
    const x = lane * laneWidth;
    const laneGradient = ctx.createLinearGradient(x, 0, x + laneWidth, 0);
    laneGradient.addColorStop(0, 'rgba(255,255,255,0.008)');
    laneGradient.addColorStop(0.5, lanePressed[lane] ? `${LANE_COLORS[lane]}30` : `${LANE_COLORS[lane]}0d`);
    laneGradient.addColorStop(1, 'rgba(255,255,255,0.008)');
    ctx.fillStyle = laneGradient;
    ctx.fillRect(x, topY, laneWidth, judgeY - topY + 52);
    if (lane > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.09)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, height); ctx.stroke();
    }
  }

  if (game.notes.length) {
    const firstBeat = Math.floor((time - game.beatOffset) / beat) - 1;
    for (let beatIndex = firstBeat; beatIndex < firstBeat + 10; beatIndex += 1) {
      const beatTime = game.beatOffset + beatIndex * beat;
      const distance = beatTime - time;
      if (distance < -0.2 || distance > travelTime) continue;
      const y = judgeY - distance / travelTime * (judgeY - topY);
      ctx.strokeStyle = beatIndex % 4 === 0 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.045)';
      ctx.lineWidth = beatIndex % 4 === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }

  for (const note of game.notes) {
    if (note.judged) continue;
    const distance = note.time - time;
    if (distance > travelTime + 0.1 || distance < -MISS_WINDOW - 0.05) continue;
    const y = judgeY - distance / travelTime * (judgeY - topY);
    const x = note.lane * laneWidth + 18;
    const noteWidth = laneWidth - 36;
    ctx.save();
    ctx.shadowColor = LANE_COLORS[note.lane];
    ctx.shadowBlur = 18;
    const noteGradient = ctx.createLinearGradient(x, y - 10, x + noteWidth, y + 10);
    noteGradient.addColorStop(0, LANE_COLORS[note.lane]);
    noteGradient.addColorStop(.5, '#ffffff');
    noteGradient.addColorStop(1, LANE_COLORS[note.lane]);
    ctx.fillStyle = noteGradient;
    roundedRect(ctx, x, y - 10, noteWidth, 20, 8);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = selectedSong.color;
  ctx.shadowBlur = 12 + pulse * 14;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = .88;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, judgeY); ctx.lineTo(width, judgeY); ctx.stroke();
  ctx.restore();

  for (let lane = 0; lane < 4; lane += 1) {
    const x = lane * laneWidth + 13;
    ctx.fillStyle = lanePressed[lane] ? `${LANE_COLORS[lane]}60` : 'rgba(255,255,255,.045)';
    ctx.strokeStyle = lanePressed[lane] ? LANE_COLORS[lane] : 'rgba(255,255,255,.15)';
    ctx.lineWidth = lanePressed[lane] ? 3 : 1;
    roundedRect(ctx, x, 674, laneWidth - 26, 63, 13);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = lanePressed[lane] ? '#fff' : 'rgba(255,255,255,.7)';
    ctx.font = '900 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(LANE_LABELS[lane], lane * laneWidth + laneWidth / 2, 714);
  }

  particles.forEach((particle) => {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.beginPath(); ctx.arc(particle.x, particle.y, 2.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (performance.now() - game.lastJudgementAt < 360 && game.phase === 'playing') {
    ctx.fillStyle = game.lastJudgement.startsWith('MISS') ? '#ff668c' : '#ffffff';
    ctx.font = '950 26px system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = selectedSong.color;
    ctx.shadowBlur = 18;
    ctx.fillText(game.lastJudgement.split(' · ')[0], width / 2, 590);
    ctx.shadowBlur = 0;
  }
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function finishGame() {
  if (game.phase !== 'playing') return;
  game.phase = 'finished';
  cancelAnimationFrame(animationId);
  stopAudio();
  const accuracy = getAccuracy();
  const grade = accuracy >= 98 ? 'S' : accuracy >= 92 ? 'A' : accuracy >= 84 ? 'B' : accuracy >= 72 ? 'C' : 'D';
  const oldBest = getLocalBest(selectedSong.id);
  const isNewBest = game.score > oldBest;
  if (isNewBest) setLocalBest(selectedSong.id, game.score);

  elements.resultGrade.textContent = grade;
  elements.resultGrade.style.borderColor = selectedSong.color;
  elements.resultGrade.style.color = selectedSong.color;
  elements.resultTitle.textContent = selectedSong.title;
  elements.resultSubtitle.textContent = isNewBest ? '새로운 개인 최고 기록입니다!' : grade === 'S' ? '회로와 완벽하게 동기화됐습니다.' : '한 번 더 도전하면 기록을 높일 수 있어요.';
  elements.resultScore.textContent = game.score.toLocaleString('ko-KR');
  elements.resultAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  elements.resultCombo.textContent = game.maxCombo;
  elements.resultPerfect.textContent = game.counts.perfect;
  elements.resultMiss.textContent = game.counts.miss;
  elements.submitHint.textContent = firebaseUser ? '곡마다 최고 점수가 별도로 저장됩니다.' : 'DB 연결 후 기록을 등록할 수 있습니다.';
  try { elements.nicknameInput.value = localStorage.getItem('rhythm_nickname') || ''; } catch { /* No-op. */ }
  selectSong(selectedSong.id);
  showView('result');
}

function setLanePressed(lane, pressed) {
  lanePressed[lane] = pressed;
  const button = $(`.touch-controls [data-lane="${lane}"]`);
  if (button) button.classList.toggle('active', pressed);
  if (game.phase !== 'playing') drawGame(0);
}

async function initFirebase() {
  try {
    const encoded = typeof _mg_fbc !== 'undefined' ? _mg_fbc : null;
    if (!encoded) throw new Error('Firebase runtime configuration is missing.');
    const config = JSON.parse(atob(encoded));
    const app = initializeApp(config);
    const auth = getAuth(app);
    firebaseDb = getFirestore(app);
    onAuthStateChanged(auth, (user) => {
      firebaseUser = user;
      if (user) {
        elements.connectionStatus.className = 'connection-pill online';
        queueMicrotask(loadOverallLeaderboard);
        elements.connectionStatus.innerHTML = '<i></i> 랭킹 연결됨';
      }
    });
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(auth, __initial_auth_token);
    } else {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.warn('Leaderboard connection unavailable:', error);
    firebaseDb = null;
    firebaseUser = null;
    elements.connectionStatus.className = 'connection-pill offline';
    renderOverallLeaderboard([], '종합 리더보드 연결을 확인해 주세요.');
    elements.connectionStatus.innerHTML = '<i></i> 오프라인';
  }
}

async function fetchLeaderboard(song) {
  if (!firebaseDb || !firebaseUser) throw new Error('리더보드가 아직 연결되지 않았습니다.');
  const snapshot = await getDocs(collection(firebaseDb, ...song.leaderboardPath));
  return snapshot.docs.map((record) => ({ id: record.id, ...record.data() }))
    .filter((record) => typeof record.nickname === 'string' && Number.isFinite(Number(record.score)))
    .map((record) => ({ ...record, score: Number(record.score), timestamp: Number(record.timestamp || 0) }))
    .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);
}

function calculateOverallStandings(songLeaderboards) {
  const players = new Map();

  songLeaderboards.forEach((records, songIndex) => {
    const bestByNickname = new Map();
    records.forEach((record) => {
      const nickname = String(record.nickname || '').trim();
      const key = nickname.toLocaleLowerCase('ko-KR');
      const score = Number(record.score);
      if (!key || !Number.isFinite(score)) return;
      const entry = {
        nickname,
        key,
        songIndex,
        score,
        accuracy: Number(record.accuracy) || 0,
        maxCombo: Number(record.maxCombo) || 0,
        timestamp: Number(record.timestamp) || Number.MAX_SAFE_INTEGER,
      };
      const current = bestByNickname.get(key);
      if (!current || score > current.score || (score === current.score && entry.timestamp < current.timestamp)) {
        bestByNickname.set(key, entry);
      }
    });

    [...bestByNickname.values()]
      .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp || a.key.localeCompare(b.key, 'ko-KR'))
      .forEach((entry, placementIndex) => {
        const player = players.get(entry.key) || { key: entry.key, nickname: entry.nickname, songs: [] };
        player.nickname = entry.nickname;
        player.songs.push({
          ...entry,
          placement: placementIndex + 1,
          points: RHYTHM_KING_POINTS[placementIndex] || 0,
        });
        players.set(entry.key, player);
      });
  });

  return [...players.values()]
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
}

function renderOverallLeaderboard(standings, message = '') {
  elements.overallLeaderboardList.replaceChildren();
  if (!standings.length) {
    const empty = document.createElement('div');
    empty.className = 'overall-empty';
    empty.textContent = message || '아직 5곡 이상 등록한 플레이어가 없습니다.\n첫 번째 리듬왕에 도전해 보세요!';
    empty.style.whiteSpace = 'pre-line';
    elements.overallLeaderboardList.append(empty);
    return;
  }

  standings.slice(0, 5).forEach((player, index) => {
    const row = document.createElement('div');
    row.className = `overall-rank-row${index === 0 ? ' champion' : ''}`;

    const rank = document.createElement('span');
    rank.className = 'overall-rank-number';
    rank.textContent = index === 0 ? '♛' : String(index + 1).padStart(2, '0');

    const playerCopy = document.createElement('div');
    playerCopy.className = 'overall-rank-player';
    const nameLine = document.createElement('div');
    nameLine.className = 'overall-rank-name';
    const name = document.createElement('span');
    name.textContent = player.nickname;
    nameLine.append(name);
    if (index === 0) {
      const badge = document.createElement('span');
      badge.className = 'rhythm-king-badge';
      badge.textContent = '리듬왕';
      nameLine.append(badge);
    }
    const meta = document.createElement('span');
    meta.className = 'overall-rank-meta';
    meta.textContent = `${player.songs.length}곡 기록 · 곡별 1위 ${player.firstPlaceCount}회`;
    playerCopy.append(nameLine, meta);

    const points = document.createElement('span');
    points.className = 'overall-rank-points';
    points.textContent = player.totalPoints.toLocaleString('ko-KR');
    const unit = document.createElement('small');
    unit.textContent = 'POINTS';
    points.append(unit);

    row.append(rank, playerCopy, points);
    elements.overallLeaderboardList.append(row);
  });
}

async function loadOverallLeaderboard() {
  if (!firebaseDb || !firebaseUser) return;
  elements.overallLeaderboardList.innerHTML = '<div class="overall-empty"><div class="loader"></div><span>종합 순위를 불러오는 중...</span></div>';
  try {
    const songLeaderboards = await Promise.all(SONGS.map((song) => fetchLeaderboard(song)));
    renderOverallLeaderboard(calculateOverallStandings(songLeaderboards));
  } catch (error) {
    console.warn('Overall leaderboard unavailable:', error);
    renderOverallLeaderboard([], '종합 순위를 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.');
  }
}

async function openLeaderboard(song = selectedSong) {
  elements.leaderboardTitle.textContent = `${song.title} · 리더보드`;
  elements.leaderboardList.innerHTML = '<div class="empty-state"><div class="loader"></div></div>';
  if (!elements.leaderboardDialog.open) elements.leaderboardDialog.showModal();
  try {
    const records = await fetchLeaderboard(song);
    renderLeaderboardRecords(records.slice(0, 20));
  } catch (error) {
    elements.leaderboardList.innerHTML = `<div class="empty-state">${error.message}<br />잠시 후 다시 시도해 주세요.</div>`;
  }
}

function renderLeaderboardRecords(records) {
  elements.leaderboardList.replaceChildren();
  if (!records.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '아직 등록된 기록이 없습니다.<br />이 곡의 첫 번째 리듬왕이 되어보세요!';
    elements.leaderboardList.append(empty);
    return;
  }
  records.forEach((record, index) => {
    const row = document.createElement('div');
    row.className = 'leader-row';
    const rank = document.createElement('span');
    rank.className = 'leader-rank';
    rank.textContent = index + 1;
    const name = document.createElement('span');
    name.className = 'leader-name';
    name.textContent = record.nickname;
    const score = document.createElement('span');
    score.className = 'leader-score';
    const scoreStrong = document.createElement('strong');
    scoreStrong.textContent = Number(record.score).toLocaleString('ko-KR');
    const scoreSmall = document.createElement('small');
    scoreSmall.textContent = `${Number(record.accuracy || 0).toFixed(1)}% · ${Number(record.maxCombo || 0)} COMBO`;
    score.append(scoreStrong, scoreSmall);
    row.append(rank, name, score);
    elements.leaderboardList.append(row);
  });
}

async function submitScore() {
  const nickname = elements.nicknameInput.value.trim();
  if (!nickname) { showToast('닉네임을 입력해 주세요.', 'error'); return; }
  if (!firebaseDb || !firebaseUser) { showToast('리더보드 연결을 기다려 주세요.', 'error'); return; }
  elements.submitScoreButton.disabled = true;
  elements.submitScoreButton.textContent = '등록 중…';
  try {
    const records = await fetchLeaderboard(selectedSong);
    const duplicate = records.find((record) => record.nickname.toLocaleLowerCase('ko-KR') === nickname.toLocaleLowerCase('ko-KR'));
    const payload = {
      nickname,
      score: game.score,
      accuracy: Number(getAccuracy().toFixed(2)),
      maxCombo: game.maxCombo,
      songId: selectedSong.id,
      timestamp: Date.now(),
    };
    if (duplicate) {
      if (game.score <= duplicate.score) {
        showToast(`기존 최고 점수 ${duplicate.score.toLocaleString('ko-KR')}점을 넘지 못했습니다.`);
        return;
      }
      await updateDoc(doc(firebaseDb, ...selectedSong.leaderboardPath, duplicate.id), payload);
      showToast('이 곡의 최고 기록을 갱신했습니다!', 'success');
    } else {
      await addDoc(collection(firebaseDb, ...selectedSong.leaderboardPath), payload);
      showToast('이 곡의 리더보드에 등록했습니다!', 'success');
    }
    try { localStorage.setItem('rhythm_nickname', nickname); } catch { /* No-op. */ }
    await openLeaderboard(selectedSong);
    loadOverallLeaderboard();
  } catch (error) {
    console.error('Score submission failed:', error);
    showToast('기록 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error');
  } finally {
    elements.submitScoreButton.disabled = false;
    elements.submitScoreButton.textContent = '기록 등록';
  }
}

function bindEvents() {
  elements.playButton.addEventListener('click', prepareGame);
  elements.leaderboardButton.addEventListener('click', () => openLeaderboard(selectedSong));
  elements.resultLeaderboardButton.addEventListener('click', () => openLeaderboard(selectedSong));
  elements.creditsButton.addEventListener('click', () => elements.creditsDialog.showModal());
  elements.retryButton.addEventListener('click', prepareGame);
  elements.selectButton.addEventListener('click', () => { ++sessionToken; stopAudio(); showView('select'); });
  elements.submitScoreButton.addEventListener('click', submitScore);
  elements.detailSpeedRange.addEventListener('input', (event) => setNoteSpeed(event.target.value));
  elements.gameSpeedRange.addEventListener('input', (event) => setNoteSpeed(event.target.value));
  elements.detailSpeedDown.addEventListener('click', () => adjustNoteSpeed(-0.1));
  elements.detailSpeedUp.addEventListener('click', () => adjustNoteSpeed(0.1));
  elements.gameSpeedDown.addEventListener('click', () => adjustNoteSpeed(-0.1));
  elements.gameSpeedUp.addEventListener('click', () => adjustNoteSpeed(0.1));
  elements.nicknameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') submitScore(); });
  elements.quitButton.addEventListener('click', () => {
    if (game.phase === 'playing' && !window.confirm('현재 플레이를 종료하고 곡 선택으로 돌아갈까요?')) return;
    ++sessionToken;
    game.phase = 'idle';
    cancelAnimationFrame(animationId);
    stopAudio();
    showView('select');
  });

  window.addEventListener('keydown', (event) => {
    const lane = LANE_KEYS.indexOf(event.key.toLowerCase());
    if (lane === -1 || event.repeat || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    event.preventDefault();
    setLanePressed(lane, true);
    judgeLane(lane);
  });
  window.addEventListener('keyup', (event) => {
    const lane = LANE_KEYS.indexOf(event.key.toLowerCase());
    if (lane === -1) return;
    setLanePressed(lane, false);
  });
  window.addEventListener('blur', () => lanePressed.forEach((_, lane) => setLanePressed(lane, false)));
  window.addEventListener('beforeunload', stopAudio);

  $$('.touch-controls [data-lane]').forEach((button) => {
    const lane = Number(button.dataset.lane);
    const press = (event) => { event.preventDefault(); setLanePressed(lane, true); judgeLane(lane); };
    const release = (event) => { event.preventDefault(); setLanePressed(lane, false); };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });
}

renderSongGrid();
renderCredits();
selectSong(SONGS[0].id);
bindEvents();
setNoteSpeed(noteSpeed, false);
drawGame(0);
initFirebase();
