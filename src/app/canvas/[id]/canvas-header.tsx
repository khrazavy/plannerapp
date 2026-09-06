'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { exportCanvas, renameCanvas } from '@/lib/actions/canvas';
import { InputDialog } from '@/components/ui/dialog';

interface CanvasHeaderProps {
  canvasId: string;
  canvasName: string;
}

type ExportFormat = 'pdf' | 'markdown';

export default function CanvasHeader({ canvasId, canvasName }: CanvasHeaderProps) {
  const [name, setName] = useState(canvasName);
  const [renameOpen, setRenameOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRename = async (newName: string) => {
    await renameCanvas({ id: canvasId, name: newName });
    setName(newName);
  };

  const handleExport = async (format: ExportFormat) => {
    setExportOpen(false);
    setExportError(null);
    setExporting(format);
    try {
      const result = await exportCanvas({ canvasId, format });
      if (!result.ok) {
        setExportError(result.error);
        return;
      }
      const data: BlobPart =
        result.encoding === 'base64'
          ? Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0))
          : result.data;
      const blob = new Blob([data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative flex items-center gap-4 mb-6">
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

      <div className="ml-auto flex items-center gap-3">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {exporting ? `Exporting ${exporting.toUpperCase()}…` : 'Export'}
            {exporting === null && (
              <svg
                className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-800">
                  Export as PDF
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Landscape, preserves the canvas layout
                </span>
              </button>
              <button
                onClick={() => handleExport('markdown')}
                disabled={exporting !== null}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-800">
                  Export as Markdown
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Each canvas block becomes a section
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {exportError && (
        <div className="absolute right-0 top-full mt-2 z-10 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-md border border-red-200 shadow">
          {exportError}
        </div>
      )}

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