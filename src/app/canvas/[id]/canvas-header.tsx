'use client';

import { useState } from 'react';
import Link from 'next/link';
import { renameCanvas } from '@/lib/actions/canvas';
import { InputDialog } from '@/components/ui/dialog';

interface CanvasHeaderProps {
  canvasId: string;
  canvasName: string;
}

export default function CanvasHeader({ canvasId, canvasName }: CanvasHeaderProps) {
  const [name, setName] = useState(canvasName);
  const [renameOpen, setRenameOpen] = useState(false);

  const handleRename = async (newName: string) => {
    await renameCanvas({ id: canvasId, name: newName });
    setName(newName);
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Dashboard
      </Link>
      <div className="flex items-center gap-2">
        <h1
          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setRenameOpen(true)}
        >
          {name}
        </h1>
        <button
          onClick={() => setRenameOpen(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✎
        </button>
      </div>

      <InputDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onSubmit={handleRename}
        title="Rename Canvas"
        label="Canvas name"
        defaultValue={name}
      />
    </div>
  );
}
