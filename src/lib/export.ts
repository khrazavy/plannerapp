import puppeteer from 'puppeteer';
import { eq } from 'drizzle-orm';
import { getActiveDb } from '@/lib/db';
import { canvases, canvasBlocks } from '@/lib/db/schema';
import { getFrameworkTemplate } from '@/lib/frameworks/lean-canvas';
import {
  isEmptyProseJson,
  renderProseMirrorJsonToHTML,
  renderProseMirrorJsonToMarkdown,
} from '@/lib/prosemirror-render';
import type { BlockTemplate, FrameworkTemplate } from '@/lib/frameworks/types';

type CanvasRow = typeof canvases.$inferSelect;
type CanvasBlockRow = typeof canvasBlocks.$inferSelect;

export interface ExportResult {
  success: boolean;
  message: string;
  data?: Buffer;
}

const ROW_MIN_HEIGHTS = [180, 100, 100];

export async function exportCanvasToPdf(canvasId: string): Promise<ExportResult> {
  const canvas = loadCanvas(canvasId);
  if (!canvas.ok) return canvas;

  const template = getFrameworkTemplate(canvas.canvas.frameworkType);
  if (!template) {
    return { success: false, message: 'Unknown framework template' };
  }

  const blocks = loadBlocks(canvasId);
  const html = buildCanvasPdfHtml(canvas.canvas.name, canvas.canvas.frameworkType, template, blocks);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
    });
    return {
      success: true,
      message: 'PDF exported successfully',
      data: Buffer.from(pdf),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'PDF export failed',
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

export async function exportCanvasToMarkdown(canvasId: string): Promise<ExportResult> {
  const canvas = loadCanvas(canvasId);
  if (!canvas.ok) return canvas;

  const template = getFrameworkTemplate(canvas.canvas.frameworkType);
  if (!template) {
    return { success: false, message: 'Unknown framework template' };
  }

  const blocks = loadBlocks(canvasId);
  const blocksByKey = new Map(blocks.map((b) => [b.blockKey, b]));

  const lines = [
    `# ${canvas.canvas.name}`,
    '',
    template.blocks
      .map((t) => renderBlockSection(t, blocksByKey.get(t.key)?.contentJson))
      .join('\n\n'),
  ].join('\n');

  const markdown = `${lines.trimEnd()}\n`;
  return {
    success: true,
    message: 'Markdown exported successfully',
    data: Buffer.from(markdown, 'utf8'),
  };
}

function renderBlockSection(template: BlockTemplate, contentJson?: string): string {
  const body = contentJson ? renderProseMirrorJsonToMarkdown(contentJson).trim() : '';
  const parts = [`## ${template.title}`];
  if (body) parts.push(body);
  return parts.join('\n\n');
}

export function buildCanvasPdfHtml(
  canvasName: string,
  frameworkType: string,
  template: FrameworkTemplate,
  blocks: CanvasBlockRow[]
): string {
  const blocksByKey = new Map(blocks.map((b) => [b.blockKey, b]));
  const framework = getFrameworkTemplate(frameworkType);

  const gridCells = template.blocks
    .map((tmpl) => {
      const { row, col, colSpan, rowSpan } = tmpl.gridArea;
      const block = blocksByKey.get(tmpl.key);
      const minHeight = ROW_MIN_HEIGHTS[row - 1] || 100;
      const content = block
        ? renderBlockHtml(block.contentJson, tmpl.placeholder)
        : '';
      return `
        <div class="block" style="grid-column: ${col} / span ${colSpan}; grid-row: ${row} / span ${rowSpan}; min-height: ${minHeight}px;">
          <div class="block-title">${escapeHtml(tmpl.title)}</div>
          <div class="block-content">${content}</div>
        </div>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(canvasName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
  }
  .canvas-header { margin-bottom: 16px; }
  .canvas-title { font-size: 24px; font-weight: 700; color: #111827; }
  .canvas-subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    margin-top: 4px;
  }
  .canvas-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 6px;
    background: #e5e7eb;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    page-break-inside: avoid;
  }
  .block {
    background: #ffffff;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    page-break-inside: avoid;
  }
  .block-title {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
  }
  .block-content {
    font-size: 11px;
    line-height: 1.4;
    color: #374151;
    word-wrap: break-word;
    overflow: hidden;
  }
  .block-placeholder { font-size: 10px; font-style: italic; color: #9ca3af; }
  .block-content p { margin-bottom: 4px; }
  .block-content ul, .block-content ol { margin-bottom: 4px; padding-left: 14px; }
  .block-content h1, .block-content h2, .block-content h3 { margin: 2px 0 4px; line-height: 1.3; }
  .block-content h1 { font-size: 13px; }
  .block-content h2 { font-size: 12px; }
  .block-content h3 { font-size: 11px; }
</style>
</head>
<body>
  <div class="canvas-header">
    <div class="canvas-title">${escapeHtml(canvasName)}</div>
    <div class="canvas-subtitle">${escapeHtml(framework?.title ?? '')}</div>
  </div>
  <div class="canvas-grid">
    ${gridCells}
  </div>
</body>
</html>`;
}

function renderBlockHtml(contentJson: string, placeholder: string): string {
  if (isEmptyProseJson(contentJson)) {
    return `<div class="block-placeholder">${escapeHtml(placeholder)}</div>`;
  }
  return renderProseMirrorJsonToHTML(contentJson);
}

function loadCanvas(canvasId: string):
  | { ok: true; canvas: CanvasRow }
  | { ok: false; success: false; message: string } {
  const db = getActiveDb();
  if (!db) {
    return {
      ok: false,
      success: false,
      message: 'No database loaded. Open a canvas SQLite database file from the dashboard.',
    };
  }
  const results = db
    .select()
    .from(canvases)
    .where(eq(canvases.id, canvasId))
    .limit(1)
    .all();
  const canvas = results[0];
  if (!canvas) {
    return { ok: false, success: false, message: 'Canvas not found' };
  }
  return { ok: true, canvas };
}

function loadBlocks(canvasId: string): CanvasBlockRow[] {
  const db = getActiveDb();
  if (!db) return [];
  return db
    .select()
    .from(canvasBlocks)
    .where(eq(canvasBlocks.canvasId, canvasId))
    .all();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}