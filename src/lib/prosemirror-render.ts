export interface ProseNode {
  type: string;
  content?: ProseNode[];
  text?: string;
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
}

export function isEmptyProseJson(json: string): boolean {
  try {
    const doc: unknown = JSON.parse(json);
    if (!doc || typeof doc !== 'object') return true;
    const node = doc as ProseNode;
    if (node.type !== 'doc') return true;
    const content = node.content;
    if (!Array.isArray(content) || content.length === 0) return true;
    if (content.length === 1) {
      const child = content[0];
      if (child.type === 'paragraph' && (!child.content || child.content.length === 0)) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function parseProseJson(json: string): ProseNode | null {
  try {
    const doc = JSON.parse(json) as ProseNode;
    if (!doc || typeof doc !== 'object') return null;
    return doc;
  } catch {
    return null;
  }
}

export function renderProseMirrorJsonToHTML(json: string): string {
  const doc = parseProseJson(json);
  return doc ? renderProseMirrorToHTML(doc) : '';
}

export function renderProseMirrorToHTML(node: ProseNode): string {
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

export function renderProseMirrorJsonToMarkdown(json: string): string {
  const doc = parseProseJson(json);
  return doc ? renderProseMirrorToMarkdown(doc) : '';
}

export function renderProseMirrorToMarkdown(node: ProseNode): string {
  if (!node) return '';

  switch (node.type) {
    case 'doc':
      return (node.content || []).map(renderProseMirrorToMarkdown).join('');
    case 'paragraph':
      return `${(node.content || []).map(renderProseMirrorToMarkdown).join('')}\n\n`;
    case 'text': {
      const raw = node.text || '';
      const marks = node.marks || [];
      const isCode = marks.some((m) => m.type === 'code');
      let text = isCode ? raw : escapeMarkdown(raw);
      for (const mark of marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'strike':
            text = `~~${text}~~`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
        }
      }
      return text;
    }
    case 'heading': {
      const level = Math.min(Math.max((node.attrs?.level as number) || 2, 1), 3);
      const text = (node.content || []).map(renderProseMirrorToMarkdown).join('');
      return `${'#'.repeat(level)} ${text}\n\n`;
    }
    case 'bulletList':
      return `${renderListItems(node, false, 1, '')}\n\n`;
    case 'orderedList':
      return `${renderListItems(node, true, 1, '')}\n\n`;
    case 'listItem':
      return renderListItems(node, false, 1, '');
    case 'hardBreak':
      return '\n';
    default:
      return (node.content || []).map(renderProseMirrorToMarkdown).join('');
  }
}

function renderListItems(
  node: ProseNode,
  ordered: boolean,
  start: number,
  indent: string
): string {
  const items = node.content || [];
  const out: string[] = [];

  items.forEach((item, index) => {
    const bullet = ordered ? `${start + index}.` : '-';
    const chunks: string[] = [];

    for (const child of item.content || []) {
      if (child.type === 'paragraph') {
        const text = (child.content || []).map(renderProseMirrorToMarkdown).join('');
        if (text) chunks.push(text);
      } else if (child.type === 'bulletList' || child.type === 'orderedList') {
        const nested = renderListItems(child, child.type === 'orderedList', 1, `${indent}  `);
        if (nested) chunks.push(`\n${nested}`);
      } else {
        const text = renderProseMirrorToMarkdown(child).trim();
        if (text) chunks.push(text);
      }
    }

    const body = chunks.join('\n');
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        out.push(`${indent}${bullet} ${lines[0]}`);
      } else {
        out.push(`${indent}  ${lines[i]}`);
      }
    }
  });

  return out.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeMarkdown(str: string): string {
  return str.replace(/([\\`*_\[\]<>#~])/g, '\\$1');
}