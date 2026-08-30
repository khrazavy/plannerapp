'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/40 rounded-lg shadow-xl border border-gray-200 p-0 max-w-md w-full"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        {children}
        {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Dialog>
  );
}

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label: string;
  defaultValue?: string;
}

export function InputDialog({
  open,
  onClose,
  onSubmit,
  title,
  label,
  defaultValue = '',
}: InputDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.value = defaultValue;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, defaultValue]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (inputRef.current) {
                const val = inputRef.current.value.trim();
                if (val) {
                  onSubmit(val);
                  onClose();
                }
              }
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        maxLength={120}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = inputRef.current?.value.trim();
            if (val) {
              onSubmit(val);
              onClose();
            }
          }
        }}
      />
    </Dialog>
  );
}
