import { apiGet } from './client';
import { createRoomApi } from './createRoomApi';
import type { RetroTemplate, RetroRoom, MyRetroRoom } from '../types/models/retro';
import type { RoomState } from '../types/models/retro';

export const retroApi = createRoomApi<RetroRoom, MyRetroRoom, RoomState>('/retro');

export async function fetchRetroTemplates(): Promise<RetroTemplate[]> {
  return apiGet('/retro/templates');
}
