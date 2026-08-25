import crypto from "node:crypto";

export const MAX_BODY_BYTES = 8 * 1024;
const memoryRateBuckets = new Map();

export function sendError(res, status, code, message) {
  return res.status(status).json({ ok: false, error: { code, message } });
}

export function allowOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const configured = (process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  const proto = req.headers["x-forwarded-proto"] || "https";
  const sameOrigin = req.headers.host ? `${proto}://${req.headers.host}` : "";
  if (origin !== sameOrigin && !configured.includes(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  return true;
}

export function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function parseJsonBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return { error: "PAYLOAD_TOO_LARGE" };
    try { body = JSON.parse(body); } catch { return { error: "INVALID_REQUEST" }; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "INVALID_REQUEST" };
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) return { error: "PAYLOAD_TOO_LARGE" };
  return { body };
}

export async function enforceRateLimit(redis, req, scope, limit, windowSeconds = 60) {
  const source = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const identity = crypto.createHash("sha256").update(source).digest("hex").slice(0, 24);
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rate:${scope}:${identity}:${bucket}`;
  let count;
  if (redis) {
    count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
  } else {
    count = (memoryRateBuckets.get(key) || 0) + 1;
    memoryRateBuckets.set(key, count);
    if (memoryRateBuckets.size > 1000) {
      for (const existingKey of memoryRateBuckets.keys()) {
        if (!existingKey.endsWith(`:${bucket}`)) {
          memoryRateBuckets.delete(existingKey);
        }
      }
    }
  }
  return count > limit ? Math.max(1, windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds)) : 0;
}
