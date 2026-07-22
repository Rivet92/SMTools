import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Note } from '../../../types/models/notes';
import type { UpdateNoteRequest } from '../../../api/notes';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseNoteEditorOptions {
  note: Note | null;
  onSave: (noteId: string, request: UpdateNoteRequest) => Promise<unknown>;
}

export interface UseNoteEditorResult {
  title: string;
  content: string;
  dirty: boolean;
  saveStatus: SaveStatus;
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  saveNow: () => void;
  discardChanges: () => void;
}

export function useNoteEditor({ note, onSave }: UseNoteEditorOptions): UseNoteEditorResult {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const noteRef = useRef<Note | null>(note);

  const save = useCallback(async () => {
    const currentNote = noteRef.current;
    if (!currentNote || !dirty) return;

    setSaveStatus('saving');
    try {
      await onSave(currentNote.id, { title, content });
      setDirty(false);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [dirty, title, content, onSave]);

  const { debouncedCallback: scheduleSave, cancel: cancelSave } = useDebounce(save, 600);

  const reset = useCallback(
    (nextNote: Note | null) => {
      cancelSave();
      setTitle(nextNote?.title ?? '');
      setContent(nextNote?.content ?? '');
      setDirty(false);
      setSaveStatus('idle');
    },
    [cancelSave],
  );

  useEffect(() => {
    if (note?.id !== noteRef.current?.id) {
      reset(note);
      noteRef.current = note;
    }
  }, [note, reset]);

  const handleSetTitle = useCallback(
    (value: string) => {
      setTitle(value);
      setDirty(true);
      setSaveStatus('idle');
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleSetContent = useCallback(
    (value: string) => {
      setContent(value);
      setDirty(true);
      setSaveStatus('idle');
      scheduleSave();
    },
    [scheduleSave],
  );

  const saveNow = useCallback(() => {
    cancelSave();
    return save();
  }, [cancelSave, save]);

  const discardChanges = useCallback(() => {
    cancelSave();
    reset(note);
  }, [cancelSave, note, reset]);

  return {
    title,
    content,
    dirty,
    saveStatus,
    setTitle: handleSetTitle,
    setContent: handleSetContent,
    saveNow,
    discardChanges,
  };
}
