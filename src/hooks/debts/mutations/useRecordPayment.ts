import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Debt, RecordDebtPaymentInput } from '@/types/debt';
import { QUERY_KEYS } from '@/utils/constants';

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordDebtPaymentInput) => {
      const response = await api.post<{ debt: Debt }>(`/api/debts/${data.debtId}/payment`, {
        monthId: data.monthId,
        amount: data.amount,
      });
      return response.debt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}