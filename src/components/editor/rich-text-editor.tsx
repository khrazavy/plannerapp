'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (contentJson: string) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  blockTitle: string;
  hint: string;
}

export function RichTextEditor({
  initialContent,
  onSave,
  onDirtyChange,
  blockTitle,
  hint,
}: RichTextEditorProps) {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedContentRef = useRef(initialContent);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: parseContent(initialContent),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-1 text-gray-200',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      onDirtyChange(json !== savedContentRef.current);
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaveState('saving');
    const json = JSON.stringify(editor.getJSON());
    try {
      await onSave(json);
      savedContentRef.current = json;
      onDirtyChange(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  }, [editor, onSave, onDirtyChange]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-100">{blockTitle}</h1>
            {saveState === 'saved' && (
              <span className="text-xs text-green-600 font-medium">Saved</span>
            )}
            {saveState === 'error' && (
              <span className="text-xs text-red-600 font-medium">
                Failed to save — try again
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{hint}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
          >
            ← Back
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-700 px-6 py-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="B"
          className="font-bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="I"
          className="italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label="S"
          className="line-through"
        />
        <span className="w-px h-4 bg-gray-700 mx-1" />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive('heading', { level: 2 })}
          label="H2"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive('heading', { level: 3 })}
          label="H3"
        />
        <span className="w-px h-4 bg-gray-700 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="• List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="1. List"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  className = '',
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-2 py-1 text-xs rounded transition-colors
        ${
          active
            ? 'bg-gray-100 text-gray-900'
            : 'bg-transparent text-gray-300 hover:bg-gray-700'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
}

function parseContent(json: string): Record<string, unknown> {
  try {
    const doc = JSON.parse(json);
    if (doc && typeof doc === 'object' && doc.type) return doc;
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
}
