import type { components } from '../generated/api';

export type RetroColumn = components['schemas']['RetroColumnDto'];

export type RetroTemplate = components['schemas']['RetroTemplateResponse'];

export type RetroParticipant = components['schemas']['RetroParticipantDto'];

export type RetroCard = components['schemas']['RetroCardDto'];

export type RetroCardGroup = components['schemas']['RetroCardGroupDto'];

export type RetroActionItem = components['schemas']['RetroActionItemDto'];

export type RetroRoom = components['schemas']['RetroRoomResponse'];

export type MyRetroRoom = components['schemas']['MyRetroRoomResponse'];

export const PHASES = ['Gathering', 'Grouping', 'Voting', 'Actions'] as const;

export type RetroPhase = (typeof PHASES)[number];

export const RetroPhase = {
  Gathering: 'Gathering' as RetroPhase,
  Grouping: 'Grouping' as RetroPhase,
  Voting: 'Voting' as RetroPhase,
  Actions: 'Actions' as RetroPhase,
} as const;

export type RoomState = Omit<components['schemas']['RetroRoomStateDto'], 'phase'> & {
  phase: RetroPhase;
  version: number;
};

export function getRetroTemplateNameKey(templateKey: string): string {
  return `retro.template:${templateKey}:name`;
}

export function getRetroTemplateDescriptionKey(templateKey: string): string {
  return `retro.template:${templateKey}:description`;
}

export function getRetroColumnNameKey(templateKey: string, columnKey: string): string {
  return `retro.template:${templateKey}:column:${columnKey}:name`;
}
