import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { updateProfile, exportUserData, deleteAccount, uploadAvatar, getAuditLog } from '../api/profile';
import type { User } from '../types/auth';

interface ProfileResponse {
  id: string;
  provider: string;
  name: string;
  email: string;
  avatarUrl: string;
}

function mapUser(dto: ProfileResponse): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    avatarUrl: dto.avatarUrl,
    provider: dto.provider as User['provider'],
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], mapUser(data as unknown as ProfileResponse));
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], mapUser(data as unknown as ProfileResponse));
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: exportUserData,
  });
}

export function useAuditLog(page: number = 1) {
  return useQuery({
    queryKey: ['auth', 'audit', page],
    queryFn: () => getAuditLog(page),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      navigate('/');
    },
  });
}
