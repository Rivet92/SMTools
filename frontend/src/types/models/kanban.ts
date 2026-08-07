import type { components } from '../generated/api';

export type KanbanParticipant = components['schemas']['ParticipantDto'];

export type KanbanColumn = components['schemas']['KanbanColumnDto'];

export type KanbanCardComment = components['schemas']['KanbanCardCommentDto'];

export type KanbanCard = components['schemas']['KanbanCardDto'];

export type KanbanRoom = components['schemas']['KanbanRoomResponse'];

export type MyKanbanRoom = components['schemas']['MyRoomResponse'];

export type RoomState = components['schemas']['KanbanRoomStateDto'] & { version: number };
