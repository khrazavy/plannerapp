'use client';

import Link from 'next/link';
import { BlockSnapshot } from './block-snapshot';
import type { CanvasBlock } from '@/lib/actions/canvas';
import type { BlockTemplate } from '@/lib/frameworks/types';

interface GridViewProps {
  canvasId: string;
  blocks: CanvasBlock[];
  blockTemplates: BlockTemplate[];
}

const ROW_HEIGHTS = ['min-h-[180px]', 'min-h-[100px]', 'min-h-[100px]'];

export function GridView({ canvasId, blocks, blockTemplates }: GridViewProps) {
  const blocksByKey = new Map(blocks.map((b) => [b.blockKey, b]));

  return (
    <div className="grid grid-cols-5 gap-[1px] bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
      {blockTemplates.map((tmpl) => {
        const block = blocksByKey.get(tmpl.key);
        const row = tmpl.gridArea.row;
        return (
          <Link
            key={tmpl.key}
            href={`/canvas/${canvasId}/block/${tmpl.key}`}
            className={`
              bg-white p-4 flex flex-col gap-2 hover:bg-blue-50/40 transition-colors cursor-pointer
              group relative
              ${ROW_HEIGHTS[row - 1] || 'min-h-[100px]'}
              ${tmpl.gridArea.colSpan > 1 ? `col-span-${tmpl.gridArea.colSpan}` : ''}
              ${tmpl.gridArea.rowSpan > 1 ? `row-span-${tmpl.gridArea.rowSpan}` : ''}
            `}
            style={{
              gridColumn: tmpl.gridArea.colSpan > 1 ? `span ${tmpl.gridArea.colSpan}` : undefined,
              gridRow: tmpl.gridArea.rowSpan > 1 ? `span ${tmpl.gridArea.rowSpan}` : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {tmpl.title}
              </h3>
              <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                Edit →
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              {block && (
                <BlockSnapshot
                  contentJson={block.contentJson}
                  placeholder={tmpl.placeholder}
                />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
