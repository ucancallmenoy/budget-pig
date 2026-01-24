import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Saving, CreateSavingInput } from '@/types/saving';
import { QUERY_KEYS } from '@/utils/constants';

export function useCreateSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSavingInput) => {
      const response = await api.post<{ saving: Saving }>('/api/savings', data);
      return response.saving;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}