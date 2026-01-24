import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Debt } from '@/types/debt';
import { QUERY_KEYS } from '@/utils/constants';

export function useDebts(year: number | undefined, month: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.debts(year || 0, month || 0),
    queryFn: async () => {
      const response = await api.get<{ debts: Debt[] }>('/api/debts', {
        params: { 
          year: year!.toString(),
          month: month!.toString()
        },
      });
      return response.debts;
    },
    enabled: !!year && !!month,
  });
}