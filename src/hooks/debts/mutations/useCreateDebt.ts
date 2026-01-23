import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Debt, CreateDebtInput } from '@/types/debt';
import { QUERY_KEYS } from '@/utils/constants';

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDebtInput) => {
      const response = await api.post<{ debt: Debt }>('/api/debts', data);
      return response.debt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts(data.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(data.monthId) });
    },
  });
}