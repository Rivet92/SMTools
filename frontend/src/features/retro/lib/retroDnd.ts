import type { RetroCard } from '../../../types/models/retro';

const CARD_PREFIX = 'retro-card-';
const GROUP_PREFIX = 'retro-group-';
const UNGROUPED_PREFIX = 'ungrouped-drop-';

export function cardDropId(cardId: string): string {
  return `${CARD_PREFIX}${cardId}`;
}

export function groupDropId(groupId: string): string {
  return `${GROUP_PREFIX}${groupId}`;
}

export function ungroupedDropId(columnId: string): string {
  return `${UNGROUPED_PREFIX}${columnId}`;
}

export function parseDragId(
  id: string,
): { type: 'card' | 'group' | 'ungrouped'; entityId: string } | null {
  if (id.startsWith(CARD_PREFIX)) {
    return { type: 'card', entityId: id.slice(CARD_PREFIX.length) };
  }
  if (id.startsWith(GROUP_PREFIX)) {
    return { type: 'group', entityId: id.slice(GROUP_PREFIX.length) };
  }
  if (id.startsWith(UNGROUPED_PREFIX)) {
    return { type: 'ungrouped', entityId: id.slice(UNGROUPED_PREFIX.length) };
  }
  return null;
}

export function handleCardDrop(
  draggedCardId: string,
  targetCardId: string,
  cards: RetroCard[],
  onMoveCardToGroup: (cardId: string, groupId?: string) => void,
  onCreateGroupFromCards: (firstCardId: string, secondCardId: string, title: string) => void,
): void {
  if (draggedCardId === targetCardId) return;

  const draggedCard = cards.find((c) => c.id === draggedCardId);
  const targetCard = cards.find((c) => c.id === targetCardId);
  if (!draggedCard || !targetCard) return;

  if (targetCard.groupId) {
    onMoveCardToGroup(draggedCardId, targetCard.groupId);
    return;
  }

  if (draggedCard.groupId) {
    onMoveCardToGroup(targetCardId, draggedCard.groupId);
    return;
  }

  const title = targetCard.content.slice(0, 60).trim() || 'Group';
  onCreateGroupFromCards(targetCardId, draggedCardId, title);
}
