/**
 * Fantasy league storage: ONE JSON document in Upstash Redis.
 *
 * Every write is a compare-and-set on a version key (tiny Lua script), so a write
 * either applies completely or not at all — scoring a match updates the result,
 * every prediction and every member total in one atomic step. If two admins save
 * at once, the loser retries against fresh data.
 *
 * Env (either pair; Vercel's Upstash integration injects them):
 *   KV_REST_API_URL + KV_REST_API_TOKEN   or   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * Without Redis, local `vercel dev` falls back to .data/fantasy.json. In production
 * without Redis the API refuses to run (Vercel's filesystem is read-only).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const KEY = process.env.FANTASY_STORAGE_KEY || "ccc:fantasy";
const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FILE = process.env.FANTASY_DATA_FILE || path.join(process.cwd(), ".data", "fantasy.json");

export const storageMode = REST_URL && REST_TOKEN ? "redis" : process.env.VERCEL ? "none" : "file";

export class ConflictError extends Error {}
export class StorageMissingError extends Error {}

export function emptyState() {
  return { version: 0, users: [], allowedEmails: [], players: [], matches: [], predictions: [], results: [] };
}

/** Fill in any collections added after the document was first written. */
function normalize(raw) {
  return { ...emptyState(), ...(raw ?? {}) };
}

export async function redis(command) {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`Storage error: ${body.error ?? res.status}`);
  return body.result;
}

const CAS = `
local cur = redis.call('GET', KEYS[2])
if (cur or '0') ~= ARGV[2] then return 0 end
redis.call('SET', KEYS[1], ARGV[1])
redis.call('SET', KEYS[2], ARGV[3])
return 1`;

async function readFile() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

async function writeFile(state) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, FILE);
}

function assertStorage() {
  if (storageMode === "none") {
    throw new StorageMissingError("Fantasy storage isn't configured. Connect Upstash Redis to this Vercel project.");
  }
}

export async function getState() {
  assertStorage();
  if (storageMode === "redis") {
    const raw = await redis(["GET", KEY]);
    return normalize(raw ? JSON.parse(raw) : null);
  }
  return normalize(await readFile());
}

let fileLock = Promise.resolve();

/**
 * Apply a pure transition `fn(state) => nextState` and persist it atomically.
 * `fn` may run more than once on a conflict, so it must not have side effects.
 */
export async function mutate(fn) {
  assertStorage();
  if (storageMode === "redis") {
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await getState();
      const next = { ...fn(current), version: current.version + 1 };
      const ok = await redis(["EVAL", CAS, 2, KEY, `${KEY}:version`, JSON.stringify(next), String(current.version), String(next.version)]);
      if (ok === 1) return next;
    }
    throw new ConflictError("Someone else was saving at the same time. Please try again.");
  }
  const run = async () => {
    const current = normalize(await readFile());
    const next = { ...fn(current), version: current.version + 1 };
    await writeFile(next);
    return next;
  };
  const p = fileLock.then(run, run);
  fileLock = p.catch(() => undefined);
  return p;
}
