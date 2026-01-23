import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Bill, CreateBillInput } from '@/types/bill';
import { QUERY_KEYS } from '@/utils/constants';

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBillInput) => {
      const response = await api.post<{ bill: Bill }>('/api/bills', data);
      return response.bill;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bills(data.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(data.monthId) });
    },
  });
}