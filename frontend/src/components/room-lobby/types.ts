export type SortField = 'title' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export interface RoomListItem {
  id: string;
  title: string;
  createdAt: string;
  isOwner: boolean;
  isAdmin: boolean;
}
