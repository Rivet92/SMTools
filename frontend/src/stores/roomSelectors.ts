export interface RoomStateWithParticipants {
  ownParticipantId: string;
  participants: Array<{
    id: string;
    isOwner: boolean;
    isAdmin: boolean;
    isConnected: boolean;
  }>;
}

export const selectIsOwner = <T extends RoomStateWithParticipants | null>(room: T): boolean => {
  if (!room) return false;
  return room.participants.some((p) => p.id === room.ownParticipantId && p.isOwner);
};

export const selectIsAdmin = <T extends RoomStateWithParticipants | null>(room: T): boolean => {
  if (!room) return false;
  const own = room.participants.find((p) => p.id === room.ownParticipantId);
  return own !== undefined && (own.isOwner || own.isAdmin);
};

export const selectConnectedCount = <T extends RoomStateWithParticipants | null>(
  room: T,
): number => {
  if (!room) return 0;
  return room.participants.filter((p) => p.isConnected).length;
};
