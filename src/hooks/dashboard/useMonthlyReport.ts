import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { MonthlyReport } from '@/types/dashboard';
import { QUERY_KEYS } from '@/utils/constants';
import type { ViewMode } from '@/utils/period';

export function useMonthlyReport(monthId: string | undefined, viewMode: ViewMode = 'monthly') {
  return useQuery({
    queryKey: [...QUERY_KEYS.monthlyReport(monthId || ''), viewMode],
    queryFn: async () => {
      const params: Record<string, string> = { monthId: monthId! };
      if (viewMode !== 'monthly') params.viewMode = viewMode;
      const response = await api.get<{ report: MonthlyReport }>('/api/dashboard/monthly-report', {
        params,
      });
      return response.report;
    },
    enabled: !!monthId,
  });
}
