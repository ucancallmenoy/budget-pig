import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';

interface VerifyOTPInput {
  email: string;
  otp: string;
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (data: VerifyOTPInput) => {
      const response = await api.post<{
        message: string;
        user: {
          id: string;
          email: string;
          name: string;
        };
      }>('/api/auth/verify-otp', data);
      return response;
    },
  });
}