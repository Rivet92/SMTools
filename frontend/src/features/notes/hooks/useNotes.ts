import { useQuery } from '@tanstack/react-query';
import { fetchNotes } from '../../../api/notes';
import type { Note } from '../../../types/models/notes';

export const notesQueryKey = ['notes'] as const;

export function useNotes(archived?: boolean) {
  return useQuery<Note[], Error>({
    queryKey: [...notesQueryKey, archived ?? 'active'],
    queryFn: async () => {
      const response = await fetchNotes(archived);
      return response.items;
    },
  });
}
