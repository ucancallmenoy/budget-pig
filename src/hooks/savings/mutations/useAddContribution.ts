import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { QUERY_KEYS } from '@/utils/constants';

interface AddContributionParams {
  savingId: string;
  monthId: string;
  amount: number;
  note?: string;
}

export function useAddContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ savingId, amount, note }: AddContributionParams) => {
      const response = await api.post(`/api/savings/${savingId}/contribute`, {
        amount,
        note,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savings(variables.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(variables.monthId) });
    },
  });
}