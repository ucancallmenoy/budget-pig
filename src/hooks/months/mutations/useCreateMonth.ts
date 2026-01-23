import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Month, CreateMonthInput } from '@/types/month';
import { QUERY_KEYS } from '@/utils/constants';

export function useCreateMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMonthInput) => {
      const response = await api.post<{ month: Month }>('/api/months', data);
      return response.month;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.months });
    },
  });
}