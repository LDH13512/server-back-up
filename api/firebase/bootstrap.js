const CONFIG_KEYS = {
  main: "FIREBASE_WEB_CONFIG",
  minigame: "FIREBASE_MINIGAME_CONFIG",
  sketchbookLegacy: "FIREBASE_SKETCHBOOK_LEGACY_CONFIG",
};

const REQUIRED_FIELDS = ["apiKey", "authDomain", "projectId", "appId"];
const BACKUP_PROJECT_ID = "backup-fcf14";

function readConfig(target) {
  const key = CONFIG_KEYS[target];
  if (!key || !process.env[key]) return null;
  try {
    const config = JSON.parse(process.env[key]);
    return REQUIRED_FIELDS.every((field) => typeof config[field] === "string" && config[field]) &&
      config.projectId === BACKUP_PROJECT_ID
      ? config
      : null;
  } catch {
    return null;
  }
}

export default function handler(req, res) {
  const target = String(req.query?.app || "");
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (target === "sketchbook") {
    const minigameConfig = readConfig("minigame");
    const legacyConfig = readConfig("sketchbookLegacy");
    if (!minigameConfig) {
      res.status(503).send("window.__PLAYGROUND_FIREBASE_BOOTSTRAP_ERROR__='SERVER_NOT_CONFIGURED';");
      return;
    }
    const encoded = Buffer.from(JSON.stringify(minigameConfig), "utf8").toString("base64");
    res.status(200).send(
      `window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__=${JSON.stringify(minigameConfig)};` +
      `window.__PLAYGROUND_FIREBASE_SKETCHBOOK_LEGACY_CONFIG__=${JSON.stringify(legacyConfig)};` +
      `window._mg_fbc=${JSON.stringify(encoded)};`
    );
    return;
  }

  const config = readConfig(target);
  if (!config || (target === "main" && !readConfig("minigame"))) {
    res.status(503).send("window.__PLAYGROUND_FIREBASE_BOOTSTRAP_ERROR__='SERVER_NOT_CONFIGURED';");
    return;
  }
  if (target === "minigame") {
    const encoded = Buffer.from(JSON.stringify(config), "utf8").toString("base64");
    res.status(200).send(`window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__=${JSON.stringify(config)};window._mg_fbc=${JSON.stringify(encoded)};`);
    return;
  }
  const minigameConfig = readConfig("minigame");
  const encoded = Buffer.from(JSON.stringify(minigameConfig), "utf8").toString("base64");
  res.status(200).send(`window.__PLAYGROUND_FIREBASE_WEB_CONFIG__=${JSON.stringify(config)};window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__=${JSON.stringify(minigameConfig)};window._mg_fbc=${JSON.stringify(encoded)};`);
}
