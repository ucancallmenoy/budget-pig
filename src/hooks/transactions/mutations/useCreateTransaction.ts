import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Transaction, CreateTransactionInput } from '@/types/transaction';
import { QUERY_KEYS } from '@/utils/constants';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await api.post<{ transaction: Transaction }>('/api/transactions', data);
      return response.transaction;
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.transactions(transaction.year, transaction.month),
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.months });
    },
  });
}
