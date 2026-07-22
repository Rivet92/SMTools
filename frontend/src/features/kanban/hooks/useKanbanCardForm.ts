import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useKanbanRoomData } from './useKanbanRoomData';
import { useKanbanRoomActions } from './useKanbanRoomActions';
import { useKanbanStore } from '../store/kanbanStore';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Card } from '../store/kanbanStore';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useKanbanCardForm() {
  const navigate = useNavigate();
  const { roomId, cardId } = useParams<{ roomId: string; cardId: string }>();
  const [searchParams] = useSearchParams();

  const isNew = cardId === 'new';
  const columnId = isNew ? searchParams.get('columnId') : null;

  const { room } = useKanbanRoomData();
  const { actionError, setActionError, handleAddCard, handleUpdateCard, handleDeleteCard } =
    useKanbanRoomActions();

  const card = useMemo(() => {
    if (!room || isNew) return null;
    return room.cards.find((c) => c.id === cardId) ?? null;
  }, [room, cardId, isNew]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoBranch, setRepoBranch] = useState('');
  const [initialEstimation, setInitialEstimation] = useState('');
  const [remaining, setRemaining] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [assignedParticipantId, setAssignedParticipantId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isEditing, setIsEditing] = useState(isNew);

  const cardRef = useRef<Card | null>(null);

  useEffect(() => {
    if (card?.id !== cardRef.current?.id) {
      cardRef.current = card;
      setTitle(card?.title ?? '');
      setDescription(card?.description ?? '');
      setRepoUrl(card?.repoUrl ?? '');
      setRepoBranch(card?.repoBranch ?? '');
      setInitialEstimation(card?.initialEstimation != null ? String(card.initialEstimation) : '');
      setRemaining(card?.remaining != null ? String(card.remaining) : '');
      setDueAt(card?.dueAt ? card.dueAt.slice(0, 10) : '');
      setAssignedParticipantId(card?.assignedParticipantId ?? '');
      setDirty(false);
      setSaveStatus('idle');
    }
  }, [card]);

  const save = useCallback(async () => {
    if (!dirty) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setSaveStatus('saving');
    try {
      const trimmedRepoUrl = repoUrl.trim() || undefined;
      const trimmedRepoBranch = repoBranch.trim() || undefined;
      const parsedInitialEst = initialEstimation ? parseFloat(initialEstimation) : undefined;
      const parsedRemaining = remaining ? parseFloat(remaining) : undefined;
      const parsedDueAt = dueAt.trim() || undefined;
      const parsedAssignee = assignedParticipantId.trim() || undefined;
      if (isNew) {
        await handleAddCard(
          columnId!,
          trimmedTitle,
          description.trim() || undefined,
          trimmedRepoUrl,
          trimmedRepoBranch,
          isNaN(parsedInitialEst!) ? undefined : parsedInitialEst,
          isNaN(parsedRemaining!) ? undefined : parsedRemaining,
          parsedDueAt,
          parsedAssignee,
        );
        const updatedRoom = useKanbanStore.getState().room;
        const newCard = updatedRoom?.cards.find(
          (c) => c.columnId === columnId && c.title === trimmedTitle,
        );
        if (newCard) {
          navigate(`/tools/kanban/${roomId}/${newCard.id}`, { replace: true });
        }
      } else {
        if (!cardRef.current) return;
        await handleUpdateCard(
          cardRef.current.id,
          trimmedTitle,
          description.trim() || undefined,
          trimmedRepoUrl,
          trimmedRepoBranch,
          isNaN(parsedInitialEst!) ? undefined : parsedInitialEst,
          isNaN(parsedRemaining!) ? undefined : parsedRemaining,
          parsedDueAt,
          parsedAssignee,
        );
        setDirty(false);
        setSaveStatus('saved');
      }
    } catch {
      setSaveStatus('error');
    }
  }, [
    dirty,
    isNew,
    title,
    description,
    repoUrl,
    repoBranch,
    initialEstimation,
    remaining,
    dueAt,
    assignedParticipantId,
    handleAddCard,
    handleUpdateCard,
    columnId,
    roomId,
    navigate,
  ]);

  const { debouncedCallback: scheduleSave, cancel: cancelSave } = useDebounce(save, 600);

  useEffect(() => {
    return () => cancelSave();
  }, [cancelSave]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      setDirty(true);
      setSaveStatus('idle');
      cancelSave();
      scheduleSave();
    },
    [scheduleSave, cancelSave],
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setDescription(value);
      setDirty(true);
      setSaveStatus('idle');
      cancelSave();
      scheduleSave();
    },
    [scheduleSave, cancelSave],
  );

  const makeFieldChangeHandler = useCallback(
    (setter: (v: string) => void) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        setDirty(true);
        setSaveStatus('idle');
        cancelSave();
        scheduleSave();
      };
    },
    [scheduleSave, cancelSave],
  );

  const makeNumericHandler = useCallback(
    (setter: (v: string) => void) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        const filtered = e.target.value.replace(/[^0-9.]/g, '');
        setter(filtered);
        setDirty(true);
        setSaveStatus('idle');
        cancelSave();
        scheduleSave();
      };
    },
    [scheduleSave, cancelSave],
  );

  const isValidUrl = useCallback((url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const handleAssignedParticipantChange = useCallback(
    (value: string) => {
      setAssignedParticipantId(value);
      setDirty(true);
      setSaveStatus('idle');
      cancelSave();
      scheduleSave();
    },
    [cancelSave, scheduleSave],
  );

  return {
    room,
    card,
    isNew,
    columnId,
    roomId,
    actionError,
    setActionError,
    handleDeleteCard,
    title,
    description,
    repoUrl,
    repoBranch,
    initialEstimation,
    remaining,
    dueAt,
    assignedParticipantId,
    handleAssignedParticipantChange,
    setRepoUrl,
    setRepoBranch,
    setInitialEstimation,
    setRemaining,
    setDueAt,
    saveStatus,
    isEditing,
    setIsEditing,
    handleTitleChange,
    handleDescriptionChange,
    makeFieldChangeHandler,
    makeNumericHandler,
    isValidUrl,
  };
}
