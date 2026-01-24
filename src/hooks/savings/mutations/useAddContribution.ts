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
      const response = await api.post<{ saving: any }>(`/api/savings/${savingId}/contribute`, {
        amount,
        note,
      });
      return response.saving;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}