'use server';

import {
  getActiveDb,
  getActiveDbFilename,
  listDatabases,
  createDatabase,
  deleteDatabase,
  setActiveDbFilename,
  openDatabase,
} from '@/lib/db';
import { canvases, canvasBlocks } from '@/lib/db/schema';
import { getFrameworkTemplate } from '@/lib/frameworks/lean-canvas';
import { exportCanvasToMarkdown, exportCanvasToPdf } from '@/lib/export';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createCanvasSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name too long'),
});

const renameCanvasSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name too long'),
});

const deleteCanvasSchema = z.object({
  id: z.string().uuid(),
});

const duplicateCanvasSchema = z.object({
  id: z.string().uuid(),
});

const saveBlockSchema = z.object({
  canvasId: z.string().uuid(),
  blockKey: z.string().min(1),
  contentJson: z.string().min(1),
});

export type Canvas = typeof canvases.$inferSelect;
export type CanvasBlock = typeof canvasBlocks.$inferSelect;

export type DatabaseInfo = {
  active: string | null;
  databases: string[];
};

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  return {
    active: getActiveDbFilename(),
    databases: listDatabases(),
  };
}

const selectDatabaseSchema = z.object({
  filename: z.string().min(1),
});

const createDatabaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name too long'),
});

const deleteDatabaseSchema = z.object({
  filename: z.string().min(1),
});

type DbActionResult = { ok: true; filename?: string } | { error: string };

export async function selectDatabase(
  formData: { filename: string }
): Promise<DbActionResult> {
  const parsed = selectDatabaseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  try {
    const fullPath = setActiveDbFilename(parsed.data.filename);
    openDatabase(fullPath);
    revalidatePath('/');
    return { ok: true, filename: parsed.data.filename };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to select database' };
  }
}

export async function createDatabaseFile(
  formData: { name: string }
): Promise<DbActionResult> {
  const parsed = createDatabaseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  try {
    const filename = createDatabase(parsed.data.name);
    const fullPath = setActiveDbFilename(filename);
    openDatabase(fullPath);
    revalidatePath('/');
    return { ok: true, filename };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create database' };
  }
}

export async function deleteDatabaseFile(
  formData: { filename: string }
): Promise<DbActionResult> {
  const parsed = deleteDatabaseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  try {
    deleteDatabase(parsed.data.filename);
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete database' };
  }
}

function noDatabaseError() {
  return {
    error:
      'No database loaded. Open a canvas SQLite database file from the dashboard.',
  };
}

export async function listCanvases(): Promise<Canvas[]> {
  const db = getActiveDb();
  if (!db) return [];
  return db
    .select()
    .from(canvases)
    .orderBy(desc(canvases.updatedAt))
    .all();
}

export async function getCanvas(id: string): Promise<Canvas | undefined> {
  const db = getActiveDb();
  if (!db) return undefined;
  const results = db
    .select()
    .from(canvases)
    .where(eq(canvases.id, id))
    .limit(1)
    .all();
  return results[0];
}

export async function getCanvasBlocks(canvasId: string): Promise<CanvasBlock[]> {
  const db = getActiveDb();
  if (!db) return [];
  return db
    .select()
    .from(canvasBlocks)
    .where(eq(canvasBlocks.canvasId, canvasId))
    .all();
}

export async function getCanvasBlock(
  canvasId: string,
  blockKey: string
): Promise<CanvasBlock | undefined> {
  const db = getActiveDb();
  if (!db) return undefined;
  const results = db
    .select()
    .from(canvasBlocks)
    .where(and(eq(canvasBlocks.canvasId, canvasId), eq(canvasBlocks.blockKey, blockKey)))
    .limit(1)
    .all();
  return results[0];
}

export async function createCanvas(formData: { name: string }) {
  const db = getActiveDb();
  if (!db) return noDatabaseError();

  const parsed = createCanvasSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const now = new Date();
  const id = uuidv4();
  const template = getFrameworkTemplate('lean_canvas');

  db.insert(canvases)
    .values({
      id,
      name: parsed.data.name,
      frameworkType: 'lean_canvas',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (template) {
    for (const block of template.blocks) {
      db.insert(canvasBlocks)
        .values({
          id: uuidv4(),
          canvasId: id,
          blockKey: block.key,
          contentJson: '{}',
          updatedAt: now,
        })
        .run();
    }
  }

  revalidatePath('/');
  return { id };
}

export async function renameCanvas(formData: { id: string; name: string }) {
  const db = getActiveDb();
  if (!db) return noDatabaseError();

  const parsed = renameCanvasSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  db.update(canvases)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(canvases.id, parsed.data.id))
    .run();

  revalidatePath('/');
  revalidatePath(`/canvas/${parsed.data.id}`);
}

export async function deleteCanvas(formData: { id: string }) {
  const db = getActiveDb();
  if (!db) return noDatabaseError();

  const parsed = deleteCanvasSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  db.delete(canvases).where(eq(canvases.id, parsed.data.id)).run();

  revalidatePath('/');
}

export async function duplicateCanvas(formData: { id: string }) {
  const db = getActiveDb();
  if (!db) return noDatabaseError();

  const parsed = duplicateCanvasSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const original = await getCanvas(parsed.data.id);
  if (!original) {
    return { error: 'Canvas not found' };
  }

  const blocks = await getCanvasBlocks(parsed.data.id);
  const now = new Date();
  const newId = uuidv4();

  db.insert(canvases)
    .values({
      id: newId,
      name: `${original.name} (copy)`,
      frameworkType: original.frameworkType,
      ownerId: original.ownerId,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  for (const block of blocks) {
    db.insert(canvasBlocks)
      .values({
        id: uuidv4(),
        canvasId: newId,
        blockKey: block.blockKey,
        contentJson: block.contentJson,
        updatedAt: now,
      })
      .run();
  }

  revalidatePath('/');
  return { id: newId };
}

export async function saveBlock(formData: {
  canvasId: string;
  blockKey: string;
  contentJson: string;
}) {
  const db = getActiveDb();
  if (!db) return noDatabaseError();

  const parsed = saveBlockSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const now = new Date();

  db.update(canvasBlocks)
    .set({ contentJson: parsed.data.contentJson, updatedAt: now })
    .where(
      and(
        eq(canvasBlocks.canvasId, parsed.data.canvasId),
        eq(canvasBlocks.blockKey, parsed.data.blockKey)
      )
    )
    .run();

  db.update(canvases)
    .set({ updatedAt: now })
    .where(eq(canvases.id, parsed.data.canvasId))
    .run();

  revalidatePath(`/canvas/${parsed.data.canvasId}`);
  return { success: true };
}

const exportCanvasSchema = z.object({
  canvasId: z.string().uuid(),
  format: z.enum(['pdf', 'markdown']),
});

export type ExportActionResult =
  | {
      ok: true;
      data: string;
      encoding: 'base64' | 'utf8';
      mimeType: string;
      filename: string;
    }
  | { ok: false; error: string };

export async function exportCanvas(formData: {
  canvasId: string;
  format: 'pdf' | 'markdown';
}): Promise<ExportActionResult> {
  const parsed = exportCanvasSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const canvas = await getCanvas(parsed.data.canvasId);
  if (!canvas) {
    return { ok: false, error: 'Canvas not found' };
  }

  try {
    const result =
      parsed.data.format === 'pdf'
        ? await exportCanvasToPdf(parsed.data.canvasId)
        : await exportCanvasToMarkdown(parsed.data.canvasId);

    if (!result.success || !result.data) {
      return { ok: false, error: result.message };
    }

    const isPdf = parsed.data.format === 'pdf';
    const filename = `${sanitizeFilename(canvas.name)}${isPdf ? '.pdf' : '.md'}`;

    return {
      ok: true,
      data: isPdf ? result.data.toString('base64') : result.data.toString('utf8'),
      encoding: isPdf ? 'base64' : 'utf8',
      mimeType: isPdf ? 'application/pdf' : 'text/markdown; charset=utf-8',
      filename,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Export failed' };
  }
}

function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]+/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  return cleaned || 'canvas';
}