'use client';

import { useEffect, useRef } from 'react';

interface BlockSnapshotProps {
  contentJson: string;
  placeholder: string;
}

interface ProseNode {
  type: string;
  content?: ProseNode[];
  text?: string;
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
}

function isEmptyContent(json: string): boolean {
  try {
    const doc: ProseNode = JSON.parse(json);
    if (!doc || typeof doc !== 'object') return true;
    if (doc.type === 'doc' && Array.isArray(doc.content)) {
      if (doc.content.length === 0) return true;
      if (doc.content.length === 1) {
        const node = doc.content[0];
        if (node.type === 'paragraph' && (!node.content || node.content.length === 0)) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function BlockSnapshot({ contentJson, placeholder }: BlockSnapshotProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isEmptyContent(contentJson)) {
      ref.current.innerHTML = '';
      return;
    }

    try {
      const doc: ProseNode = JSON.parse(contentJson);
      ref.current.innerHTML = renderProseMirrorToHTML(doc);
    } catch {
      ref.current.innerHTML = '';
    }
  }, [contentJson]);

  if (isEmptyContent(contentJson)) {
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

function renderProseMirrorToHTML(node: ProseNode): string {
  if (!node) return '';
  const children = (node.content || []).map(renderProseMirrorToHTML).join('');

  switch (node.type) {
    case 'doc':
      return children;
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'text': {
      let text = escapeHtml(node.text || '');
      const marks = node.marks || [];
      for (const mark of marks) {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`;
            break;
          case 'italic':
            text = `<em>${text}</em>`;
            break;
          case 'strike':
            text = `<del>${text}</del>`;
            break;
          case 'code':
            text = `<code>${text}</code>`;
            break;
        }
      }
      return text;
    }
    case 'heading': {
      const level = (node.attrs?.level as number) || 2;
      return `<h${level}>${children}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${children}</ul>`;
    case 'orderedList':
      return `<ol>${children}</ol>`;
    case 'listItem':
      return `<li>${children}</li>`;
    case 'hardBreak':
      return '<br/>';
    default:
      return children;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
