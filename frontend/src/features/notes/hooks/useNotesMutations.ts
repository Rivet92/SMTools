import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesQueryKey } from './useNotes';
import {
  createNote,
  updateNote,
  deleteNote,
  toggleArchiveNote,
  reorderNotes,
} from '../../../api/notes';
import type { CreateNoteRequest, UpdateNoteRequest, NoteReorderItem } from '../../../api/notes';
import type { Note } from '../../../types/models/notes';

interface MutationContext {
  previousNotes: [queryKey: readonly unknown[], data: Note[] | undefined][];
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
    return a.position - b.position;
  });
}

export function useNotesMutations() {
  const queryClient = useQueryClient();

  const getPreviousNotes = () => queryClient.getQueriesData<Note[]>({ queryKey: notesQueryKey });

  const rollback = (context: MutationContext | undefined) => {
    context?.previousNotes.forEach(([key, data]) => {
      queryClient.setQueryData(key, data);
    });
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: notesQueryKey });

  const create = useMutation({
    mutationFn: (request: CreateNoteRequest) => createNote(request),
    onSuccess: invalidate,
  });

  const update = useMutation<
    Note,
    Error,
    { noteId: string; request: UpdateNoteRequest },
    MutationContext
  >({
    mutationFn: ({ noteId, request }) => updateNote(noteId, request),
    onMutate: async ({ noteId, request }) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey });
      const previousNotes = getPreviousNotes();
      queryClient.setQueriesData<Note[]>(
        { queryKey: notesQueryKey },
        (old) => old?.map((note) => (note.id === noteId ? { ...note, ...request } : note)) ?? old,
      );
      return { previousNotes };
    },
    onError: (_err, _vars, context) => rollback(context),
    onSettled: invalidate,
  });

  const remove = useMutation<void, Error, string, MutationContext>({
    mutationFn: (noteId) => deleteNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey });
      const previousNotes = getPreviousNotes();
      queryClient.setQueriesData<Note[]>(
        { queryKey: notesQueryKey },
        (old) => old?.filter((note) => note.id !== noteId) ?? old,
      );
      return { previousNotes };
    },
    onError: (_err, _vars, context) => rollback(context),
    onSettled: invalidate,
  });

  const toggleArchive = useMutation<Note, Error, string, MutationContext>({
    mutationFn: (noteId) => toggleArchiveNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey });
      const previousNotes = getPreviousNotes();
      queryClient.setQueriesData<Note[]>({ queryKey: notesQueryKey }, (old) => {
        if (!old) return old;
        const toggled = old.map((note) =>
          note.id === noteId ? { ...note, isArchived: !note.isArchived } : note,
        );
        return sortNotes(toggled);
      });
      return { previousNotes };
    },
    onError: (_err, _vars, context) => rollback(context),
    onSettled: invalidate,
  });

  const reorder = useMutation<void, Error, NoteReorderItem[], MutationContext>({
    mutationFn: (updates) => reorderNotes(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey });
      const previousNotes = getPreviousNotes();
      queryClient.setQueriesData<Note[]>({ queryKey: notesQueryKey }, (old) => {
        if (!old) return old;
        const updateMap = new Map(updates.map((u) => [u.noteId, u]));
        const reordered = old.map((note) => {
          const update = updateMap.get(note.id);
          if (!update) return note;
          return {
            ...note,
            position: update.position,
            isArchived: update.isArchived ?? note.isArchived,
          };
        });
        return sortNotes(reordered);
      });
      return { previousNotes };
    },
    onError: (_err, _vars, context) => rollback(context),
    onSettled: invalidate,
  });

  return { create, update, remove, toggleArchive, reorder };
}
