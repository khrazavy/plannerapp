'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { saveBlock } from '@/lib/actions/canvas';

interface BlockEditorPageProps {
  canvasId: string;
  canvasName: string;
  blockKey: string;
  blockTitle: string;
  hint: string;
  initialContent: string;
}

export default function BlockEditorPage({
  canvasId,
  canvasName,
  blockKey,
  blockTitle,
  hint,
  initialContent,
}: BlockEditorPageProps) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isDirty) {
          const ok = window.confirm(
            'You have unsaved changes. Leave without saving?'
          );
          if (ok) {
            window.history.back();
          }
        } else {
          window.history.back();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty]);

  const handleSave = useCallback(
    async (contentJson: string) => {
      const result = await saveBlock({
        canvasId,
        blockKey,
        contentJson,
      });
      if ('error' in result) {
        throw new Error(result.error);
      }
    },
    [canvasId, blockKey]
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center gap-3">
        <Link
          href={`/canvas/${canvasId}`}
          className="text-sm text-gray-300 hover:text-white transition-colors"
          onClick={(e) => {
            if (isDirty) {
              const ok = window.confirm(
                'You have unsaved changes. Leave without saving?'
              );
              if (!ok) e.preventDefault();
            }
          }}
        >
          ← {canvasName}
        </Link>
      </div>

      <div className="flex-1 bg-gray-800">
        <RichTextEditor
          initialContent={initialContent}
          onSave={handleSave}
          onDirtyChange={setIsDirty}
          blockTitle={blockTitle}
          hint={hint}
        />
      </div>
    </div>
  );
}
