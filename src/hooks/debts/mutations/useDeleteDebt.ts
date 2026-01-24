import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { QUERY_KEYS } from '@/utils/constants';

interface DeleteDebtParams {
  debtId: string;
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ debtId }: DeleteDebtParams) => {
      await api.delete(`/api/debts/${debtId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}