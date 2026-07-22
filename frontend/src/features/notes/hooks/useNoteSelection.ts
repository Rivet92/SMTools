import { useState, useCallback, useMemo } from 'react';
import type { Note } from '../../../types/models/notes';

export interface UseNoteSelectionOptions {
  notes: Note[] | undefined;
}

export interface UseNoteSelectionResult {
  selectedNoteId: string | null;
  selectedNote: Note | null;
  selectNote: (noteId: string | null) => void;
  handleCreateNote: (note: Note) => void;
  handleDeleteNote: (noteId: string) => void;
}

export function useNoteSelection({ notes }: UseNoteSelectionOptions): UseNoteSelectionResult {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => notes?.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const selectNote = useCallback((noteId: string | null) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleCreateNote = useCallback((note: Note) => {
    setSelectedNoteId(note.id);
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setSelectedNoteId((current) => (current === noteId ? null : current));
  }, []);

  return {
    selectedNoteId,
    selectedNote,
    selectNote,
    handleCreateNote,
    handleDeleteNote,
  };
}
