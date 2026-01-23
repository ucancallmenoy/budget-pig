import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Month } from '@/types/month';
import { QUERY_KEYS } from '@/utils/constants';

export function useMonth(monthId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.month(monthId || ''),
    queryFn: async () => {
      const response = await api.get<{ month: Month }>(`/api/months/${monthId}`);
      return response.month;
    },
    enabled: !!monthId,
  });
}