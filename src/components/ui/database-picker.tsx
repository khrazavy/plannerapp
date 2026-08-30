'use client';

import { useState } from 'react';
import { Button } from './button';

interface DatabasePickerProps {
  databases: string[];
  active: string | null;
  onSelect: (filename: string) => void;
  onCreate: (name: string) => void;
  onDelete: (filename: string) => void;
  error?: string | null;
  busy?: boolean;
  title?: string;
  showCreate?: boolean;
}

export function DatabasePicker({
  databases,
  active,
  onSelect,
  onCreate,
  onDelete,
  error,
  busy,
  title,
  showCreate = true,
}: DatabasePickerProps) {
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
  };

  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {databases.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">
          No databases found in the data directory yet. Create one to get
          started.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden mb-4">
          {databases.map((filename) => {
            const isActive = filename === active;
            return (
              <li
                key={filename}
                className="flex items-center justify-between px-4 py-3 bg-white"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm text-gray-800 truncate">
                    {filename}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {!isActive && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelect(filename)}
                        disabled={busy}
                      >
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(filename)}
                        disabled={busy}
                        title="Delete this database file"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showCreate && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
            placeholder="Name for a new database"
            maxLength={120}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            disabled={busy || !newName.trim()}
          >
            Create
          </Button>
        </div>
      )}
    </div>
  );
}