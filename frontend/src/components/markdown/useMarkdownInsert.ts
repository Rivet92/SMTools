import { useCallback } from 'react';

export function useMarkdownInsert(
  value: string,
  onChange: (value: string) => void,
  getTextarea: () => HTMLTextAreaElement | null,
) {
  const insertFormat = useCallback(
    (before: string, after: string, defaultText?: string) => {
      const textarea = getTextarea();
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || defaultText || '';
      const newText = value.slice(0, start) + before + selected + after + value.slice(end);
      onChange(newText);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selected.length;
      });
    },
    [value, onChange, getTextarea],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pastedText = e.clipboardData.getData('text/plain');
      const urlMatch = pastedText.match(/^https?:\/\/[^\s]+$/);
      if (urlMatch) {
        e.preventDefault();
        const textarea = getTextarea();
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = value.slice(start, end);
          const before = value.slice(0, start);
          const after = value.slice(end);
          const linkText = selectedText || pastedText;
          const markdownLink = `[${linkText}](${pastedText})`;
          onChange(before + markdownLink + after);
          requestAnimationFrame(() => {
            const pos = before.length + markdownLink.length;
            textarea.selectionStart = textarea.selectionEnd = pos;
            textarea.focus();
          });
        }
      }
    },
    [value, onChange, getTextarea],
  );

  return { insertFormat, handlePaste };
}
