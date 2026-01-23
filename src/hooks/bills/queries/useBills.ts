import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Bill } from '@/types/bill';
import { QUERY_KEYS } from '@/utils/constants';

export function useBills(monthId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.bills(monthId || ''),
    queryFn: async () => {
      const response = await api.get<{ bills: Bill[] }>('/api/bills', {
        params: { monthId: monthId! },
      });
      return response.bills;
    },
    enabled: !!monthId,
  });
}