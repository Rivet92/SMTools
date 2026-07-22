import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { buildPaginationParams } from './utils';
import type { Note } from '../types/models/notes';
import type { PagedResponse } from '../types/models/common';

export async function fetchNotes(
  archived?: boolean,
  page?: number,
  pageSize?: number,
): Promise<PagedResponse<Note>> {
  const params = buildPaginationParams(page, pageSize);
  if (archived !== undefined) params.set('archived', String(archived));
  const qs = params.toString();
  return apiGet(`/notes${qs ? `?${qs}` : ''}`);
}

export interface CreateNoteRequest {
  title?: string;
  content?: string;
}

export async function createNote(request: CreateNoteRequest): Promise<Note> {
  return apiPost('/notes', request);
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

export async function updateNote(noteId: string, request: UpdateNoteRequest): Promise<Note> {
  return apiPut(`/notes/${noteId}`, request);
}

export async function deleteNote(noteId: string): Promise<void> {
  return apiDelete(`/notes/${noteId}`);
}

export async function toggleArchiveNote(noteId: string): Promise<Note> {
  return apiPut(`/notes/${noteId}/archive`);
}

export interface NoteReorderItem {
  noteId: string;
  position: number;
  isArchived?: boolean;
}

export async function reorderNotes(updates: NoteReorderItem[]): Promise<void> {
  return apiPut('/notes/reorder', { updates });
}
