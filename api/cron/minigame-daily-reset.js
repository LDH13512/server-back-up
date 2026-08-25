import crypto from "node:crypto";
import {
  getAdminFirestore,
  getMinigameAdminFirestore,
} from "../_lib/firebase-admin.js";
import {
  getGameForDayNumber,
  mergeGameRegistrations,
} from "../../src/config/minigames.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DELETE_BATCH_SIZE = 400;
const RESET_LEASE_MS = 15 * 60 * 1000;
const RESET_RECONCILIATION_DAYS = 7;

function sendJson(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isAuthorized(req) {
  const cronSecret = process.env.BACKUP_CRON_SECRET;
  if (!cronSecret) return false;
  return secureEqual(
    req.headers.authorization,
    `Bearer ${cronSecret}`
  );
}

export function getKSTResetContextForDayNumber(dayNumber, games) {
  const date = new Date(dayNumber * DAY_MS).toISOString().slice(0, 10);
  const game = getGameForDayNumber(dayNumber, games);
  return { date, dayNumber, game };
}

export function getKSTResetContext(nowMs, games) {
  const dayNumber = Math.floor((nowMs + KST_OFFSET_MS) / DAY_MS);
  return getKSTResetContextForDayNumber(dayNumber, games);
}

export function getRecentKSTResetContexts(
  nowMs,
  games,
  days = RESET_RECONCILIATION_DAYS
) {
  const today = getKSTResetContext(nowMs, games);
  const count = Math.max(1, Math.min(31, Number(days) || 1));

  return Array.from({ length: count }, (_, index) =>
    getKSTResetContextForDayNumber(today.dayNumber - count + index + 1, games)
  );
}

export function isResetCompleteForContext(resetData, context) {
  return (
    resetData?.status === "complete" &&
    resetData?.gameId === context?.game?.id
  );
}

export function getUniqueLeaderboardPaths(game) {
  const pathMap = new Map();
  for (const rank of game?.ranks || []) {
    const path = Array.isArray(rank?.path)
      ? rank.path.map((part) => String(part || "").trim())
      : [];
    if (path.length === 0 || path.some((part) => !part)) {
      throw new Error("MINIGAME_LEADERBOARD_PATH_INVALID");
    }
    pathMap.set(path.join("/"), path);
  }
  if (pathMap.size === 0) {
    throw new Error("MINIGAME_LEADERBOARD_PATH_MISSING");
  }
  return [...pathMap.values()];
}

async function loadRegisteredMinigames(mainDb) {
  const snapshot = await mainDb.collection("minigames").get();
  return snapshot.docs.map((document) => ({
    ...document.data(),
    id: document.id,
  }));
}

async function countLeaderboardDocuments(minigameDb, path) {
  const aggregate = await minigameDb.collection(path.join("/")).count().get();
  return Number(aggregate.data().count || 0);
}

async function deleteLeaderboardDocuments(minigameDb, path) {
  const collectionReference = minigameDb.collection(path.join("/"));
  let deletedCount = 0;

  while (true) {
    const snapshot = await collectionReference.limit(DELETE_BATCH_SIZE).get();
    if (snapshot.empty) return deletedCount;

    const batch = minigameDb.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    deletedCount += snapshot.size;

    if (snapshot.size < DELETE_BATCH_SIZE) return deletedCount;
  }
}

async function reserveReset(mainDb, context, nowMs) {
  const documentId = `minigameDailyReset_${context.date.replaceAll("-", "")}`;
  const reference = mainDb.collection("system").doc(documentId);

  const result = await mainDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const data = snapshot.exists ? snapshot.data() : {};

    if (isResetCompleteForContext(data, context)) {
      return { reserved: false, reason: "ALREADY_RESET", reference };
    }
    if (
      data.status === "running" &&
      Number(data.startedAtMs || 0) > nowMs - RESET_LEASE_MS
    ) {
      return { reserved: false, reason: "RESET_IN_PROGRESS", reference };
    }

    transaction.set(
      reference,
      {
        status: "running",
        date: context.date,
        dayNumber: context.dayNumber,
        gameId: context.game.id,
        previousGameId: data.gameId || null,
        resetReason:
          data.status === "complete" ? "GAME_CATALOG_CHANGED" : "SCHEDULED",
        startedAtMs: nowMs,
        updatedAtMs: nowMs,
      },
      { merge: true }
    );
    return { reserved: true, reference };
  });

  return result;
}

async function markResetComplete(mainDb, reservationReference, context, nowMs) {
  const batch = mainDb.batch();
  batch.set(
    reservationReference,
    {
      status: "complete",
      completedAtMs: nowMs,
      updatedAtMs: nowMs,
    },
    { merge: true }
  );
  batch.set(mainDb.collection("system").doc("lastMinigameReset"), {
    dayNumber: context.dayNumber,
    timestamp: nowMs,
    gameId: context.game.id,
    date: context.date,
  });
  await batch.commit();
}

async function markResetFailed(mainDb, reservationReference, error, nowMs) {
  if (!reservationReference) return;
  await reservationReference.set(
    {
      status: "failed",
      failedAtMs: nowMs,
      updatedAtMs: nowMs,
      error: String(error?.message || "MINIGAME_RESET_FAILED").slice(0, 160),
    },
    { merge: true }
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }
  if (!isAuthorized(req)) {
    return sendJson(res, 401, {
      ok: false,
      error: process.env.BACKUP_CRON_SECRET
        ? "UNAUTHORIZED"
        : "BACKUP_CRON_SECRET_NOT_CONFIGURED",
    });
  }

  const dryRun = String(req.query?.dryRun || "") === "1";
  const nowMs = Date.now();
  let mainDb;
  let reservationReference;

  try {
    mainDb = getAdminFirestore();
    const minigameDb = getMinigameAdminFirestore();
    const registrations = await loadRegisteredMinigames(mainDb);
    const games = mergeGameRegistrations(registrations);
    const contexts = getRecentKSTResetContexts(nowMs, games);
    const context = contexts.at(-1);

    if (dryRun) {
      const resets = await Promise.all(
        contexts.map(async (candidate) => {
          const paths = getUniqueLeaderboardPaths(candidate.game);
          const leaderboards = await Promise.all(
            paths.map(async (path) => ({
              path: path.join("/"),
              documentCount: await countLeaderboardDocuments(minigameDb, path),
            }))
          );
          return {
            date: candidate.date,
            dayNumber: candidate.dayNumber,
            gameId: candidate.game.id,
            gameName: candidate.game.name,
            leaderboards,
          };
        })
      );
      return sendJson(res, 200, {
        ok: true,
        dryRun: true,
        date: context.date,
        dayNumber: context.dayNumber,
        gameId: context.game.id,
        gameName: context.game.name,
        resets,
        wouldDeleteCount: resets.reduce(
          (total, reset) =>
            total + reset.leaderboards.reduce(
              (count, item) => count + item.documentCount,
              0
            ),
          0
        ),
      });
    }

    const resets = [];
    for (const candidate of contexts) {
      const reservation = await reserveReset(mainDb, candidate, nowMs);
      reservationReference = reservation.reference;
      if (!reservation.reserved) {
        resets.push({
          date: candidate.date,
          gameId: candidate.game.id,
          reset: false,
          reason: reservation.reason,
          leaderboards: [],
        });
        continue;
      }

      const paths = getUniqueLeaderboardPaths(candidate.game);
      const leaderboards = [];
      for (const path of paths) {
        leaderboards.push({
          path: path.join("/"),
          deletedCount: await deleteLeaderboardDocuments(minigameDb, path),
        });
      }

      await markResetComplete(mainDb, reservationReference, candidate, Date.now());
      reservationReference = undefined;
      resets.push({
        date: candidate.date,
        gameId: candidate.game.id,
        gameName: candidate.game.name,
        reset: true,
        reason: reservation.reason,
        leaderboards,
      });
    }

    return sendJson(res, 200, {
      ok: true,
      dryRun: false,
      reset: resets.some((reset) => reset.reset),
      date: context.date,
      dayNumber: context.dayNumber,
      gameId: context.game.id,
      gameName: context.game.name,
      resets,
      deletedCount: resets.reduce(
        (total, reset) =>
          total + reset.leaderboards.reduce(
            (count, item) => count + item.deletedCount,
            0
          ),
        0
      ),
    });
  } catch (error) {
    console.error("Daily minigame reset failed:", error);
    try {
      await markResetFailed(mainDb, reservationReference, error, Date.now());
    } catch (markError) {
      console.error("Failed to mark minigame reset error:", markError);
    }
    const configurationError = String(error?.message || "");
    const isConfigurationError = configurationError.includes(
      "SERVICE_ACCOUNT"
    );
    return sendJson(res, isConfigurationError ? 503 : 500, {
      ok: false,
      error: isConfigurationError
        ? configurationError
        : "MINIGAME_DAILY_RESET_FAILED",
    });
  }
}
