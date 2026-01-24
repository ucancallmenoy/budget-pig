import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Saving } from '@/types/saving';
import { QUERY_KEYS } from '@/utils/constants';

export function useSavings(monthId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.savings(monthId || ''),
    queryFn: async () => {
      const response = await api.get<{ savings: Saving[] }>('/api/savings', {
        params: { monthId: monthId! },
      });
      return response.savings;
    },
    enabled: !!monthId,
  });
}

export function useAllSavings(userId?: string) {
  return useQuery({
    queryKey: ['savings', 'all', userId],
    queryFn: async () => {
      const response = await api.get<{ savings: Saving[] }>('/api/savings/all');
      return response.savings;
    },
    enabled: !!userId,
  });
}