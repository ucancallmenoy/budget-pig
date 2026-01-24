import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '@/utils/api';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await api.post<{
        message: string;
        email: string;
      }>('/api/auth/register', data);
      return response;
    },
  });
}