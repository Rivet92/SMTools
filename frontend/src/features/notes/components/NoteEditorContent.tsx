import { Box, Typography } from '@mui/material';
import { MarkdownEditor, MarkdownPreview } from '../../../components/markdown';
import type { SaveStatus } from '../../../components/markdown/types';

export interface NoteEditorContentProps {
  content: string;
  onContentChange: (value: string) => void;
  isEditing: boolean;
  placeholder: string;
  noContentMessage: string;
  saveStatus: SaveStatus;
  textareaId?: string;
}

export function NoteEditorContent({
  content,
  onContentChange,
  isEditing,
  placeholder,
  noContentMessage,
  saveStatus,
  textareaId,
}: NoteEditorContentProps) {
  return (
    <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
      {isEditing ? (
        <MarkdownEditor
          value={content}
          onChange={onContentChange}
          placeholder={placeholder}
          minRows={8}
          editing
          saveStatus={saveStatus}
          autoFocus={false}
          textareaId={textareaId}
        />
      ) : (
        <Box
          sx={{
            p: 1.5,
            minHeight: 120,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
        >
          {content.trim() ? (
            <MarkdownPreview content={content} />
          ) : (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {noContentMessage}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
