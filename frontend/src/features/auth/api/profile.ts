import { apiGet, apiPut, apiDelete } from '../../../api/client';

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string | null;
}

export interface AuditEntryDto {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
  ipAddress: string | null;
}

export interface PagedAuditResponse {
  items: AuditEntryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function getAuditLog(page: number = 1, pageSize: number = 20): Promise<PagedAuditResponse> {
  return apiGet(`/audit?page=${page}&pageSize=${pageSize}`);
}

export function updateProfile(data: UpdateProfileRequest) {
  return apiPut('/auth/profile', data);
}

export async function exportUserData(): Promise<Blob> {
  const response = await fetch('/api/auth/export', { credentials: 'include' });
  if (!response.ok) throw new Error(`Export failed (${response.status})`);
  return response.blob();
}

export function deleteAccount(): Promise<void> {
  return apiDelete('/auth/account');
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface UploadAvatarResponse {
  id: string;
  provider: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/auth/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text ? JSON.parse(text).detail || text : `Upload failed (${response.status})`);
  }

  return response.json();
}
