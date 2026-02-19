import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { QUERY_KEYS } from '@/utils/constants';

interface DeleteBillParams {
  billId: string;
  monthId: string;
  recurringAction?: 'this_period' | 'this_and_future';
  periodKey?: string;
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billId, recurringAction, periodKey }: DeleteBillParams) => {
      const params: Record<string, string> = {};
      if (recurringAction) params.recurringAction = recurringAction;
      if (periodKey) params.periodKey = periodKey;
      await api.delete(`/api/bills/${billId}`, { params });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bills(variables.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(variables.monthId) });
    },
  });
}