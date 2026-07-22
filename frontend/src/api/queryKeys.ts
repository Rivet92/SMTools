export const planningPoker = {
  myRooms: ['planning-poker-my-rooms'] as const,
  decks: ['planning-poker-decks'] as const,
  results: (roomId: string) => ['planning-poker-results', roomId] as const,
} as const;

export const retro = {
  myRooms: ['retro-my-rooms'] as const,
  templates: ['retro-templates'] as const,
} as const;

export const kanban = {
  myRooms: ['kanban-my-rooms'] as const,
} as const;
