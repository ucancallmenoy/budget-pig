import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { QUERY_KEYS } from '@/utils/constants';

interface DeleteSavingParams {
  savingId: string;
  monthId: string;
}

export function useDeleteSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ savingId }: DeleteSavingParams) => {
      await api.delete(`/api/savings/${savingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}