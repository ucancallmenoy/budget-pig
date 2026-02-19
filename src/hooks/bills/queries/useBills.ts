import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Bill } from '@/types/bill';
import { QUERY_KEYS } from '@/utils/constants';
import type { ViewMode } from '@/utils/period';

export function useBills(monthId: string | undefined, viewMode: ViewMode = 'monthly') {
  return useQuery({
    queryKey: [...QUERY_KEYS.bills(monthId || ''), viewMode],
    queryFn: async () => {
      const params: Record<string, string> = { monthId: monthId! };
      if (viewMode !== 'monthly') params.viewMode = viewMode;
      const response = await api.get<{ bills: Bill[] }>('/api/bills', { params });
      return response.bills;
    },
    enabled: !!monthId,
  });
}