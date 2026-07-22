import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteRoomMutations(
  queryKey: readonly string[],
  deleteForMeFn: (roomId: string) => Promise<void>,
  deleteForEveryoneFn: (roomId: string) => Promise<void>,
) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const deleteForMe = useMutation({
    mutationFn: deleteForMeFn,
    onSuccess: invalidate,
  });

  const deleteForEveryone = useMutation({
    mutationFn: deleteForEveryoneFn,
    onSuccess: invalidate,
  });

  return { deleteForMe, deleteForEveryone };
}
