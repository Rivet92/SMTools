export type AuthProvider = 'google' | 'github';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  provider: AuthProvider;
}
