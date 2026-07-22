import { type ReactNode, type HTMLProps } from 'react';
import ReactMarkdown from 'react-markdown';

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

function Anchor({ href, children, ...props }: HTMLProps<HTMLAnchorElement>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function ListItem({ children, ...props }: HTMLProps<HTMLLIElement>) {
  const text = extractText(children);
  const checked = /^\s*\[x\]/i.test(text);
  const unchecked = /^\s*\[ \]/.test(text);

  if (checked || unchecked) {
    const label = text.replace(/^\s*\[[x ]\]\s*/i, '');
    return (
      <li {...props} style={{ listStyle: 'none' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={checked} readOnly />
          <span>{label}</span>
        </label>
      </li>
    );
  }

  return <li {...props}>{children}</li>;
}

export interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return <ReactMarkdown components={{ a: Anchor, li: ListItem }}>{content}</ReactMarkdown>;
}
