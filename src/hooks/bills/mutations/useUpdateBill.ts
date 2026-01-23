import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Bill, UpdateBillInput } from '@/types/bill';
import { QUERY_KEYS } from '@/utils/constants';

interface UpdateBillParams {
  billId: string;
  monthId: string;
  data: UpdateBillInput;
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billId, data }: UpdateBillParams) => {
      const response = await api.put<{ bill: Bill }>(`/api/bills/${billId}`, data);
      return response.bill;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bills(variables.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(variables.monthId) });
    },
  });
}