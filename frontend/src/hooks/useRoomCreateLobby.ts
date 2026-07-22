import { useRoomCreator } from './useRoomCreator';

interface UseRoomCreateLobbyOptions<TItem, TItemId extends string | number> {
  useItems: () => { data: TItem[] | undefined };
  getDefaultItemId: (items: TItem[] | undefined) => TItemId | undefined;
  createRoom: (request: {
    title: string;
    password?: string;
    itemId?: TItemId;
  }) => Promise<{ id: string }>;
  queryKey: readonly string[];
  clearRoom: () => void;
  navigatePath: (id: string) => string;
}

export function useRoomCreateLobby<TItem, TItemId extends string | number>(
  options: UseRoomCreateLobbyOptions<TItem, TItemId>,
) {
  return useRoomCreator<TItem, TItemId>(
    options.useItems,
    options.getDefaultItemId,
    options.createRoom,
    options.queryKey,
    options.clearRoom,
    options.navigatePath,
  );
}
