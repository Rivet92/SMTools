import { useNotes } from './useNotes';
import { useNotesMutations } from './useNotesMutations';

export function useNotesData() {
  const { data: notes, isLoading, error } = useNotes();
  const mutations = useNotesMutations();
  return { notes, isLoading, error, ...mutations };
}
