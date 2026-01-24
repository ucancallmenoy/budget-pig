import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Bill, RecordBillPaymentInput } from '@/types/bill';
import { QUERY_KEYS } from '@/utils/constants';

export function useRecordBillPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordBillPaymentInput) => {
      const response = await api.post<{ bill: Bill }>(`/api/bills/${data.billId}/payment`, {
        monthId: data.monthId,
        amount: data.amount,
      });
      return response.bill;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bills(variables.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(variables.monthId) });
    },
  });
}