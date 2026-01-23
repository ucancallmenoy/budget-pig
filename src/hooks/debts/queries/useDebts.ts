import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Debt } from '@/types/debt';
import { QUERY_KEYS } from '@/utils/constants';

export function useDebts(monthId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.debts(monthId || ''),
    queryFn: async () => {
      const response = await api.get<{ debts: Debt[] }>('/api/debts', {
        params: { monthId: monthId! },
      });
      return response.debts;
    },
    enabled: !!monthId,
  });
}