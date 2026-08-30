import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const ACTIVE_POINTER = 'active.database';
const ALLOWED_EXTENSIONS = new Set(['.sqlite', '.sqlite3', '.db']);

export function dataDir(): string {
  return process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), 'data');
}

function ensureDataDir(): void {
  fs.mkdirSync(dataDir(), { recursive: true });
}

function isManagedDatabase(fullPath: string): boolean {
  return (
    fs.existsSync(fullPath) &&
    ALLOWED_EXTENSIONS.has(path.extname(fullPath).toLowerCase())
  );
}

export function listDatabases(): string[] {
  ensureDataDir();
  return fs
    .readdirSync(dataDir())
    .filter((f) => f !== ACTIVE_POINTER)
    .filter((f) => ALLOWED_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

export function getActiveDbPath(): string | null {
  const pointerPath = path.join(dataDir(), ACTIVE_POINTER);
  if (!fs.existsSync(pointerPath)) return null;
  const name = fs.readFileSync(pointerPath, 'utf8').trim();
  if (!name || name.includes(path.sep) || name.includes('/')) return null;
  const full = path.join(dataDir(), name);
  if (!isManagedDatabase(full)) return null;
  return full;
}

export function getActiveDbFilename(): string | null {
  const p = getActiveDbPath();
  return p ? path.basename(p) : null;
}

export function setActiveDbFilename(filename: string): string {
  ensureDataDir();
  const safe = path.basename(filename);
  if (!ALLOWED_EXTENSIONS.has(path.extname(safe).toLowerCase())) {
    throw new Error('Not an allowed database filename');
  }
  const full = path.join(dataDir(), safe);
  if (!isManagedDatabase(full)) {
    throw new Error('Database file does not exist');
  }
  fs.writeFileSync(path.join(dataDir(), ACTIVE_POINTER), safe, 'utf8');
  return full;
}

export function createDatabase(name: string): string {
  ensureDataDir();
  const base = path.basename(name.trim());
  if (!base) {
    throw new Error('Database name is required');
  }

  let baseName = base;
  let ext = path.extname(baseName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    ext = '.db';
  } else {
    baseName = baseName.slice(0, baseName.length - ext.length);
  }
  let filename = `${baseName}${ext}`;
  let counter = 2;
  while (fs.existsSync(path.join(dataDir(), filename))) {
    filename = `${baseName}-${counter}${ext}`;
    counter += 1;
  }

  const full = path.join(dataDir(), filename);
  const sqlite = new Database(full);
  sqlite.pragma('journal_mode = WAL');
  ensureRawSchema(sqlite);
  sqlite.close();
  return filename;
}

export function deleteDatabase(filename: string): boolean {
  const safe = path.basename(filename);
  if (!ALLOWED_EXTENSIONS.has(path.extname(safe).toLowerCase())) {
    throw new Error('Not an allowed database filename');
  }
  const full = path.join(dataDir(), safe);
  if (!fs.existsSync(full)) return false;

  closeConnection(full);
  fs.unlinkSync(full);
  rmSyncBare(full + '-wal');
  rmSyncBare(full + '-shm');

  const activePath = getActiveDbPath();
  if (activePath === full) {
    fs.unlinkSync(path.join(dataDir(), ACTIVE_POINTER));
  }
  return true;
}

function rmSyncBare(p: string): void {
  try {
    fs.unlinkSync(p);
  } catch {
    /* ignore missing */
  }
}

type PlannerDb = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

const connCache = new Map<string, PlannerDb>();

function closeConnection(filePath: string): void {
  const cached = connCache.get(filePath);
  if (!cached) return;
  try {
    cached.$client.close();
  } catch {
    /* ignore close errors */
  }
  connCache.delete(filePath);
}

export function openDatabase(filePath: string): PlannerDb {
  const cached = connCache.get(filePath);
  if (cached) return cached;
  const sqlite = new Database(filePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  ensureRawSchema(sqlite);
  const db = drizzle(sqlite, { schema });
  connCache.set(filePath, db);
  return db;
}

export function getActiveDb(): PlannerDb | null {
  const p = getActiveDbPath();
  if (!p) return null;
  return openDatabase(p);
}

export function ensureRawSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS canvases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      framework_type TEXT NOT NULL DEFAULT 'lean_canvas',
      owner_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS canvas_blocks (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
      block_key TEXT NOT NULL,
      content_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL,
      UNIQUE(canvas_id, block_key)
    );
  `);
}