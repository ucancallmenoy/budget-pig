import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { MonthlyDashboard } from '@/types/dashboard';
import { QUERY_KEYS } from '@/utils/constants';

export function useMonthlyDashboard(monthId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.monthlyDashboard(monthId || ''),
    queryFn: async () => {
      const response = await api.get<{ dashboard: MonthlyDashboard }>(
        '/api/dashboard/monthly',
        { params: { monthId: monthId! } }
      );
      return response.dashboard;
    },
    enabled: !!monthId,
  });
}