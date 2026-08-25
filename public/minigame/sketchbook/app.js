import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  getAuth,
  signInAnonymously,
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { SEED_PROMPTS } from './prompts.js';

const firebaseConfig = window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__;
const legacyFirebaseConfig =
  window.__PLAYGROUND_FIREBASE_SKETCHBOOK_LEGACY_CONFIG__ || firebaseConfig;
if (!firebaseConfig) {
  throw new Error('Firebase configuration is unavailable.');
}

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const usesSeparateLegacyProject =
  legacyFirebaseConfig.projectId !== firebaseConfig.projectId;
const legacyFirebaseApp = usesSeparateLegacyProject
  ? initializeApp(legacyFirebaseConfig, 'sketchbook-legacy')
  : firebaseApp;
const legacyAuth = getAuth(legacyFirebaseApp);
const legacyDb = getFirestore(legacyFirebaseApp);
const LEGACY_PROJECT_ID = legacyFirebaseConfig.projectId;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sketchbook';
const BASE_PATH = ['artifacts', appId, 'public', 'data'];
const SCHEMA_VERSION = 4;
const RESERVATION_MS = 20 * 60 * 1000;
const DRAW_SECONDS = 90;
const AI_REFILL_INTERVAL_MS = 24 * 60 * 60 * 1000;
const AI_REFILL_RETRY_MS = 30 * 60 * 1000;
const AI_REFILL_LOCK_MS = 2 * 60 * 1000;
const AI_REFILL_THRESHOLD = 40;
const CATALOG_MIGRATION_LOCK_MS = 5 * 60 * 1000;
const LEGACY_RECHECK_MS = 24 * 60 * 60 * 1000;

const refs = {
  prompts: collection(db, ...BASE_PATH, 'sketch_prompts'),
  drawings: collection(db, ...BASE_PATH, 'sketch_drawings'),
  primaryLegacyDrawings: collection(db, ...BASE_PATH, 'drawings'),
  legacyDrawings: collection(legacyDb, ...BASE_PATH, 'drawings'),
  legacyWords: collection(legacyDb, ...BASE_PATH, 'user_words'),
  catalogMarker: doc(
    db,
    ...BASE_PATH,
    'config',
    `sketchbook_catalog_v${SCHEMA_VERSION}`
  ),
  aiRefill: doc(db, ...BASE_PATH, 'config', 'sketchbook_ai_refill'),
};

const screens = [
  'screen-welcome',
  'screen-dashboard',
  'screen-prompts',
  'screen-draw',
  'screen-guess',
  'screen-gallery',
  'screen-suggest',
];

const elements = {
  bootStatus: document.getElementById('boot-status'),
  enterButton: document.getElementById('enter-button'),
  nicknameForm: document.getElementById('nickname-form'),
  nicknameInput: document.getElementById('nickname-input'),
  headerNickname: document.getElementById('header-nickname'),
  statCompleted: document.getElementById('stat-completed'),
  statAvailable: document.getElementById('stat-available'),
  statMine: document.getElementById('stat-mine'),
  statProgress: document.getElementById('stat-progress'),
  progressBar: document.getElementById('progress-bar'),
  promptLoading: document.getElementById('prompt-loading'),
  promptGrid: document.getElementById('prompt-grid'),
  promptEmpty: document.getElementById('prompt-empty'),
  canvasWrap: document.querySelector('.canvas-wrap'),
  canvas: document.getElementById('drawing-canvas'),
  drawCategory: document.getElementById('draw-category'),
  drawWord: document.getElementById('draw-word'),
  drawTimer: document.getElementById('draw-timer'),
  palette: document.getElementById('color-palette'),
  brushSize: document.getElementById('brush-size'),
  submitDrawing: document.getElementById('submit-drawing-button'),
  guessLayout: document.getElementById('guess-layout'),
  guessEmpty: document.getElementById('guess-empty'),
  guessImage: document.getElementById('guess-image'),
  guessHint: document.getElementById('guess-hint'),
  guessScore: document.getElementById('guess-score'),
  guessInput: document.getElementById('guess-input'),
  guessSubmit: document.getElementById('guess-submit-button'),
  guessPass: document.getElementById('guess-pass-button'),
  galleryLoading: document.getElementById('gallery-loading'),
  galleryGrid: document.getElementById('gallery-grid'),
  galleryEmpty: document.getElementById('gallery-empty'),
  galleryMore: document.getElementById('gallery-more-button'),
  categorySummary: document.getElementById('category-summary'),
  suggestForm: document.getElementById('suggest-form'),
  suggestInput: document.getElementById('suggest-input'),
  toast: document.getElementById('toast'),
};

const state = {
  ready: false,
  user: null,
  nickname: '',
  prompts: [],
  currentPrompt: null,
  reservationToken: null,
  currentGuess: null,
  guessBusy: false,
  guessRequestVersion: 0,
  guessTransitionTimer: null,
  seenGuessIds: new Set(),
  sessionCorrect: 0,
  galleryCursor: null,
  galleryLoading: false,
  drawingSeconds: DRAW_SECONDS,
  drawingDeadline: 0,
  drawingTimer: null,
  submittingDrawing: false,
  toastTimer: null,
  strokes: [],
  activeStroke: null,
  brushColor: '#1f2937',
  brushSize: 7,
};

const seedCategoryByWord = new Map(
  SEED_PROMPTS.map(({ word, category }) => [normalizeWord(word), category])
);

function normalizeWord(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toLocaleLowerCase('ko-KR');
}

function isKoreanPromptWord(value) {
  return /^[가-힣]{1,8}$/.test(String(value || '').trim());
}

function buildSeedFingerprint() {
  const source = SEED_PROMPTS
    .map(({ word, category }) => `${normalizeWord(word)}:${category}`)
    .sort()
    .join('|');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${SEED_PROMPTS.length}-${(hash >>> 0).toString(16)}`;
}

const SEED_FINGERPRINT = buildSeedFingerprint();

function promptIdForWord(word) {
  const bytes = new TextEncoder().encode(normalizeWord(word));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function inferCategory(word, fallback = '친구 추천') {
  return seedCategoryByWord.get(normalizeWord(word)) || fallback;
}

function showScreen(screenId, scrollBehavior = 'smooth') {
  screens.forEach((id) => {
    document.getElementById(id)?.classList.toggle('hidden', id !== screenId);
  });
  window.scrollTo({ top: 0, behavior: scrollBehavior });
}

function showToast(message, type = 'info') {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type}`;
  state.toastTimer = setTimeout(() => {
    elements.toast.className = 'toast';
  }, 3400);
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function isReservationAvailable(prompt, now = Date.now()) {
  return (
    prompt.status === 'available' ||
    (prompt.status === 'reserved' && Number(prompt.reservedUntil || 0) <= now)
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function numericTimestamp(value, fallback = 0) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : fallback;
}

async function runInChunks(items, chunkSize, worker) {
  for (let index = 0; index < items.length; index += chunkSize) {
    await Promise.all(items.slice(index, index + chunkSize).map(worker));
  }
}

async function createPromptIfMissing(id, data) {
  const promptRef = doc(refs.prompts, id);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(promptRef);
    if (snapshot.exists()) return false;
    transaction.set(promptRef, data);
    return true;
  });
}

async function migrateLegacyRepresentative(legacyDrawing) {
  const id = promptIdForWord(legacyDrawing.word);
  const promptRef = doc(refs.prompts, id);
  const drawingRef = doc(refs.drawings, id);

  await runTransaction(db, async (transaction) => {
    const promptSnapshot = await transaction.get(promptRef);
    const drawingSnapshot = await transaction.get(drawingRef);
    const existingPrompt = promptSnapshot.exists()
      ? promptSnapshot.data()
      : null;
    const existingDrawing = drawingSnapshot.exists()
      ? drawingSnapshot.data()
      : null;

    if (!drawingSnapshot.exists()) {
      transaction.set(drawingRef, {
        promptId: id,
        word: legacyDrawing.word,
        category: inferCategory(legacyDrawing.word, '기존 그림'),
        creator: legacyDrawing.creator || '이전 참여자',
        creatorId: legacyDrawing.creatorId || '',
        legacyDrawingId: legacyDrawing.id,
        legacyProjectId: LEGACY_PROJECT_ID,
        timestamp: legacyDrawing.timestamp || Date.now(),
        correctCount: Number(legacyDrawing.correctCount || 0),
        schemaVersion: SCHEMA_VERSION,
      });
    }

    if (!existingPrompt?.drawingId) {
      const representative = existingDrawing || legacyDrawing;
      transaction.set(
        promptRef,
        {
          word: representative.word || legacyDrawing.word,
          wordKey: normalizeWord(representative.word || legacyDrawing.word),
          category:
            existingPrompt?.category ||
            representative.category ||
            inferCategory(legacyDrawing.word, '기존 그림'),
          status: 'completed',
          source: existingPrompt?.source || 'legacy-drawing',
          drawingId: id,
          completedBy: representative.creatorId || '',
          completedAt:
            numericTimestamp(representative.timestamp, Date.now()),
          createdAt:
            existingPrompt?.createdAt ||
            numericTimestamp(representative.timestamp, Date.now()),
          reservedBy: '',
          reservationToken: '',
          reservedUntil: 0,
          schemaVersion: SCHEMA_VERSION,
        },
        { merge: true }
      );
    }
  });
}

function markerIsCurrent(marker, now = Date.now()) {
  return (
    Number(marker.version || 0) >= SCHEMA_VERSION &&
    marker.seedFingerprint === SEED_FINGERPRINT &&
    marker.legacyProjectId === LEGACY_PROJECT_ID &&
    now - Number(marker.legacyCheckedAt || 0) < LEGACY_RECHECK_MS
  );
}

async function waitForCatalogMigration() {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    await delay(2000);
    const snapshot = await getDoc(refs.catalogMarker);
    const data = snapshot.exists() ? snapshot.data() : {};
    if (markerIsCurrent(data)) return true;
    if (Number(data.lockUntil || 0) <= Date.now()) return false;
  }
  throw new Error('CATALOG_MIGRATION_TIMEOUT');
}

async function ensureCatalogAndMigrateLegacy() {
  const migrationOwner =
    `${state.user.uid}:${window.crypto?.randomUUID?.() || Date.now()}`;
  const migrationState = await runTransaction(db, async (transaction) => {
    const markerSnapshot = await transaction.get(refs.catalogMarker);
    const marker = markerSnapshot.exists() ? markerSnapshot.data() : {};
    if (markerIsCurrent(marker)) {
      return { status: 'complete', marker };
    }
    if (
      marker.migrationStatus === 'running' &&
      Number(marker.lockUntil || 0) > Date.now()
    ) {
      return { status: 'waiting', marker };
    }
    transaction.set(
      refs.catalogMarker,
      {
        migrationStatus: 'running',
        lockOwner: migrationOwner,
        lockUntil: Date.now() + CATALOG_MIGRATION_LOCK_MS,
        startedAt: Date.now(),
      },
      { merge: true }
    );
    return { status: 'acquired', marker };
  });

  if (migrationState.status === 'complete') return;
  if (migrationState.status === 'waiting') {
    const completed = await waitForCatalogMigration();
    if (completed) return;
    return ensureCatalogAndMigrateLegacy();
  }

  try {
    const [drawingCountSnapshot, wordCountSnapshot] = await Promise.all([
      getCountFromServer(refs.legacyDrawings),
      getCountFromServer(refs.legacyWords),
    ]);
    const legacyDrawingCount = drawingCountSnapshot.data().count;
    const legacyWordCount = wordCountSnapshot.data().count;
    const previousMarker = migrationState.marker || {};
    const catalogShapeIsCurrent =
      Number(previousMarker.version || 0) >= SCHEMA_VERSION &&
      previousMarker.seedFingerprint === SEED_FINGERPRINT &&
      previousMarker.legacyProjectId === LEGACY_PROJECT_ID;

    if (
      catalogShapeIsCurrent &&
      Number(previousMarker.legacyDrawingCount ?? -1) === legacyDrawingCount &&
      Number(previousMarker.legacyWordCount ?? -1) === legacyWordCount
    ) {
      await setDoc(
        refs.catalogMarker,
        {
          legacyCheckedAt: Date.now(),
          migrationStatus: 'complete',
          lockOwner: '',
          lockUntil: 0,
        },
        { merge: true }
      );
      return;
    }

    elements.bootStatus.textContent =
      '기존 Firebase 그림을 지우지 않고 도감에 안전하게 연결하고 있습니다…';

    const [legacyWordSnapshot, legacyDrawingSnapshot] = await Promise.all([
      getDocs(refs.legacyWords),
      getDocs(refs.legacyDrawings),
    ]);
    const promptCandidates = new Map();

    SEED_PROMPTS.forEach(({ word, category }) => {
      promptCandidates.set(promptIdForWord(word), {
        word,
        wordKey: normalizeWord(word),
        category,
        status: 'available',
        source: 'curated',
        createdAt: Date.now(),
        schemaVersion: SCHEMA_VERSION,
      });
    });

    legacyWordSnapshot.docs.forEach((wordDocument) => {
      const data = wordDocument.data();
      const word = String(data.word || '').trim();
      if (!isKoreanPromptWord(word)) return;
      const id = promptIdForWord(word);
      if (!promptCandidates.has(id)) {
        promptCandidates.set(id, {
          word,
          wordKey: normalizeWord(word),
          category: data.theme || inferCategory(word),
          status: 'available',
          source: data.isSystem ? 'legacy-system' : 'legacy-suggestion',
          createdAt: numericTimestamp(data.timestamp, Date.now()),
          schemaVersion: SCHEMA_VERSION,
        });
      }
    });

    await runInChunks(
      [...promptCandidates.entries()],
      20,
      ([id, data]) => createPromptIfMissing(id, data)
    );

    const legacyGroups = new Map();
    legacyDrawingSnapshot.docs.forEach((drawingDocument) => {
      const data = drawingDocument.data();
      const word = String(data.word || '').trim();
      if (!isKoreanPromptWord(word)) return;
      const key = normalizeWord(word);
      const candidate = {
        id: drawingDocument.id,
        word,
        creator: data.creator || '',
        creatorId: data.creatorId || '',
        correctCount: Number(data.correctCount || 0),
        timestamp: numericTimestamp(data.timestamp || data.createdAt),
      };
      const current = legacyGroups.get(key);
      if (
        !current ||
        candidate.timestamp < current.timestamp ||
        (candidate.timestamp === current.timestamp &&
          candidate.id < current.id)
      ) {
        legacyGroups.set(key, candidate);
      }
    });

    // 레거시 Base64 이미지는 복사하지 않고 기존 문서를 가리키는 메타데이터만 만듭니다.
    await runInChunks(
      [...legacyGroups.values()],
      12,
      migrateLegacyRepresentative
    );

    await setDoc(
      refs.catalogMarker,
      {
        version: SCHEMA_VERSION,
        seedFingerprint: SEED_FINGERPRINT,
        seededPromptCount: SEED_PROMPTS.length,
        migratedRepresentativeCount: legacyGroups.size,
        legacyDrawingCount: legacyDrawingSnapshot.size,
        legacyWordCount: legacyWordSnapshot.size,
        legacyProjectId: LEGACY_PROJECT_ID,
        legacyCheckedAt: Date.now(),
        completedAt: Date.now(),
        migrationStatus: 'complete',
        lockOwner: '',
        lockUntil: 0,
        failedAt: 0,
      },
      { merge: true }
    );
  } catch (error) {
    await runTransaction(db, async (transaction) => {
      const markerSnapshot = await transaction.get(refs.catalogMarker);
      if (
        markerSnapshot.exists() &&
        markerSnapshot.data().lockOwner === migrationOwner
      ) {
        transaction.set(
          refs.catalogMarker,
          {
            migrationStatus: 'failed',
            lockOwner: '',
            lockUntil: 0,
            failedAt: Date.now(),
          },
          { merge: true }
        );
      }
    }).catch(() => {});
    throw error;
  }
}

async function refreshCatalog() {
  const snapshot = await getDocs(refs.prompts);
  state.prompts = snapshot.docs
    .map((promptDocument) => ({
      id: promptDocument.id,
      ...promptDocument.data(),
    }))
    .filter((prompt) => isKoreanPromptWord(prompt.word));
  renderStats();
}

function renderStats() {
  const now = Date.now();
  const completed = state.prompts.filter(
    (prompt) => prompt.status === 'completed' && prompt.drawingId
  );
  const available = state.prompts.filter((prompt) =>
    isReservationAvailable(prompt, now)
  );
  const mine = completed.filter(
    (prompt) => prompt.completedBy && prompt.completedBy === state.user?.uid
  );
  const total = state.prompts.length;
  const progress = total ? Math.round((completed.length / total) * 100) : 0;

  elements.statCompleted.textContent = completed.length.toLocaleString('ko-KR');
  elements.statAvailable.textContent = available.length.toLocaleString('ko-KR');
  elements.statMine.textContent = mine.length.toLocaleString('ko-KR');
  elements.statProgress.textContent = `${progress}%`;
  elements.progressBar.style.width = `${progress}%`;
}

async function maybeRefillPromptPool() {
  const availableCount = state.prompts.filter((prompt) =>
    isReservationAvailable(prompt)
  ).length;
  if (availableCount >= AI_REFILL_THRESHOLD) return;

  const acquired = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(refs.aiRefill);
    const refill = snapshot.exists() ? snapshot.data() : {};
    const now = Date.now();
    if (
      now - Number(refill.lastSuccessAt || 0) < AI_REFILL_INTERVAL_MS ||
      now - Number(refill.lastAttemptAt || 0) < AI_REFILL_RETRY_MS ||
      Number(refill.lockUntil || 0) > now
    ) {
      return false;
    }
    transaction.set(
      refs.aiRefill,
      {
        lastAttemptAt: now,
        lockUntil: now + AI_REFILL_LOCK_MS,
      },
      { merge: true }
    );
    return true;
  });
  if (!acquired) return;

  try {
    let excludeWords = '';
    for (const prompt of shuffle(state.prompts)) {
      if (!/^[가-힣]{1,8}$/.test(prompt.word)) continue;
      const candidate = `${excludeWords ? ',' : ''}${prompt.word}`;
      if (excludeWords.length + candidate.length > 1800) break;
      excludeWords += candidate;
    }

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'sketchbook-word-batch',
        input: { excludeWords },
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !Array.isArray(payload.data?.items)) {
      throw new Error('AI_REFILL_RESPONSE_INVALID');
    }

    const knownIds = new Set(state.prompts.map((prompt) => prompt.id));
    const candidates = [];
    payload.data.items.forEach((item) => {
      const word = String(item.word || '').trim();
      if (!/^[가-힣]{2,7}$/.test(word)) return;
      const id = promptIdForWord(word);
      if (knownIds.has(id)) return;
      knownIds.add(id);
      candidates.push({
        id,
        data: {
          word,
          wordKey: normalizeWord(word),
          category: String(item.category || 'AI 추천').slice(0, 12),
          status: 'available',
          source: 'ai',
          createdAt: Date.now(),
          schemaVersion: SCHEMA_VERSION,
        },
      });
    });

    const results = await Promise.all(
      candidates.map(({ id, data }) => createPromptIfMissing(id, data))
    );
    const addedCount = results.filter(Boolean).length;
    if (addedCount) await refreshCatalog();

    if (addedCount < 4) {
      await setDoc(
        refs.aiRefill,
        {
          lockUntil: 0,
          lastPartialAt: Date.now(),
          addedCount,
        },
        { merge: true }
      );
      return;
    }

    await setDoc(
      refs.aiRefill,
      {
        lastSuccessAt: Date.now(),
        lockUntil: 0,
        addedCount,
      },
      { merge: true }
    );
  } catch (error) {
    await setDoc(
      refs.aiRefill,
      {
        lockUntil: 0,
        lastFailureAt: Date.now(),
      },
      { merge: true }
    ).catch(() => {});
    console.warn('AI 주제어 보충을 건너뜁니다.', error);
  }
}

function pickDiversePrompts(count = 3) {
  const available = shuffle(
    state.prompts.filter((prompt) => isReservationAvailable(prompt))
  );
  const selected = [];
  const categories = new Set();

  for (const prompt of available) {
    if (categories.has(prompt.category)) continue;
    selected.push(prompt);
    categories.add(prompt.category);
    if (selected.length === count) return selected;
  }
  for (const prompt of available) {
    if (selected.some((selectedPrompt) => selectedPrompt.id === prompt.id)) {
      continue;
    }
    selected.push(prompt);
    if (selected.length === count) break;
  }
  return selected;
}

async function openPromptSelection() {
  showScreen('screen-prompts');
  elements.promptLoading.classList.remove('hidden');
  elements.promptGrid.classList.add('hidden');
  elements.promptEmpty.classList.add('hidden');
  elements.promptEmpty.textContent =
    '현재 비어 있는 주제어가 없습니다. 새 주제어를 하나 보태주세요.';
  let choices;
  try {
    await refreshCatalog();
    choices = pickDiversePrompts();
  } catch {
    elements.promptLoading.classList.add('hidden');
    elements.promptEmpty.textContent =
      '주제어를 불러오지 못했습니다. 잠시 후 다시 열어주세요.';
    elements.promptEmpty.classList.remove('hidden');
    showToast('주제어를 불러오지 못했습니다.', 'error');
    return;
  }
  elements.promptLoading.classList.add('hidden');

  if (!choices.length) {
    elements.promptEmpty.classList.remove('hidden');
    return;
  }

  elements.promptGrid.replaceChildren();
  choices.forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prompt-card';
    const category = document.createElement('small');
    category.textContent = prompt.category || '주제어';
    const word = document.createElement('strong');
    word.textContent = prompt.word;
    button.append(category, word);
    button.addEventListener('click', () => claimPrompt(prompt));
    elements.promptGrid.append(button);
  });
  elements.promptGrid.classList.remove('hidden');
}

async function claimPrompt(prompt) {
  try {
    const promptRef = doc(refs.prompts, prompt.id);
    const reservationToken =
      window.crypto?.randomUUID?.() ||
      `${state.user.uid}:${Date.now()}:${Math.random()}`;
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(promptRef);
      if (!snapshot.exists()) throw new Error('PROMPT_MISSING');
      const current = snapshot.data();
      const reservedByAnother =
        current.status === 'reserved' &&
        Number(current.reservedUntil || 0) > Date.now() &&
        current.reservedBy !== state.user.uid;
      if (
        current.status === 'completed' ||
        current.drawingId ||
        reservedByAnother
      ) {
        throw new Error('PROMPT_UNAVAILABLE');
      }
      transaction.set(
        promptRef,
        {
          status: 'reserved',
          reservedBy: state.user.uid,
          reservationToken,
          reservedUntil: Date.now() + RESERVATION_MS,
          reservedAt: Date.now(),
        },
        { merge: true }
      );
    });

    state.currentPrompt = prompt;
    state.reservationToken = reservationToken;
    startDrawing();
  } catch (error) {
    const unavailable = ['PROMPT_MISSING', 'PROMPT_UNAVAILABLE'].includes(
      error.message
    );
    showToast(
      unavailable
        ? '방금 다른 친구가 선택한 주제어입니다. 다시 골라주세요.'
        : '주제어를 예약하지 못했습니다. 잠시 후 다시 시도해주세요.',
      unavailable ? 'warning' : 'error'
    );
    await openPromptSelection();
  }
}

async function releaseCurrentPrompt() {
  const prompt = state.currentPrompt;
  if (!prompt || !state.user) return;
  clearInterval(state.drawingTimer);
  try {
    const promptRef = doc(refs.prompts, prompt.id);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(promptRef);
      if (!snapshot.exists()) return;
      const current = snapshot.data();
      if (
        current.status === 'reserved' &&
        current.reservedBy === state.user.uid &&
        current.reservationToken === state.reservationToken &&
        !current.drawingId
      ) {
        transaction.set(
          promptRef,
          {
            status: 'available',
            reservedBy: '',
            reservationToken: '',
            reservedUntil: 0,
            reservedAt: 0,
          },
          { merge: true }
        );
      }
    });
  } catch (error) {
    console.warn('주제어 예약 해제를 건너뜁니다.', error);
  }
  state.currentPrompt = null;
  state.reservationToken = null;
}

const paletteColors = [
  '#1f2937',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ffffff',
];

function buildPalette() {
  elements.palette.replaceChildren();
  paletteColors.forEach((color) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `color-button${color === state.brushColor ? ' active' : ''}`;
    button.style.backgroundColor = color;
    button.setAttribute('aria-label', `붓 색상 ${color}`);
    button.addEventListener('click', () => {
      state.brushColor = color;
      elements.palette
        .querySelectorAll('.color-button')
        .forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
    });
    elements.palette.append(button);
  });
}

function resetCanvas() {
  const context = elements.canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';
}

function redrawCanvas() {
  resetCanvas();
  const context = elements.canvas.getContext('2d');
  state.strokes.forEach((stroke) => {
    if (!stroke.points.length) return;
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y);
    });
    context.stroke();
  });
}

function canvasPoint(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * elements.canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * elements.canvas.height,
  };
}

function handlePointerDown(event) {
  if (!state.currentPrompt || state.submittingDrawing) return;
  event.preventDefault();
  elements.canvas.setPointerCapture(event.pointerId);
  const point = canvasPoint(event);
  state.activeStroke = {
    color: state.brushColor,
    size: state.brushSize,
    points: [point],
  };
  state.strokes.push(state.activeStroke);
}

function handlePointerMove(event) {
  if (!state.activeStroke) return;
  event.preventDefault();
  const nextPoint = canvasPoint(event);
  const points = state.activeStroke.points;
  const previousPoint = points[points.length - 1];
  points.push(nextPoint);
  const context = elements.canvas.getContext('2d');
  context.strokeStyle = state.activeStroke.color;
  context.lineWidth = state.activeStroke.size;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(previousPoint.x, previousPoint.y);
  context.lineTo(nextPoint.x, nextPoint.y);
  context.stroke();
}

function handlePointerUp(event) {
  if (state.activeStroke) {
    event?.preventDefault();
  }
  state.activeStroke = null;
}

function preventCanvasTouchScroll(event) {
  if (!state.currentPrompt || state.submittingDrawing) return;
  event.preventDefault();
}

function hasDrawableContent() {
  let distance = 0;
  state.strokes.forEach((stroke) => {
    for (let index = 1; index < stroke.points.length; index += 1) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      distance += Math.hypot(
        current.x - previous.x,
        current.y - previous.y
      );
    }
  });
  return distance >= 24;
}

function startDrawingTimer() {
  clearInterval(state.drawingTimer);
  state.drawingDeadline = Date.now() + DRAW_SECONDS * 1000;
  state.drawingSeconds = DRAW_SECONDS;
  elements.drawTimer.textContent = `${state.drawingSeconds}초`;
  state.drawingTimer = setInterval(async () => {
    state.drawingSeconds = Math.max(
      0,
      Math.ceil((state.drawingDeadline - Date.now()) / 1000)
    );
    elements.drawTimer.textContent = `${state.drawingSeconds}초`;
    if (state.drawingSeconds <= 10) {
      elements.drawTimer.style.background = '#ffe4e6';
    }
    if (state.drawingSeconds <= 0) {
      clearInterval(state.drawingTimer);
      if (hasDrawableContent()) {
        showToast('시간이 끝나 그림을 도감에 저장합니다.', 'warning');
        await submitDrawing();
      } else {
        showToast('그림이 없어 주제어 예약을 취소했습니다.', 'warning');
        await releaseCurrentPrompt();
        showScreen('screen-dashboard');
      }
    }
  }, 250);
}

function startDrawing() {
  state.strokes = [];
  state.activeStroke = null;
  state.submittingDrawing = false;
  elements.submitDrawing.disabled = false;
  elements.drawTimer.style.background = '';
  elements.drawCategory.textContent = state.currentPrompt.category || '주제어';
  elements.drawWord.textContent = state.currentPrompt.word;
  state.brushSize = Number(elements.brushSize.value);
  buildPalette();
  resetCanvas();
  // 모바일에서 부드러운 자동 스크롤이 진행되는 동안 그림을 시작하면
  // 캔버스와 페이지가 함께 움직일 수 있으므로 그리기 화면은 즉시 이동한다.
  showScreen('screen-draw', 'auto');
  startDrawingTimer();
}

function compressedDrawingData() {
  const attempts = [
    { width: 640, quality: 0.74 },
    { width: 560, quality: 0.66 },
    { width: 480, quality: 0.6 },
    { width: 420, quality: 0.54 },
  ];
  let result = '';

  for (const { width, quality } of attempts) {
    const output = document.createElement('canvas');
    output.width = width;
    output.height = Math.round(
      (elements.canvas.height / elements.canvas.width) * width
    );
    const context = output.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(elements.canvas, 0, 0, output.width, output.height);
    const webp = output.toDataURL('image/webp', quality);
    result = webp.startsWith('data:image/webp')
      ? webp
      : output.toDataURL('image/jpeg', quality);
    // Firestore 문서의 1 MiB 한도보다 충분히 작게 여유를 둡니다.
    if (result.length <= 700_000) break;
  }
  return result;
}

async function submitDrawing() {
  if (
    state.submittingDrawing ||
    !state.currentPrompt ||
    !hasDrawableContent()
  ) {
    if (!hasDrawableContent()) {
      showToast('조금만 더 그린 뒤 저장해주세요.', 'warning');
    }
    return;
  }

  state.submittingDrawing = true;
  elements.submitDrawing.disabled = true;
  clearInterval(state.drawingTimer);
  const prompt = state.currentPrompt;
  const imageData = compressedDrawingData();

  try {
    const promptRef = doc(refs.prompts, prompt.id);
    const drawingRef = doc(refs.drawings, prompt.id);
    await runTransaction(db, async (transaction) => {
      const promptSnapshot = await transaction.get(promptRef);
      const drawingSnapshot = await transaction.get(drawingRef);
      if (!promptSnapshot.exists()) throw new Error('PROMPT_MISSING');
      const current = promptSnapshot.data();
      if (
        drawingSnapshot.exists() ||
        current.status === 'completed' ||
        current.drawingId
      ) {
        throw new Error('DRAWING_EXISTS');
      }
      if (
        current.reservedBy !== state.user.uid ||
        current.reservationToken !== state.reservationToken ||
        Number(current.reservedUntil || 0) < Date.now()
      ) {
        throw new Error('RESERVATION_EXPIRED');
      }

      const now = Date.now();
      transaction.set(drawingRef, {
        promptId: prompt.id,
        word: prompt.word,
        category: prompt.category || '주제어',
        creator: state.nickname,
        creatorId: state.user.uid,
        imageData,
        timestamp: now,
        correctCount: 0,
        schemaVersion: SCHEMA_VERSION,
      });
      transaction.set(
        promptRef,
        {
          status: 'completed',
          drawingId: prompt.id,
          completedBy: state.user.uid,
          completedAt: now,
          reservedBy: '',
          reservationToken: '',
          reservedUntil: 0,
        },
        { merge: true }
      );
    });

    state.currentPrompt = null;
    state.reservationToken = null;
    showToast(`“${prompt.word}” 도감이 완성되었습니다!`, 'success');
    await refreshCatalog();
    showScreen('screen-dashboard');
  } catch (error) {
    const message =
      error.message === 'DRAWING_EXISTS'
        ? '이미 다른 친구가 이 주제어의 그림을 완성했습니다.'
        : error.message === 'RESERVATION_EXPIRED'
          ? '예약 시간이 지나 저장할 수 없습니다. 주제어를 다시 골라주세요.'
          : '그림 저장에 실패했습니다. 잠시 후 다시 시도해주세요.';
    showToast(message, 'error');
    if (['DRAWING_EXISTS', 'RESERVATION_EXPIRED'].includes(error.message)) {
      state.currentPrompt = null;
      state.reservationToken = null;
      await refreshCatalog();
      showScreen('screen-dashboard');
    } else {
      startDrawingTimer();
    }
  } finally {
    state.submittingDrawing = false;
    elements.submitDrawing.disabled = false;
  }
}

async function getDrawingRecord(prompt) {
  const drawingId = prompt.drawingId || prompt.id;
  const drawingSnapshot = await getDoc(doc(refs.drawings, drawingId));
  if (!drawingSnapshot.exists()) return null;
  return hydrateDrawingRecord({
    id: drawingSnapshot.id,
    ...drawingSnapshot.data(),
  });
}

async function hydrateDrawingRecord(drawing) {
  if (drawing.imageData || drawing.drawingData || drawing.imageUrl) {
    return drawing;
  }
  if (drawing.legacyDrawingId) {
    const legacyCollection =
      usesSeparateLegacyProject &&
      (!drawing.legacyProjectId ||
        drawing.legacyProjectId === firebaseConfig.projectId)
        ? refs.primaryLegacyDrawings
        : refs.legacyDrawings;
    const legacySnapshot = await getDoc(
      doc(legacyCollection, drawing.legacyDrawingId)
    );
    if (legacySnapshot.exists()) {
      return {
        ...drawing,
        legacy: legacySnapshot.data(),
      };
    }
  }
  return drawing;
}

function drawingImageSource(drawing) {
  return (
    drawing?.imageUrl ||
    drawing?.imageData ||
    drawing?.drawingData ||
    drawing?.legacy?.imageUrl ||
    drawing?.legacy?.drawingData ||
    ''
  );
}

async function loadNextGuess() {
  const requestVersion = ++state.guessRequestVersion;
  state.guessBusy = true;
  state.currentGuess = null;
  elements.guessInput.value = '';
  elements.guessSubmit.disabled = true;
  elements.guessPass.disabled = true;

  let completed = state.prompts.filter(
    (prompt) => prompt.status === 'completed' && prompt.drawingId
  );
  const notMine = completed.filter(
    (prompt) => prompt.completedBy !== state.user.uid
  );
  if (notMine.length) completed = notMine;

  let candidates = completed.filter(
    (prompt) => !state.seenGuessIds.has(prompt.id)
  );
  if (!candidates.length && completed.length) {
    state.seenGuessIds.clear();
    candidates = completed;
  }
  candidates = shuffle(candidates);

  let failedLoads = 0;
  for (const prompt of candidates) {
    let drawing;
    try {
      drawing = await getDrawingRecord(prompt);
    } catch {
      failedLoads += 1;
      continue;
    }
    if (requestVersion !== state.guessRequestVersion) return;
    const source = drawingImageSource(drawing);
    if (!source) continue;
    state.currentGuess = { prompt, drawing };
    state.seenGuessIds.add(prompt.id);
    elements.guessImage.src = source;
    elements.guessImage.alt = `${drawing.creator || '참여자'}가 그린 퀴즈 그림`;
    elements.guessHint.textContent = `${prompt.category || '주제어'} · ${Array.from(prompt.word).length}글자`;
    elements.guessScore.textContent = state.sessionCorrect;
    elements.guessLayout.classList.remove('hidden');
    elements.guessEmpty.classList.add('hidden');
    state.guessBusy = false;
    elements.guessSubmit.disabled = false;
    elements.guessPass.disabled = false;
    elements.guessInput.focus();
    return;
  }

  if (requestVersion !== state.guessRequestVersion) return;
  state.currentGuess = null;
  state.guessBusy = false;
  elements.guessLayout.classList.add('hidden');
  elements.guessEmpty.classList.remove('hidden');
  if (failedLoads) {
    showToast('일부 그림을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'warning');
  }
}

async function openGuessMode() {
  clearTimeout(state.guessTransitionTimer);
  showScreen('screen-guess');
  elements.guessLayout.classList.add('hidden');
  elements.guessEmpty.classList.add('hidden');
  try {
    await refreshCatalog();
    await loadNextGuess();
  } catch {
    state.guessBusy = false;
    elements.guessEmpty.classList.remove('hidden');
    showToast('그림 퀴즈를 불러오지 못했습니다. 다시 시도해주세요.', 'error');
  }
}

async function checkGuess() {
  if (!state.currentGuess || state.guessBusy) return;
  const answer = normalizeWord(elements.guessInput.value);
  const correctAnswer = normalizeWord(state.currentGuess.prompt.word);
  if (!answer) return;

  if (answer === correctAnswer) {
    state.guessBusy = true;
    elements.guessSubmit.disabled = true;
    elements.guessPass.disabled = true;
    const completedGuess = state.currentGuess;
    state.currentGuess = null;
    state.sessionCorrect += 1;
    elements.guessScore.textContent = state.sessionCorrect;
    showToast(`정답입니다! “${completedGuess.prompt.word}”`, 'success');
    updateDoc(doc(refs.drawings, completedGuess.drawing.id), {
      correctCount: increment(1),
    }).catch(() => {});
    state.guessTransitionTimer = setTimeout(() => loadNextGuess(), 700);
    return;
  }

  const firstLetter = Array.from(state.currentGuess.prompt.word)[0];
  elements.guessHint.textContent = `${state.currentGuess.prompt.category || '주제어'} · ${Array.from(state.currentGuess.prompt.word).length}글자 · 첫 글자 “${firstLetter}”`;
  elements.guessInput.select();
  showToast('조금 다릅니다. 첫 글자 힌트를 확인해보세요.', 'warning');
}

async function passGuess() {
  if (!state.currentGuess || state.guessBusy) return;
  state.guessBusy = true;
  elements.guessSubmit.disabled = true;
  elements.guessPass.disabled = true;
  const passedGuess = state.currentGuess;
  state.currentGuess = null;
  showToast(`정답은 “${passedGuess.prompt.word}”입니다.`, 'info');
  state.guessTransitionTimer = setTimeout(() => loadNextGuess(), 900);
}

function renderCategorySummary() {
  const categoryMap = new Map();
  state.prompts.forEach((prompt) => {
    const category = prompt.category || '기타';
    const current = categoryMap.get(category) || { total: 0, completed: 0 };
    current.total += 1;
    if (prompt.status === 'completed') current.completed += 1;
    categoryMap.set(category, current);
  });

  elements.categorySummary.replaceChildren();
  [...categoryMap.entries()]
    .sort((a, b) => b[1].completed - a[1].completed)
    .forEach(([category, counts]) => {
      const chip = document.createElement('span');
      chip.className = 'category-chip';
      chip.textContent = `${category} ${counts.completed}/${counts.total}`;
      elements.categorySummary.append(chip);
    });
}

function createGalleryCard(drawing, imageSource) {
  const article = document.createElement('article');
  article.className = 'gallery-card';
  const image = document.createElement('img');
  image.loading = 'lazy';
  image.src = imageSource;
  image.alt = `${drawing.word || '주제어'} 그림`;
  const body = document.createElement('div');
  body.className = 'gallery-card-body';
  const word = document.createElement('strong');
  word.textContent = drawing.word || '이름 없는 그림';
  const creator = document.createElement('span');
  creator.textContent = `${drawing.creator || drawing.legacy?.creator || '익명'} · ${drawing.category || '도감'}`;
  body.append(word, creator);
  article.append(image, body);
  return article;
}

async function loadGalleryPage({ reset = false } = {}) {
  if (state.galleryLoading) return;
  state.galleryLoading = true;
  elements.galleryMore.disabled = true;
  if (reset) {
    state.galleryCursor = null;
    elements.galleryGrid.replaceChildren();
    elements.galleryGrid.classList.add('hidden');
    elements.galleryEmpty.classList.add('hidden');
    elements.galleryLoading.classList.remove('hidden');
    elements.galleryMore.classList.add('hidden');
  }

  try {
    const constraints = [orderBy('timestamp', 'desc')];
    if (state.galleryCursor) constraints.push(startAfter(state.galleryCursor));
    constraints.push(limit(24));
    const snapshot = await getDocs(query(refs.drawings, ...constraints));
    state.galleryCursor = snapshot.docs.at(-1) || null;

    const cards = (
      await Promise.all(
        snapshot.docs.map(async (drawingDocument) => {
          const drawing = await hydrateDrawingRecord({
            id: drawingDocument.id,
            ...drawingDocument.data(),
          });
          const source = drawingImageSource(drawing);
          return drawing && source
            ? createGalleryCard(drawing, source)
            : null;
        })
      )
    ).filter(Boolean);

    if (cards.length) {
      elements.galleryGrid.append(...cards);
      elements.galleryGrid.classList.remove('hidden');
    }
    const hasAnyCards = elements.galleryGrid.children.length > 0;
    elements.galleryEmpty.classList.toggle('hidden', hasAnyCards);
    elements.galleryMore.classList.toggle(
      'hidden',
      snapshot.docs.length < 24
    );
  } catch {
    showToast('그림 도감을 불러오지 못했습니다. 다시 시도해주세요.', 'error');
    elements.galleryMore.classList.remove('hidden');
  } finally {
    state.galleryLoading = false;
    elements.galleryLoading.classList.add('hidden');
    elements.galleryMore.disabled = false;
  }
}

async function openGallery() {
  showScreen('screen-gallery');
  state.galleryCursor = null;
  elements.galleryGrid.replaceChildren();
  elements.galleryGrid.classList.add('hidden');
  elements.galleryEmpty.classList.add('hidden');
  elements.galleryMore.classList.add('hidden');
  elements.galleryLoading.classList.remove('hidden');
  try {
    await refreshCatalog();
    renderCategorySummary();
    await loadGalleryPage({ reset: true });
  } catch {
    elements.galleryLoading.classList.add('hidden');
    elements.galleryMore.classList.remove('hidden');
    showToast('그림 도감을 불러오지 못했습니다. 다시 시도해주세요.', 'error');
  }
}

async function submitSuggestion(event) {
  event.preventDefault();
  const word = elements.suggestInput.value
    .trim()
    .normalize('NFKC')
    .replace(/\s+/g, '');
  const blockedFragments = ['마약', '자살', '살인', '음란', '도박'];
  if (
    !/^[가-힣]{1,8}$/.test(word) ||
    blockedFragments.some((fragment) => word.includes(fragment))
  ) {
    showToast('쉽게 그릴 수 있는 한글 명사 1~8자로 적어주세요.', 'error');
    return;
  }

  const id = promptIdForWord(word);
  try {
    const created = await createPromptIfMissing(id, {
      word,
      wordKey: normalizeWord(word),
      category: inferCategory(word),
      status: 'available',
      source: 'friend-suggestion',
      suggestedBy: state.user.uid,
      suggestedByName: state.nickname,
      createdAt: Date.now(),
      schemaVersion: SCHEMA_VERSION,
    });
    if (!created) {
      showToast('이미 도감에 있는 주제어입니다.', 'warning');
      return;
    }
    elements.suggestInput.value = '';
    showToast(`“${word}” 주제어가 도감에 추가되었습니다.`, 'success');
    await refreshCatalog();
  } catch {
    showToast('주제어를 추가하지 못했습니다. 잠시 후 다시 시도해주세요.', 'error');
  }
}

function enterWithNickname(event) {
  event.preventDefault();
  if (!state.ready) {
    showToast('도감을 준비하고 있습니다. 잠시만 기다려주세요.', 'warning');
    return;
  }
  const nickname = elements.nicknameInput.value.trim();
  if (!nickname || nickname.length > 15) {
    showToast('닉네임을 1~15자로 입력해주세요.', 'error');
    return;
  }
  state.nickname = nickname;
  localStorage.setItem('sketchbook_nickname_v3', nickname);
  elements.headerNickname.textContent = nickname;
  elements.headerNickname.classList.remove('hidden');
  renderStats();
  showScreen('screen-dashboard');
}

async function goHome() {
  if (state.currentPrompt) await releaseCurrentPrompt();
  clearTimeout(state.guessTransitionTimer);
  state.guessRequestVersion += 1;
  state.guessBusy = false;
  state.currentGuess = null;
  showScreen('screen-dashboard');
}

function bindEvents() {
  elements.nicknameForm.addEventListener('submit', enterWithNickname);
  document
    .getElementById('change-nickname-button')
    .addEventListener('click', () => {
      elements.nicknameInput.value = state.nickname;
      showScreen('screen-welcome');
    });
  document
    .getElementById('open-draw-button')
    .addEventListener('click', openPromptSelection);
  document
    .getElementById('open-guess-button')
    .addEventListener('click', openGuessMode);
  document
    .getElementById('open-gallery-button')
    .addEventListener('click', openGallery);
  elements.galleryMore.addEventListener('click', () => loadGalleryPage());
  document
    .getElementById('open-suggest-button')
    .addEventListener('click', () => showScreen('screen-suggest'));
  document.querySelectorAll('[data-go-home]').forEach((button) => {
    button.addEventListener('click', goHome);
  });
  document
    .getElementById('cancel-drawing-button')
    .addEventListener('click', async () => {
      await releaseCurrentPrompt();
      await refreshCatalog().catch(() => {
        showToast('최신 도감 현황은 다음 접속 때 다시 불러옵니다.', 'warning');
      });
      showScreen('screen-dashboard');
    });
  document
    .getElementById('undo-button')
    .addEventListener('click', () => {
      state.strokes.pop();
      redrawCanvas();
    });
  document
    .getElementById('clear-button')
    .addEventListener('click', () => {
      state.strokes = [];
      redrawCanvas();
    });
  elements.submitDrawing.addEventListener('click', submitDrawing);
  elements.brushSize.addEventListener('input', (event) => {
    state.brushSize = Number(event.target.value);
  });
  elements.canvas.addEventListener('pointerdown', handlePointerDown, {
    passive: false,
  });
  elements.canvas.addEventListener('pointermove', handlePointerMove, {
    passive: false,
  });
  elements.canvas.addEventListener('pointerup', handlePointerUp);
  elements.canvas.addEventListener('pointercancel', handlePointerUp);
  elements.canvas.addEventListener('pointerleave', handlePointerUp);
  elements.canvas.addEventListener('lostpointercapture', handlePointerUp);
  // iOS Safari 일부 버전은 touch-action만으로 스크롤을 완전히 막지 못한다.
  // 캔버스 영역의 손가락 이동만 차단하고, 화면의 나머지 영역은 계속 스크롤된다.
  elements.canvasWrap.addEventListener('touchstart', preventCanvasTouchScroll, {
    passive: false,
  });
  elements.canvasWrap.addEventListener('touchmove', preventCanvasTouchScroll, {
    passive: false,
  });
  elements.canvasWrap.addEventListener('gesturestart', preventCanvasTouchScroll, {
    passive: false,
  });
  document
    .getElementById('guess-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();
      checkGuess();
    });
  elements.guessSubmit.addEventListener('click', checkGuess);
  elements.guessPass.addEventListener('click', passGuess);
  elements.suggestForm.addEventListener('submit', submitSuggestion);
}

async function boot() {
  elements.enterButton.disabled = true;
  bindEvents();
  resetCanvas();
  const savedNickname = localStorage.getItem('sketchbook_nickname_v3') || '';
  elements.nicknameInput.value = savedNickname;

  try {
    const credential = auth.currentUser
      ? { user: auth.currentUser }
      : await signInAnonymously(auth);
    state.user = credential.user;
    if (usesSeparateLegacyProject && !legacyAuth.currentUser) {
      await signInAnonymously(legacyAuth).catch((error) => {
        console.warn('기존 스케치북 Firebase 익명 인증을 건너뜁니다.', error);
      });
    }
    await ensureCatalogAndMigrateLegacy();
    await refreshCatalog();
    state.ready = true;
    elements.enterButton.disabled = false;
    elements.bootStatus.textContent =
      `주제어 ${state.prompts.length.toLocaleString('ko-KR')}개가 준비되었습니다.`;
    maybeRefillPromptPool().catch(() => {});
  } catch (error) {
    console.error('스케치북 초기화 실패:', error);
    elements.bootStatus.textContent =
      '도감을 불러오지 못했습니다. 잠시 후 새로고침해주세요.';
    showToast('스케치북 초기화에 실패했습니다.', 'error');
  }
}

boot();
