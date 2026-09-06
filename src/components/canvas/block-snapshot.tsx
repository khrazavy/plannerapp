'use client';

import { useEffect, useRef } from 'react';
import {
  isEmptyProseJson,
  renderProseMirrorJsonToHTML,
} from '@/lib/prosemirror-render';

interface BlockSnapshotProps {
  contentJson: string;
  placeholder: string;
}

export function BlockSnapshot({ contentJson, placeholder }: BlockSnapshotProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isEmptyProseJson(contentJson)) {
      ref.current.innerHTML = '';
      return;
    }
    ref.current.innerHTML = renderProseMirrorJsonToHTML(contentJson);
  }, [contentJson]);

  if (isEmptyProseJson(contentJson)) {
    return (
      <p className="text-gray-400 text-sm italic leading-snug">{placeholder}</p>
    );
  }

  return (
    <div
      ref={ref}
      className="prose prose-sm max-w-none text-gray-700 leading-snug line-clamp-[8] overflow-hidden
                 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-0.5
                 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-0.5
                 [&_li]:my-0
                 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-1 [&_h2]:mb-0.5
                 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mt-1 [&_h3]:mb-0.5
                 [&_p]:my-0.5"
    />
  );
}