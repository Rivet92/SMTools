import { apiGet, apiPost } from '../../api/client';
import type { AuthProvider, User } from './types/auth';

interface CurrentUserDto {
  id: string;
  provider: AuthProvider;
  name: string;
  email: string;
  avatarUrl: string;
}

const mapUser = (dto: CurrentUserDto): User => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  avatarUrl: dto.avatarUrl,
  provider: dto.provider,
});

const OAUTH_LOGIN_BASE = '/api/auth';

export function startOAuthLogin(provider: AuthProvider, returnUrl = '/') {
  const encodedReturnUrl = encodeURIComponent(returnUrl);
  window.location.href = `${OAUTH_LOGIN_BASE}/login/${provider}?returnUrl=${encodedReturnUrl}`;
}

export async function fetchCurrentUser(): Promise<User> {
  const dto = await apiGet<CurrentUserDto>('/auth/me');
  return mapUser(dto);
}

export async function postLogout(): Promise<void> {
  await apiPost('/auth/logout');
}
