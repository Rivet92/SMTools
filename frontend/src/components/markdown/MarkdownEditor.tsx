import { useState, useRef, useCallback, useEffect } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MarkdownPreview } from './MarkdownPreview';
import { MarkdownToolbar } from './MarkdownToolbar';
import { useMarkdownInsert } from './useMarkdownInsert';
import type { SaveStatus } from './types';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  editing?: boolean;
  saveStatus?: SaveStatus;
  fillHeight?: boolean;
  autoFocus?: boolean;
  textareaId?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 5,
  editing,
  saveStatus,
  fillHeight,
  autoFocus = true,
  textareaId,
}: MarkdownEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { t } = useTranslation();
  const isControlled = editing !== undefined;
  const showEditor = isControlled ? editing : isFocused;

  useEffect(() => {
    if (editing && autoFocus) {
      const textarea =
        textareaRef.current ?? containerRef.current?.querySelector<HTMLTextAreaElement>('textarea');
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }
    }
  }, [editing, autoFocus]);

  const isChild = (el: Node | null) => containerRef.current?.contains(el);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!isChild(e.relatedTarget)) {
      setIsFocused(false);
    }
  }, []);

  const getTextarea = (): HTMLTextAreaElement | null =>
    textareaRef.current ?? containerRef.current?.querySelector('textarea') ?? null;

  const { insertFormat, handlePaste } = useMarkdownInsert(value, onChange, getTextarea);

  return (
    <Box
      ref={containerRef}
      sx={
        fillHeight ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : undefined
      }
    >
      {!showEditor ? (
        <Box
          tabIndex={0}
          onFocus={isControlled ? undefined : () => setIsFocused(true)}
          onBlur={handleBlur}
          sx={{
            p: 1.5,
            minHeight: fillHeight ? 0 : minRows * 24,
            flex: fillHeight ? 1 : undefined,
            cursor: isControlled ? 'default' : 'text',
            outline: 'none',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            '&:hover': { borderColor: 'action.active' },
          }}
        >
          {value.trim() ? (
            <MarkdownPreview content={value} />
          ) : (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {placeholder || t('notes.clickToEdit')}
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: fillHeight ? 1 : undefined,
            minHeight: 0,
            border: 1,
            borderColor: 'primary.main',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <MarkdownToolbar onInsertFormat={insertFormat} saveStatus={saveStatus} />
          <TextField
            fullWidth
            multiline
            autoFocus={autoFocus}
            minRows={fillHeight ? 3 : minRows}
            maxRows={fillHeight ? undefined : 20}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            variant="standard"
            inputRef={textareaRef}
            sx={
              fillHeight
                ? {
                    flex: 1,
                    '& .MuiInputBase-root': {
                      height: '100%',
                      '& textarea': { height: '100% !important', alignSelf: 'stretch' },
                    },
                  }
                : undefined
            }
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { p: 1.5, fontFamily: 'monospace', fontSize: '0.9rem' },
              },
              htmlInput: textareaId ? { id: textareaId } : undefined,
            }}
          />
        </Box>
      )}
    </Box>
  );
}
