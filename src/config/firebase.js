import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = window.__PLAYGROUND_FIREBASE_WEB_CONFIG__;
const minigameConfig = window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__;

if (!firebaseConfig || !minigameConfig) {
  throw new Error('Firebase configuration is unavailable.');
}

export const DEFAULT_PASSWORD = "0000";
export const themeColor = "#008081";

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const minigameApp = initializeApp(minigameConfig, "minigame");
export const minigameDb = getFirestore(minigameApp);
