import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  getKSTResetContext,
  getRecentKSTResetContexts,
  getUniqueLeaderboardPaths,
  isResetCompleteForContext,
} from "../api/cron/minigame-daily-reset.js";
import { getGameForDayNumber } from "../src/config/minigames.js";

const games = [
  {
    id: "alpha",
    name: "Alpha",
    ranks: [
      {
        key: "score",
        label: "Score",
        path: ["artifacts", "alpha", "public", "data", "leaderboard"],
      },
    ],
  },
  {
    id: "beta",
    name: "Beta",
    ranks: [
      {
        key: "score",
        label: "Score",
        path: ["artifacts", "beta", "public", "data", "leaderboard"],
      },
    ],
  },
];

test("minigame reset selects the KST calendar day", () => {
  const now = Date.parse("2026-08-01T15:00:00.000Z");
  const context = getKSTResetContext(now, games);

  assert.equal(context.date, "2026-08-02");
  assert.equal(context.dayNumber, 20667);
  assert.equal(
    context.game.id,
    getGameForDayNumber(context.dayNumber, games).id
  );
});

test("minigame reset reconciles recent days after the game catalog changes", () => {
  const now = Date.parse("2026-08-01T15:00:00.000Z");
  const contexts = getRecentKSTResetContexts(now, games, 3);

  assert.deepEqual(
    contexts.map((context) => context.date),
    ["2026-07-31", "2026-08-01", "2026-08-02"]
  );
  assert.equal(
    isResetCompleteForContext(
      { status: "complete", gameId: contexts.at(-1).game.id },
      contexts.at(-1)
    ),
    true
  );
  assert.equal(
    isResetCompleteForContext(
      { status: "complete", gameId: "old-game-id" },
      contexts.at(-1)
    ),
    false
  );
});

test("minigame reset removes duplicate leaderboard paths", () => {
  const duplicatedGame = {
    ...games[0],
    ranks: [games[0].ranks[0], { ...games[0].ranks[0], key: "duplicate" }],
  };

  assert.deepEqual(getUniqueLeaderboardPaths(duplicatedGame), [
    ["artifacts", "alpha", "public", "data", "leaderboard"],
  ]);
});

test("daily reset workflow calls the protected endpoint as a backup", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/daily-reset.yml", import.meta.url),
    "utf8"
  );

  assert.match(workflow, /cron: "15 15 \* \* \*"/);
  assert.match(workflow, /api\/cron\/minigame-daily-reset/);
  assert.match(workflow, /Authorization: Bearer \$BACKUP_CRON_SECRET/);
  assert.doesNotMatch(workflow, /reset-arcade|npm install|setup-node/);
});

test("QStash setup includes only the isolated midnight KST minigame reset", () => {
  const setupScript = readFileSync(
    new URL("../scripts/setup-qstash-minigame-reset.ps1", import.meta.url),
    "utf8"
  );

  assert.match(setupScript, /backup-minigame-daily-reset-v1/);
  assert.match(setupScript, /CRON_TZ=Asia\/Seoul 0 0 \* \* \*/);
  assert.match(setupScript, /api\/cron\/minigame-daily-reset/);
  assert.match(setupScript, /resetVerification\.dryRun -ne \$true/);
});

test("legacy reset script with embedded Firebase config is removed", () => {
  assert.equal(
    existsSync(new URL("../reset-arcade.js", import.meta.url)),
    false
  );
});
