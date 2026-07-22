import { apiGet, apiPost, apiDelete } from './client';
import { buildPaginationParams } from './utils';
import type { PagedResponse } from '../types/models/common';

export interface CreateRoomRequest {
  title: string;
  password?: string;
}

export interface RoomApiEndpoints<TRoom, TMyRoom, TResultState> {
  basePath: string;
  create<T extends CreateRoomRequest = CreateRoomRequest>(request: T): Promise<TRoom>;
  fetchMyRooms(page?: number, pageSize?: number): Promise<PagedResponse<TMyRoom>>;
  removeSelf(roomId: string): Promise<void>;
  delete(roomId: string): Promise<void>;
  fetchResults(roomId: string): Promise<TResultState>;
}

export function createRoomApi<TRoom, TMyRoom, TResultState>(
  basePath: string,
): RoomApiEndpoints<TRoom, TMyRoom, TResultState> {
  return {
    basePath,
    create<T extends CreateRoomRequest = CreateRoomRequest>(request: T) {
      return apiPost(`${basePath}/rooms`, request);
    },
    fetchMyRooms(page, pageSize) {
      const params = buildPaginationParams(page, pageSize);
      const qs = params.toString();
      return apiGet(`${basePath}/rooms/my${qs ? `?${qs}` : ''}`);
    },
    removeSelf(roomId) {
      return apiDelete(`${basePath}/rooms/${roomId}/participants/me`);
    },
    delete(roomId) {
      return apiDelete(`${basePath}/rooms/${roomId}`);
    },
    fetchResults(roomId) {
      return apiGet(`${basePath}/rooms/${roomId}/results`);
    },
  };
}
