// Almacenamiento de la demo: archivo local, Redis REST en Vercel o memoria temporal.
// Redis es necesario para conservar el progreso entre invocaciones de Vercel.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newState } from './game.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const onVercel = Boolean(process.env.VERCEL);
const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '');
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = onVercel && Boolean(redisUrl && redisToken);
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const dataFile = path.join(dataDir, 'demo.json');
const stateKey = 'sabionautas:demo:state';
const sessions = new Map();
let temporaryState = newState();

export const storageMode = !onVercel ? 'archivo-local' : useRedis ? 'upstash-redis' : 'temporal-no-persistente';

async function redis(command) {
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Upstash respondió HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`Error de almacenamiento Redis: ${data.error}`);
  return data.result;
}

export async function loadState() {
  if (useRedis) {
    const raw = await redis(['GET', stateKey]);
    return raw === null ? newState() : typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  if (onVercel) return temporaryState;
  try { return JSON.parse(readFileSync(dataFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return newState(); }
}

export async function persistState(state) {
  if (useRedis) { await redis(['SET', stateKey, JSON.stringify(state)]); return; }
  if (onVercel) { temporaryState = state; return; }
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(`${dataFile}.tmp`, JSON.stringify(state));
  renameSync(`${dataFile}.tmp`, dataFile);
}

export async function getSession(id) {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const entry = useRedis ? await redis(['GET', `sabionautas:session:${id}`]) : sessions.get(id);
  const session = typeof entry === 'string' ? JSON.parse(entry) : entry;
  if (!session || session.expires < Date.now()) {
    if (session) await deleteSession(id);
    return undefined;
  }
  return session;
}

export async function setSession(id, session) {
  if (useRedis) {
    await redis(['SET', `sabionautas:session:${id}`, JSON.stringify(session), 'EX', '28800']);
  } else sessions.set(id, session);
}

export async function deleteSession(id) {
  if (!id) return;
  if (useRedis) await redis(['DEL', `sabionautas:session:${id}`]);
  else sessions.delete(id);
}
