import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Debt, UpdateDebtInput } from '@/types/debt';
import { QUERY_KEYS } from '@/utils/constants';

interface UpdateDebtParams {
  debtId: string;
  monthId: string;
  data: UpdateDebtInput;
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ debtId, data }: UpdateDebtParams) => {
      const response = await api.put<{ debt: Debt }>(`/api/debts/${debtId}`, data);
      return response.debt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts(variables.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(variables.monthId) });
    },
  });
}