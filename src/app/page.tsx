'use client';

import { useState, useEffect } from 'react';
import {
  listCanvases,
  createCanvas,
  renameCanvas,
  deleteCanvas,
  duplicateCanvas,
  getDatabaseInfo,
  selectDatabase,
  createDatabaseFile,
  deleteDatabaseFile,
  type Canvas,
} from '@/lib/actions/canvas';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  Dialog,
  InputDialog,
} from '@/components/ui/dialog';
import { DatabasePicker } from '@/components/ui/database-picker';
import Link from 'next/link';

type DbState =
  | { status: 'checking' }
  | { status: 'ready'; active: string | null; databases: string[] };

export default function DashboardPage() {
  const [db, setDb] = useState<DbState>({ status: 'checking' });
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbBusy, setDbBusy] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Canvas | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Canvas | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Canvas | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [dbDeleteTarget, setDbDeleteTarget] = useState<string | null>(null);

  const activeFilename = db.status === 'ready' ? db.active : null;
  const databases = db.status === 'ready' ? db.databases : [];

  useEffect(() => {
    getDatabaseInfo().then((info) => {
      setDb({ status: 'ready', active: info.active, databases: info.databases });
    });
  }, []);

  useEffect(() => {
    if (!activeFilename) return;
    let cancelled = false;
    listCanvases().then((data) => {
      if (!cancelled) setCanvases(data);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeFilename]);

  async function refresh() {
    setLoading(true);
    const data = await listCanvases();
    setCanvases(data);
    setLoading(false);
  }

  async function reloadDbInfo() {
    const info = await getDatabaseInfo();
    setDb({ status: 'ready', active: info.active, databases: info.databases });
  }

  const handleSelectDatabase = async (filename: string) => {
    setDbBusy(true);
    setDbError(null);
    const result = await selectDatabase({ filename });
    if ('error' in result) {
      setDbError(result.error);
      setDbBusy(false);
      return;
    }
    await reloadDbInfo();
    setDbBusy(false);
    setSwitchOpen(false);
  };

  const handleCreateDatabase = async (name: string) => {
    setDbBusy(true);
    setDbError(null);
    const result = await createDatabaseFile({ name });
    if ('error' in result) {
      setDbError(result.error);
      setDbBusy(false);
      return;
    }
    await reloadDbInfo();
    setDbBusy(false);
    setSwitchOpen(false);
  };

  const handleDeleteDatabase = async () => {
    if (!dbDeleteTarget) return;
    const target = dbDeleteTarget;
    setDbDeleteTarget(null);
    setDbBusy(true);
    setDbError(null);
    const result = await deleteDatabaseFile({ filename: target });
    if ('error' in result) {
      setDbError(result.error);
      setDbBusy(false);
      return;
    }
    await reloadDbInfo();
    setDbBusy(false);
  };

  const handleCreate = async (name: string) => {
    await createCanvas({ name });
    refresh();
  };

  const handleRename = async (name: string) => {
    if (!renameTarget) return;
    await renameCanvas({ id: renameTarget.id, name });
    setRenameTarget(null);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCanvas({ id: deleteTarget.id });
    setDeleteTarget(null);
    refresh();
  };

  const handleDuplicate = async () => {
    if (!duplicateTarget) return;
    await duplicateCanvas({ id: duplicateTarget.id });
    setDuplicateTarget(null);
    refresh();
  };

  const pickerProps = {
    active: activeFilename,
    databases,
    onSelect: handleSelectDatabase,
    onCreate: handleCreateDatabase,
    onDelete: (filename: string) => setDbDeleteTarget(filename),
    error: dbError,
    busy: dbBusy,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PlannerApp</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your business planning canvases
          </p>
        </div>
        {db.status === 'ready' && db.active && (
          <Button onClick={() => setSwitchOpen(true)} disabled={dbBusy}>
            Switch Database…
          </Button>
        )}
      </div>

      {db.status === 'checking' && (
        <div className="text-center py-16 text-gray-400">Checking…</div>
      )}

      {db.status === 'ready' && !db.active && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg py-12 px-8 bg-white">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Load a Canvas Database
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This app operates on SQLite database files managed in the server
              data directory (outside the source code). Open one to view and
              edit its canvases — changes are written directly to the file.
            </p>
          </div>
          <DatabasePicker
            {...pickerProps}
            title="Available Databases"
          />
        </div>
      )}

      {db.status === 'ready' && db.active && (
        <>
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Database: {db.active}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading…</div>
          ) : canvases.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 text-lg mb-4">No canvases yet</p>
              <Button onClick={() => setCreateOpen(true)}>
                Create your first canvas
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {canvases.map((canvas) => (
                <div
                  key={canvas.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:border-gray-300 transition-colors group"
                >
                  <Link
                    href={`/canvas/${canvas.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {canvas.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Created {formatDate(canvas.createdAt)}</span>
                      <span>Updated {formatDate(canvas.updatedAt)}</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRenameTarget(canvas)}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDuplicateTarget(canvas)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(canvas)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        title="Switch Database"
      >
        <DatabasePicker {...pickerProps} />
      </Dialog>

      <InputDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="New Canvas"
        label="Canvas name"
      />

      <InputDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRename}
        title="Rename Canvas"
        label="New name"
        defaultValue={renameTarget?.name}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Canvas"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />

      <ConfirmDialog
        open={duplicateTarget !== null}
        onClose={() => setDuplicateTarget(null)}
        onConfirm={handleDuplicate}
        title="Duplicate Canvas"
        message={`Create a copy of "${duplicateTarget?.name}"?`}
      />

      <ConfirmDialog
        open={dbDeleteTarget !== null}
        onClose={() => setDbDeleteTarget(null)}
        onConfirm={handleDeleteDatabase}
        title="Delete Database"
        message={`Delete the database file "${dbDeleteTarget}"? This removes the file from the data directory and cannot be undone.`}
      />
    </div>
  );
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}