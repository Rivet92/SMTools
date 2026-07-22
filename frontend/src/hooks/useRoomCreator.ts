import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface CreatedRoom {
  id: string;
}

export function useRoomCreator<TItem, TItemId extends string | number>(
  useItems: () => { data: TItem[] | undefined },
  getDefaultItemId: (items: TItem[] | undefined) => TItemId | undefined,
  createRoom: (request: {
    title: string;
    password?: string;
    itemId?: TItemId;
  }) => Promise<CreatedRoom>,
  queryKey: readonly string[],
  clearRoom: () => void,
  navigatePath: (id: string) => string,
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: items } = useItems();

  const defaultItemId = useMemo(() => getDefaultItemId(items), [items, getDefaultItemId]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<TItemId | ''>('');
  const effectiveItemId = selectedItemId ? selectedItemId : (defaultItemId ?? '');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const didInvalidate = useRef(false);
  useEffect(() => {
    if (didInvalidate.current) return;
    didInvalidate.current = true;
    clearRoom();
    queryClient.invalidateQueries({ queryKey });
  }, [clearRoom, queryClient, queryKey]);

  const handleOpenCreateModal = useCallback(() => {
    setCreateTitle('');
    setCreatePassword('');
    setSelectedItemId('');
    setActionError(null);
    setCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setActionError(null);
  }, []);

  const handleCreateRoom = useCallback(async () => {
    if (!createTitle.trim()) return;
    setCreating(true);
    setActionError(null);
    try {
      const result = await createRoom({
        title: createTitle.trim(),
        password: createPassword.trim() || undefined,
        itemId: effectiveItemId || undefined,
      });
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey });
      navigate(navigatePath(result.id), { replace: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('rooms.failedToCreate'));
    } finally {
      setCreating(false);
    }
  }, [
    createTitle,
    createPassword,
    effectiveItemId,
    createRoom,
    queryClient,
    queryKey,
    navigate,
    navigatePath,
    t,
  ]);

  return {
    createModalOpen,
    handleOpenCreateModal,
    handleCloseCreateModal,
    items,
    createTitle,
    setCreateTitle,
    createPassword,
    setCreatePassword,
    selectedItemId: effectiveItemId,
    setSelectedItemId,
    creating,
    actionError,
    setActionError,
    handleCreateRoom,
  };
}
