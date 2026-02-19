import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { QUERY_KEYS } from '@/utils/constants';

interface DeleteTransactionParams {
  transactionId: string;
  year: number;
  month: number;
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId }: DeleteTransactionParams) => {
      await api.delete<{ success: boolean }>(`/api/transactions/${transactionId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.transactions(variables.year, variables.month),
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.months });
    },
  });
}
