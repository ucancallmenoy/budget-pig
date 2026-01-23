import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { AnnualDashboard } from '@/types/dashboard';
import { QUERY_KEYS } from '@/utils/constants';

export function useAnnualDashboard(year: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.annualDashboard(year || 0),
    queryFn: async () => {
      const response = await api.get<{ dashboard: AnnualDashboard }>(
        '/api/dashboard/annual',
        { params: { year: year!.toString() } }
      );
      return response.dashboard;
    },
    enabled: !!year,
  });
}